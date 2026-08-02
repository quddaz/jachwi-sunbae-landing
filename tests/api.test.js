import test from 'node:test';
import assert from 'node:assert/strict';

import { createHandler } from '../api/send-checklist.js';

function fakeResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

const configuredEnv = {
  RESEND_API_KEY: 'test-key',
  RESEND_FROM_EMAIL: '자취선배 <checklist@example.com>',
  RESEND_REPLY_TO_EMAIL: 'team@example.com',
};

const validBody = {
  email: 'user@example.com',
  privacyConsent: true,
  followUpConsent: false,
  company: '',
};

test('POST 외 요청은 허용 메서드와 함께 거부한다', async () => {
  const response = fakeResponse();
  const handler = createHandler({ fetchImpl: async () => {}, env: configuredEnv });

  await handler({ method: 'GET', headers: {} }, response);

  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, 'POST');
  assert.deepEqual(response.body, { ok: false, code: 'METHOD_NOT_ALLOWED' });
});

test('8KB를 초과하는 요청을 Resend 호출 전에 거부한다', async () => {
  let called = false;
  const response = fakeResponse();
  const handler = createHandler({
    fetchImpl: async () => {
      called = true;
    },
    env: configuredEnv,
  });

  await handler({
    method: 'POST',
    headers: { 'content-length': '9000' },
    body: validBody,
  }, response);

  assert.equal(response.statusCode, 413);
  assert.equal(called, false);
});

test('잘못된 폼 입력은 검증 오류 코드를 반환한다', async () => {
  const response = fakeResponse();
  const handler = createHandler({ fetchImpl: async () => {}, env: configuredEnv });

  await handler({ method: 'POST', headers: {}, body: { ...validBody, email: 'wrong' } }, response);

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, { ok: false, code: 'INVALID_EMAIL' });
});

test('메일 환경 변수가 빠지면 외부 호출 없이 실패한다', async () => {
  let called = false;
  const response = fakeResponse();
  const handler = createHandler({
    fetchImpl: async () => {
      called = true;
    },
    env: { RESEND_API_KEY: 'test-key' },
  });

  await handler({ method: 'POST', headers: {}, body: validBody }, response);

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, { ok: false, code: 'SERVER_NOT_CONFIGURED' });
  assert.equal(called, false);
});

test('정상 입력은 체크리스트 이메일을 발송한다', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options, body: JSON.parse(options.body) });
    return {
      ok: true,
      status: 200,
      json: async () => ({ id: 'email_1' }),
    };
  };
  const response = fakeResponse();
  const handler = createHandler({ fetchImpl, env: configuredEnv });

  await handler({ method: 'POST', headers: {}, body: validBody }, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { ok: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.resend.com/emails');
  assert.deepEqual(calls[0].body.to, ['user@example.com']);
  assert.equal(calls[0].body.reply_to, 'team@example.com');
  assert.match(calls[0].options.headers.Authorization, /^Bearer /);
  assert.match(calls[0].options.headers['User-Agent'], /jachwi-sunbae/);
});

test('선택 동의한 사용자는 Resend Segment에 연락처로 등록한 뒤 메일을 받는다', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return {
      ok: true,
      status: 200,
      json: async () => ({ id: `result_${calls.length}` }),
    };
  };
  const response = fakeResponse();
  const handler = createHandler({
    fetchImpl,
    env: { ...configuredEnv, RESEND_SEGMENT_ID: 'segment_1' },
  });

  await handler({
    method: 'POST',
    headers: {},
    body: { ...validBody, followUpConsent: true },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, 'https://api.resend.com/contacts');
  assert.deepEqual(calls[0].body, {
    email: 'user@example.com',
    unsubscribed: false,
    segments: [{ id: 'segment_1' }],
  });
  assert.equal(calls[1].url, 'https://api.resend.com/emails');
});

test('연락처 등록 실패는 체크리스트 발송을 막지 않는다', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    if (url.endsWith('/contacts')) {
      return { ok: false, status: 409, json: async () => ({ message: 'exists' }) };
    }
    return { ok: true, status: 200, json: async () => ({ id: 'email_1' }) };
  };
  const response = fakeResponse();
  const handler = createHandler({
    fetchImpl,
    env: { ...configuredEnv, RESEND_SEGMENT_ID: 'segment_1' },
    logger: { warn() {} },
  });

  await handler({
    method: 'POST',
    headers: {},
    body: { ...validBody, followUpConsent: true },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, [
    'https://api.resend.com/contacts',
    'https://api.resend.com/emails',
  ]);
});

test('Resend 이메일 발송 실패는 502로 전달한다', async () => {
  const response = fakeResponse();
  const handler = createHandler({
    fetchImpl: async () => ({
      ok: false,
      status: 500,
      json: async () => ({ message: 'provider failed' }),
    }),
    env: configuredEnv,
  });

  await handler({ method: 'POST', headers: {}, body: validBody }, response);

  assert.equal(response.statusCode, 502);
  assert.deepEqual(response.body, { ok: false, code: 'SEND_FAILED' });
});
