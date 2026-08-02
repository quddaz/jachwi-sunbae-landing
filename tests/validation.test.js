import test from 'node:test';
import assert from 'node:assert/strict';

import { validateSubmission } from '../api/lib/validation.js';

test('유효한 이메일을 정규화한다', () => {
  assert.deepEqual(
    validateSubmission({
      email: ' USER@Example.COM ',
      privacyConsent: true,
      followUpConsent: false,
      company: '',
    }),
    {
      ok: true,
      value: {
        email: 'user@example.com',
        privacyConsent: true,
        followUpConsent: false,
      },
    },
  );
});

test('객체가 아닌 요청 본문을 거부한다', () => {
  assert.deepEqual(validateSubmission(null), {
    ok: false,
    status: 400,
    code: 'INVALID_BODY',
  });
});

test('잘못된 이메일을 거부한다', () => {
  assert.equal(
    validateSubmission({
      email: 'not-an-email',
      privacyConsent: true,
      company: '',
    }).code,
    'INVALID_EMAIL',
  );
});

test('필수 개인정보 동의가 없으면 거부한다', () => {
  assert.equal(
    validateSubmission({
      email: 'user@example.com',
      privacyConsent: false,
      company: '',
    }).code,
    'PRIVACY_CONSENT_REQUIRED',
  );
});

test('숨겨진 회사 필드가 채워지면 봇 요청으로 거부한다', () => {
  assert.equal(
    validateSubmission({
      email: 'user@example.com',
      privacyConsent: true,
      company: 'spam',
    }).code,
    'BOT_DETECTED',
  );
});
