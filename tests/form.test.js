import test from 'node:test';
import assert from 'node:assert/strict';

import { createSubmissionPayload, submitChecklist } from '../src/form.js';

test('폼 데이터를 API 요청 형식으로 변환한다', () => {
  const data = new FormData();
  data.set('email', 'user@example.com');
  data.set('privacyConsent', 'on');
  data.set('company', '');

  assert.deepEqual(createSubmissionPayload(data), {
    email: 'user@example.com',
    privacyConsent: true,
    followUpConsent: false,
    company: '',
  });
});

test('성공 응답을 호출자가 사용할 수 있는 결과로 바꾼다', async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({ ok: true }),
  });

  assert.deepEqual(
    await submitChecklist({ fetchImpl, payload: { email: 'user@example.com' } }),
    { ok: true },
  );
});

test('API 오류 코드를 호출자에게 전달한다', async () => {
  const fetchImpl = async () => ({
    ok: false,
    json: async () => ({ ok: false, code: 'SEND_FAILED' }),
  });

  assert.deepEqual(
    await submitChecklist({ fetchImpl, payload: { email: 'user@example.com' } }),
    { ok: false, code: 'SEND_FAILED' },
  );
});

test('응답 본문을 읽을 수 없어도 안전한 오류를 반환한다', async () => {
  const fetchImpl = async () => ({
    ok: false,
    json: async () => {
      throw new SyntaxError('invalid json');
    },
  });

  assert.deepEqual(
    await submitChecklist({ fetchImpl, payload: {} }),
    { ok: false, code: 'UNEXPECTED_ERROR' },
  );
});

test('네트워크 예외를 사용자용 오류로 바꾼다', async () => {
  const fetchImpl = async () => {
    throw new TypeError('network down');
  };

  assert.deepEqual(
    await submitChecklist({ fetchImpl, payload: {} }),
    { ok: false, code: 'NETWORK_ERROR' },
  );
});
