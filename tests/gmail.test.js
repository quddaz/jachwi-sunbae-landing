import test from 'node:test';
import assert from 'node:assert/strict';

import { createGmailSender } from '../api/lib/gmail.js';

test('Gmail 전송기는 체크리스트 메시지와 계정 설정을 SMTP에 전달한다', async () => {
  const transportOptions = [];
  const messages = [];
  const send = createGmailSender({
    env: {
      GMAIL_USER: 'owner@gmail.com',
      GMAIL_APP_PASSWORD: 'secret',
    },
    createTransportImpl(options) {
      transportOptions.push(options);
      return {
        async sendMail(message) {
          messages.push(message);
          return { messageId: 'mail_1' };
        },
      };
    },
  });

  const result = await send({
    to: 'reader@example.com',
    subject: '25개 체크리스트',
    html: '<p>본문</p>',
    text: '본문',
  });

  assert.deepEqual(transportOptions, [{
    service: 'gmail',
    auth: { user: 'owner@gmail.com', pass: 'secret' },
  }]);
  assert.deepEqual(messages, [{
    from: '자취선배 <owner@gmail.com>',
    replyTo: 'owner@gmail.com',
    to: 'reader@example.com',
    subject: '25개 체크리스트',
    html: '<p>본문</p>',
    text: '본문',
  }]);
  assert.deepEqual(result, { messageId: 'mail_1' });
});

test('Gmail 설정이 빠지면 SMTP 전송기를 만들기 전에 거부한다', () => {
  assert.throws(
    () => createGmailSender({
      env: {},
      createTransportImpl() {
        throw new Error('must not run');
      },
    }),
    /GMAIL_NOT_CONFIGURED/,
  );
});
