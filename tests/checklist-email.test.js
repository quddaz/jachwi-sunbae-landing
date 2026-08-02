import test from 'node:test';
import assert from 'node:assert/strict';

import { escapeHtml, renderChecklistEmail } from '../api/lib/checklist-email.js';

test('체크리스트 이메일은 스물다섯 항목과 혜택 안내를 포함한다', () => {
  const email = renderChecklistEmail();

  assert.match(email.subject, /자취선배/);
  assert.equal((email.text.match(/^\d+\./gm) || []).length, 25);
  assert.match(email.text, /지역과 신청 시점/);
  assert.match(email.text, /정부24 혜택알리미/);
  assert.match(email.text, /복지로 복지서비스 찾기/);
  assert.match(email.text, /마이홈포털/);
  assert.match(email.html, /25개/);
});

test('HTML 특수 문자를 안전하게 표시한다', () => {
  assert.equal(
    escapeHtml('<script>alert("x") & goodbye</script>'),
    '&lt;script&gt;alert(&quot;x&quot;) &amp; goodbye&lt;/script&gt;',
  );
});
