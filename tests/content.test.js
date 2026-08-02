import test from 'node:test';
import assert from 'node:assert/strict';

import { LANDING_TIPS } from '../src/content.js';
import { BENEFIT_LINKS, CHECKLIST_SECTIONS } from '../api/lib/checklist.js';

test('랜딩에는 여섯 가지 핵심 조언만 공개한다', () => {
  assert.equal(LANDING_TIPS.length, 6);
});

test('이메일 체크리스트는 정확히 스물다섯 가지다', () => {
  assert.equal(CHECKLIST_SECTIONS.flatMap(({ items }) => items).length, 25);
});

test('주거 혜택은 HTTPS 정부 공식 사이트에서 확인하게 한다', () => {
  assert.ok(BENEFIT_LINKS.length >= 3);

  for (const link of BENEFIT_LINKS) {
    const url = new URL(link.url);
    assert.equal(url.protocol, 'https:');
    assert.match(
      url.hostname,
      /(^|\.)(gov\.kr|go\.kr|bokjiro\.go\.kr|myhome\.go\.kr)$/,
    );
  }
});
