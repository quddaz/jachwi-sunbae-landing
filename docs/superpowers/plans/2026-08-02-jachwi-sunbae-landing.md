# 자취선배 랜딩 페이지 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 인스타그램 광고에서 유입된 사용자가 고시원 계약 전 점검의 필요성을 이해하고 이메일로 25개 체크리스트와 주거 혜택 확인 방법을 즉시 받을 수 있는 모바일 우선 랜딩 페이지를 구축한다.

**Architecture:** 빌드가 필요 없는 정적 HTML·CSS·JavaScript를 Vercel에서 제공하고, `/api/send-checklist` 서버리스 함수만 Resend REST API를 호출한다. 콘텐츠, 입력 검증, 이메일 템플릿을 작은 모듈로 분리해 Node 기본 테스트 러너로 검증하며, API 비밀값은 Vercel 환경 변수에만 둔다.

**Tech Stack:** HTML5, CSS3, 브라우저 ES Modules, Node.js 20+, Node `node:test`, Vercel Functions, Resend REST API, GitHub, Vercel

## Global Constraints

- 서비스명은 `자취선배`다.
- 인스타그램 인앱 브라우저를 우선하고 320px 이상에서 가로 스크롤이 없어야 한다.
- 따뜻한 아이보리 배경과 주황색 강조색을 사용한다.
- 욕설, 비하, 검증되지 않은 절대적 단정을 사용하지 않는다.
- 랜딩 페이지에는 전체 25개 중 핵심 조언만 공개한다.
- 이메일에는 고시원 점검 항목 25개와 공식 주거 혜택 확인 경로를 포함한다.
- 특정 지원 금액이나 고정 자격 조건을 단정하지 않는다.
- 필수 개인정보 처리 동의와 선택 후속 연락 동의를 분리한다.
- Resend API 키를 정적 파일이나 Git 기록에 포함하지 않는다.
- 별도 데이터베이스, 로그인, 매물 저장·비교, 계약서 분석은 구현하지 않는다.

---

## 파일 구조

- `index.html`: 랜딩 페이지의 시맨틱 문서 구조와 전환 폼
- `privacy.html`: 이메일 수집·처리 안내
- `src/styles.css`: 모바일 우선 레이아웃과 시각 디자인
- `src/app.js`: 폼 상태, 브라우저 검증, API 제출, 성공·실패 처리
- `src/content.js`: 랜딩 페이지에 공개할 핵심 조언 데이터
- `api/send-checklist.js`: Vercel HTTP 요청 처리와 Resend 호출 조율
- `api/lib/validation.js`: 서버 입력 정규화와 검증
- `api/lib/checklist.js`: 25개 체크리스트와 공식 혜택 확인 경로 데이터
- `api/lib/checklist-email.js`: 발송할 HTML·텍스트 이메일 생성
- `tests/content.test.js`: 공개 콘텐츠와 25개 항목의 계약 검증
- `tests/validation.test.js`: 이메일·동의·허니팟 검증
- `tests/checklist-email.test.js`: 이메일 렌더링과 HTML 이스케이프 검증
- `tests/api.test.js`: Resend 호출, Contact·Segment 등록, 오류 응답 검증
- `assets/favicon.svg`: 자취선배 집 모양 파비콘
- `assets/og-image.svg`: 공유 미리보기 원본
- `.env.example`: 필요한 Vercel 환경 변수 이름
- `.gitignore`: 로컬 비밀값과 Vercel 메타데이터 제외
- `package.json`: Node 버전과 테스트 명령
- `vercel.json`: 정적 문서와 API 함수의 보안 헤더
- `README.md`: 로컬 실행, 테스트, Resend·Vercel 설정, 배포 절차

---

### Task 1: 콘텐츠 계약과 입력 검증 기반

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `src/content.js`
- Create: `api/lib/checklist.js`
- Create: `api/lib/validation.js`
- Test: `tests/content.test.js`
- Test: `tests/validation.test.js`

**Interfaces:**
- Produces: `LANDING_TIPS: Array<{ id: string, eyebrow: string, title: string, body: string }>`
- Produces: `CHECKLIST_SECTIONS: Array<{ title: string, items: string[] }>`
- Produces: `BENEFIT_LINKS: Array<{ label: string, url: string, description: string }>`
- Produces: `validateSubmission(input: unknown): { ok: true, value: { email: string, privacyConsent: true, followUpConsent: boolean } } | { ok: false, status: number, code: string }`

- [ ] **Step 1: 테스트 러너와 실패하는 콘텐츠 계약 테스트 작성**

`package.json`에 ESM과 Node 테스트 명령을 선언한다.

```json
{
  "name": "jachwi-sunbae-landing",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "test": "node --test",
    "check": "node --test && node scripts/check-static.js"
  }
}
```

`tests/content.test.js`는 전체 체크리스트가 정확히 25개이고, 랜딩 팁이 6개이며, 혜택 링크가 HTTPS 공식 경로만 사용하는지 검사한다.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { LANDING_TIPS } from '../src/content.js';
import { CHECKLIST_SECTIONS, BENEFIT_LINKS } from '../api/lib/checklist.js';

test('공개 팁은 6개이고 이메일 체크리스트는 25개다', () => {
  assert.equal(LANDING_TIPS.length, 6);
  assert.equal(CHECKLIST_SECTIONS.flatMap(({ items }) => items).length, 25);
});

test('혜택 링크는 HTTPS 공식 사이트를 사용한다', () => {
  assert.ok(BENEFIT_LINKS.length >= 3);
  for (const link of BENEFIT_LINKS) {
    assert.match(link.url, /^https:\/\//);
    assert.match(new URL(link.url).hostname, /(gov\.kr|go\.kr|bokjiro\.go\.kr|myhome\.go\.kr)$/);
  }
});
```

- [ ] **Step 2: 콘텐츠 테스트가 모듈 부재로 실패하는지 확인**

Run: `npm test -- tests/content.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/content.js` or `api/lib/checklist.js`.

- [ ] **Step 3: 공개 팁과 25개 체크리스트 데이터 구현**

`src/content.js`에는 로드뷰 주변 업종, 층간 소음, 개인 냉방, 외창, 책상, 한 달 계약의 6개 팁을 넣는다. `api/lib/checklist.js`에는 설계 문서의 방문 전 5개, 방과 생활 옵션 9개, 현장 점검 9개, 계약 전 2개를 그대로 넣는다. 혜택 링크는 구현 시 공식 사이트에서 현재 URL을 확인한 복지로, 정부24·보조금24, 마이홈포털 경로로 제한한다.

- [ ] **Step 4: 콘텐츠 테스트 통과 확인**

Run: `npm test -- tests/content.test.js`

Expected: 2 tests PASS.

- [ ] **Step 5: 실패하는 입력 검증 테스트 작성**

`tests/validation.test.js`에 정상 입력 정규화, 잘못된 이메일, 필수 동의 누락, 허니팟 입력, 문자열이 아닌 본문을 검증한다.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSubmission } from '../api/lib/validation.js';

test('이메일을 소문자로 정규화한다', () => {
  assert.deepEqual(validateSubmission({
    email: ' USER@Example.COM ', privacyConsent: true, followUpConsent: false, company: ''
  }), {
    ok: true,
    value: { email: 'user@example.com', privacyConsent: true, followUpConsent: false }
  });
});

test('필수 동의가 없으면 거부한다', () => {
  assert.equal(validateSubmission({ email: 'user@example.com', privacyConsent: false, company: '' }).code, 'PRIVACY_CONSENT_REQUIRED');
});

test('허니팟이 채워지면 봇 요청으로 거부한다', () => {
  assert.equal(validateSubmission({ email: 'user@example.com', privacyConsent: true, company: 'spam' }).code, 'BOT_DETECTED');
});
```

- [ ] **Step 6: 검증 테스트 실패 확인**

Run: `npm test -- tests/validation.test.js`

Expected: FAIL because `validateSubmission` is not exported.

- [ ] **Step 7: 최소 입력 검증 구현**

`validateSubmission`은 일반 객체만 받고, 254자 이하의 기본 이메일 형식, `privacyConsent === true`, 빈 `company` 허니팟을 검사한다. 성공 시 이메일을 trim·lowercase하고 선택 동의를 boolean으로 정규화한다. 오류 코드는 `INVALID_BODY`, `INVALID_EMAIL`, `PRIVACY_CONSENT_REQUIRED`, `BOT_DETECTED` 중 하나다.

- [ ] **Step 8: Task 1 테스트 통과 확인**

Run: `npm test -- tests/content.test.js tests/validation.test.js`

Expected: all tests PASS.

- [ ] **Step 9: 기반 파일과 테스트 커밋**

```bash
git add package.json .gitignore .env.example src/content.js api/lib/checklist.js api/lib/validation.js tests/content.test.js tests/validation.test.js
git commit -m "feat: define landing content and submission validation"
```

---

### Task 2: 모바일 랜딩 페이지와 시각 디자인

**Files:**
- Create: `index.html`
- Create: `src/styles.css`
- Create: `assets/favicon.svg`
- Create: `assets/og-image.svg`
- Create: `scripts/check-static.js`
- Test: `tests/static.test.js`

**Interfaces:**
- Consumes: `LANDING_TIPS` from `src/content.js`
- Produces: DOM IDs `#lead-form`, `#email`, `#privacy-consent`, `#follow-up-consent`, `#company`, `#submit-button`, `#form-status`, `#tips-list`

- [ ] **Step 1: 실패하는 정적 문서 계약 테스트 작성**

`tests/static.test.js`는 `index.html`에 언어, viewport, 설명, Open Graph, 단일 H1, 폼 ID, 필수 동의, 선택 동의, 개인정보 링크가 있는지 검사한다. `scripts/check-static.js`는 `index.html`, `privacy.html`, `src/styles.css`, `src/app.js`의 존재와 정적 파일 내 비밀키 패턴 부재를 검사하도록 작성하되, 이 단계에서는 `privacy.html`과 `src/app.js`가 아직 없어 해당 두 파일은 Task 5에서 검사 목록에 추가한다.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('랜딩 문서에 모바일 메타데이터와 전환 폼이 있다', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<html lang="ko">/);
  assert.match(html, /name="viewport"/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  for (const id of ['lead-form', 'email', 'privacy-consent', 'follow-up-consent', 'company', 'submit-button', 'form-status', 'tips-list']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});
```

- [ ] **Step 2: 정적 문서 테스트 실패 확인**

Run: `npm test -- tests/static.test.js`

Expected: FAIL because `index.html` does not exist.

- [ ] **Step 3: 시맨틱 랜딩 문서 구현**

`index.html`을 `header`, `main`, `section`, `form`, `footer` 구조로 만들고 다음 순서를 유지한다.

1. 자취선배 브랜드와 `고시원 계약 전 5분만`
2. `사진만 믿고 계약했다가 한 달 내내 후회할 수 있어요`
3. 상단 CTA 앵커
4. 경험 기반 핵심 조언 6개가 들어갈 `#tips-list`
5. `이사할 지역에서 받을 수 있는 주거 혜택, 알고 계세요?`
6. `지금 보신 내용은 일부예요`와 `총 25개` 강조
7. 이메일, 필수 동의, 선택 동의, 숨겨진 `company` 필드, 제출 버튼, 상태 메시지
8. 개인정보 처리 안내와 생활 정보 면책 문구

- [ ] **Step 4: 모바일 우선 스타일 구현**

`src/styles.css`에 아이보리·주황색 CSS 사용자 정의 속성, 최소 44px 터치 영역, 최대 680px 콘텐츠 너비, 320px 미디어쿼리 검증이 가능한 유동형 타이포그래피를 작성한다. `overflow-x: hidden`으로 문제를 숨기지 말고 모든 그리드에 `minmax(0, 1fr)`와 긴 텍스트 줄바꿈을 적용한다. `prefers-reduced-motion`에서는 전환 애니메이션을 제거한다.

- [ ] **Step 5: 브랜드 SVG 자산 구현**

`favicon.svg`는 집 윤곽과 체크 표시만 사용하고, `og-image.svg`는 `사진에는 안 보이는 고시원 체크 포인트 25개`와 자취선배 로고를 1200×630 비율로 표현한다.

- [ ] **Step 6: 정적 검사 스크립트 구현 및 테스트 통과 확인**

Run: `npm test -- tests/static.test.js`

Expected: all tests PASS.

Run: `node scripts/check-static.js`

Expected: prints `Static checks passed` and exits 0.

- [ ] **Step 7: 랜딩 구조와 스타일 커밋**

```bash
git add index.html src/styles.css assets/favicon.svg assets/og-image.svg scripts/check-static.js tests/static.test.js
git commit -m "feat: build mobile-first landing page"
```

---

### Task 3: 전환 폼 브라우저 동작

**Files:**
- Create: `src/form.js`
- Create: `src/app.js`
- Test: `tests/form.test.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: `POST /api/send-checklist` with `{ email, privacyConsent, followUpConsent, company }`
- Produces: `createSubmissionPayload(formData): object`
- Produces: `submitChecklist({ fetchImpl, payload }): Promise<{ ok: boolean, code?: string }>`
- Produces: `renderTips(container, tips): void`

- [ ] **Step 1: 실패하는 폼 로직 테스트 작성**

`tests/form.test.js`는 FormData 정규화, 성공 응답, JSON 오류 응답, 네트워크 오류를 검사한다. DOM이 필요한 `renderTips`는 작은 가짜 container 객체의 `replaceChildren` 호출 여부와 생성 결과를 검사하지 않고, 정적 문서에 데이터가 서버 렌더링되도록 방향을 단순화한다. 따라서 `src/content.js`는 빌드 없는 환경에서 직접 import하고 `#tips-list`에 안전한 `textContent`만 사용한다.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSubmissionPayload, submitChecklist } from '../src/form.js';

test('폼 데이터를 API payload로 바꾼다', () => {
  const data = new FormData();
  data.set('email', 'user@example.com');
  data.set('privacyConsent', 'on');
  assert.deepEqual(createSubmissionPayload(data), {
    email: 'user@example.com', privacyConsent: true, followUpConsent: false, company: ''
  });
});

test('API 오류 코드를 호출자에게 전달한다', async () => {
  const fetchImpl = async () => ({ ok: false, json: async () => ({ code: 'SEND_FAILED' }) });
  assert.deepEqual(await submitChecklist({ fetchImpl, payload: {} }), { ok: false, code: 'SEND_FAILED' });
});
```

- [ ] **Step 2: 폼 테스트 실패 확인**

Run: `npm test -- tests/form.test.js`

Expected: FAIL because `src/form.js` does not exist.

- [ ] **Step 3: 프레임워크 없는 폼 모듈 구현**

`src/form.js`는 payload 생성과 `fetch('/api/send-checklist')` 호출을 담당한다. 네트워크 예외는 `{ ok: false, code: 'NETWORK_ERROR' }`로 바꾼다. `src/app.js`는 팁 렌더링, 폼 submit 이벤트, 제출 중 버튼 비활성화, 성공 시 폼 reset, 오류 코드별 한국어 메시지 표시를 담당한다.

- [ ] **Step 4: 랜딩 문서에 앱 모듈 연결**

`index.html` 끝에 `<script type="module" src="/src/app.js"></script>`를 추가한다. `#form-status`는 `aria-live="polite"`, 오류 시 `role="alert"`를 적용하고 성공 시 입력창으로 불필요하게 포커스를 이동하지 않는다.

- [ ] **Step 5: 폼 테스트 통과 확인**

Run: `npm test -- tests/form.test.js`

Expected: all tests PASS.

- [ ] **Step 6: 폼 동작 커밋**

```bash
git add index.html src/form.js src/app.js tests/form.test.js
git commit -m "feat: add checklist signup interaction"
```

---

### Task 4: 체크리스트 이메일과 Vercel API

**Files:**
- Create: `api/lib/checklist-email.js`
- Create: `api/send-checklist.js`
- Test: `tests/checklist-email.test.js`
- Test: `tests/api.test.js`

**Interfaces:**
- Consumes: `CHECKLIST_SECTIONS`, `BENEFIT_LINKS`
- Consumes: `validateSubmission(input)`
- Produces: `escapeHtml(value: string): string`
- Produces: `renderChecklistEmail(): { subject: string, html: string, text: string }`
- Produces: default Vercel handler `(request, response) => Promise<void>`
- Produces: named `createHandler({ fetchImpl, env }): handler` for deterministic tests

- [ ] **Step 1: 실패하는 이메일 템플릿 테스트 작성**

`tests/checklist-email.test.js`는 제목에 자취선배가 있고, HTML과 text 모두 25개 항목을 포함하며, 공식 혜택 링크와 변동 가능성 안내가 있고, `escapeHtml('<script>')`가 태그를 무력화하는지 검사한다.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, renderChecklistEmail } from '../api/lib/checklist-email.js';

test('체크리스트 이메일은 25개 항목과 혜택 안내를 포함한다', () => {
  const email = renderChecklistEmail();
  assert.match(email.subject, /자취선배/);
  assert.equal((email.text.match(/^\d+\./gm) || []).length, 25);
  assert.match(email.text, /지역과 신청 시점/);
});

test('HTML 특수 문자를 이스케이프한다', () => {
  assert.equal(escapeHtml('<script>'), '&lt;script&gt;');
});
```

- [ ] **Step 2: 이메일 템플릿 테스트 실패 확인**

Run: `npm test -- tests/checklist-email.test.js`

Expected: FAIL because `api/lib/checklist-email.js` does not exist.

- [ ] **Step 3: HTML·텍스트 이메일 구현**

이메일은 외부 CSS 없이 인라인 스타일만 사용하고, 각 항목 앞에 빈 체크박스 기호를 둔다. 하단에는 공식 혜택 링크와 `지원 조건은 거주 지역과 신청 시점에 따라 달라질 수 있으니 공식 공고를 확인해 주세요`를 표시한다. 수신자 이메일은 본문에 삽입하지 않는다.

- [ ] **Step 4: 이메일 템플릿 테스트 통과 확인**

Run: `npm test -- tests/checklist-email.test.js`

Expected: all tests PASS.

- [ ] **Step 5: 실패하는 API 테스트 작성**

`tests/api.test.js`는 POST 외 메서드 405, 잘못된 입력 400, 비밀값 누락 500, 정상 Resend `/emails` 호출 200, 선택 동의 시 `/contacts` 선행 호출과 Segment 지정, Resend 실패 502를 가짜 `fetchImpl`과 가짜 response로 검사한다.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../api/send-checklist.js';

test('POST 외 메서드를 거부한다', async () => {
  const response = fakeResponse();
  await createHandler({ fetchImpl: async () => {}, env: {} })({ method: 'GET' }, response);
  assert.equal(response.statusCode, 405);
});

test('정상 입력은 Resend 이메일 API를 호출한다', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({ id: 'email_1' }) };
  };
  const response = fakeResponse();
  const handler = createHandler({ fetchImpl, env: {
    RESEND_API_KEY: 'test-key',
    RESEND_FROM_EMAIL: '자취선배 <checklist@example.com>',
    RESEND_REPLY_TO_EMAIL: 'team@example.com'
  }});
  await handler({ method: 'POST', body: {
    email: 'user@example.com', privacyConsent: true, followUpConsent: false, company: ''
  }}, response);
  assert.equal(response.statusCode, 200);
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /api\.resend\.com\/emails$/);
});
```

`fakeResponse()`는 `status(code)`, `json(body)`, `setHeader(name, value)`를 제공하는 테스트 내부 헬퍼로 완성한다.

- [ ] **Step 6: API 테스트 실패 확인**

Run: `npm test -- tests/api.test.js`

Expected: FAIL because `api/send-checklist.js` does not exist.

- [ ] **Step 7: Vercel API 핸들러 구현**

핸들러는 요청 본문 JSON 크기가 8KB를 넘으면 413을 반환하고, 허용 메서드는 POST뿐이다. `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO_EMAIL` 중 하나라도 없으면 `SERVER_NOT_CONFIGURED`를 반환한다. 선택 동의와 `RESEND_SEGMENT_ID`가 모두 있을 때만 Contact 생성과 Segment 등록을 시도한다. 연락처 등록 실패는 이메일 발송을 막지 않지만 서버 로그에는 이메일 원문 없이 오류 코드만 기록한다. 이메일 발송 실패는 `SEND_FAILED`와 502를 반환한다.

- [ ] **Step 8: 이메일·API 테스트 통과 확인**

Run: `npm test -- tests/checklist-email.test.js tests/api.test.js`

Expected: all tests PASS.

- [ ] **Step 9: 이메일 API 커밋**

```bash
git add api/lib/checklist-email.js api/send-checklist.js tests/checklist-email.test.js tests/api.test.js
git commit -m "feat: send checklist through Resend"
```

---

### Task 5: 개인정보 안내, 보안 헤더와 운영 문서

**Files:**
- Create: `privacy.html`
- Create: `vercel.json`
- Create: `README.md`
- Modify: `scripts/check-static.js`
- Modify: `.env.example`
- Test: `tests/static.test.js`

**Interfaces:**
- Consumes: environment variables `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO_EMAIL`, optional `RESEND_SEGMENT_ID`
- Produces: deployment-ready repository documentation and privacy page

- [ ] **Step 1: 개인정보·보안 요구사항을 정적 테스트에 추가**

`tests/static.test.js`에 `privacy.html`의 수집 항목, 이용 목적, Resend 처리, 보관·삭제 문의 안내, 선택 동의 철회 안내가 있는지 검사한다. `vercel.json`에는 `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`가 있어야 한다.

- [ ] **Step 2: 확장된 정적 테스트 실패 확인**

Run: `npm test -- tests/static.test.js`

Expected: FAIL because `privacy.html` and `vercel.json` do not exist.

- [ ] **Step 3: 개인정보 처리 안내 구현**

`privacy.html`에는 이메일 주소, 필수 발송 목적, 선택 후속 연락 목적, Resend 위탁 처리, 보관 기간을 명시한다. 삭제나 선택 동의 철회는 받은 체크리스트 이메일에 답장해 요청할 수 있다고 안내하고, API 발송 요청의 `reply_to`에는 `RESEND_REPLY_TO_EMAIL`을 사용한다.

- [ ] **Step 4: Vercel 보안 설정 구현**

`vercel.json`에 모든 정적 경로의 보안 헤더와 `/api/*`의 `Cache-Control: no-store`를 설정한다. CSP는 자체 리소스, 인라인 SVG 데이터 이미지, `/api/send-checklist` 연결만 허용하고 외부 스크립트는 허용하지 않는다.

- [ ] **Step 5: 운영 문서와 환경 변수 예시 작성**

`.env.example`은 다음 이름만 포함한다.

```dotenv
RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_REPLY_TO_EMAIL=
RESEND_SEGMENT_ID=
```

`README.md`에 Node 20+, `npm test`, `npx serve .`, Resend 발신 도메인 검증, Vercel 프로젝트 연결, 네 환경 변수 설정, Preview·Production 발송 점검, 답장 수신 주소 설정 절차를 순서대로 기록한다.

- [ ] **Step 6: 전체 정적·단위 테스트 통과 확인**

Run: `npm run check`

Expected: all Node tests PASS and `Static checks passed`.

- [ ] **Step 7: 운영 준비 커밋**

```bash
git add privacy.html vercel.json README.md scripts/check-static.js .env.example tests/static.test.js
git commit -m "docs: add privacy and deployment configuration"
```

---

### Task 6: 브라우저 QA, GitHub 게시와 Vercel 배포

**Files:**
- Modify only if QA finds a verified issue: `index.html`, `privacy.html`, `src/styles.css`, `src/app.js`, `api/*.js`, tests

**Interfaces:**
- Consumes: completed local Git repository on `main`
- Produces: public GitHub repository `jachwi-sunbae-landing`
- Produces: Vercel Production URL

- [ ] **Step 1: 전체 테스트와 비밀값 검사를 새로 실행**

Run: `npm run check`

Expected: all tests PASS and no `re_` API key pattern in tracked files.

Run: `git status --short`

Expected: no output.

- [ ] **Step 2: 로컬 정적 서버에서 모바일 브라우저 QA**

Run: `npx serve .`

320px, 390px, 768px, 1440px에서 히어로, 6개 조언, 혜택 훅, 25개 강조, 폼, 개인정보 링크를 확인한다. 키보드 탭 순서, 필수 동의 오류, 네트워크 오류 메시지, reduced-motion을 확인한다. 발견된 문제는 실패 재현 테스트를 먼저 추가한 뒤 수정하고 다시 `npm run check`를 실행한다.

- [ ] **Step 3: GitHub 공개 저장소 생성과 푸시**

GitHub 연결 계정을 확인하고 `jachwi-sunbae-landing` 공개 저장소가 없는지 조회한다. 없는 경우 설명을 `인스타 광고용 자취선배 고시원 체크리스트 랜딩 페이지`로 생성하고 로컬 `main`을 `origin/main`에 푸시한다. 이미 존재하면 임의로 덮어쓰지 말고 원격 상태를 확인한다.

- [ ] **Step 4: Vercel 프로젝트 연결과 환경 변수 설정**

GitHub 저장소를 Vercel 새 프로젝트로 연결한다. Framework Preset은 `Other`, Build Command는 비워 두고 Output Directory는 `.`로 설정한다. 사용자에게 받은 실제 `RESEND_API_KEY`, 검증된 `RESEND_FROM_EMAIL`, 답장 수신용 `RESEND_REPLY_TO_EMAIL`, 선택적인 `RESEND_SEGMENT_ID`를 Preview와 Production 환경 변수에 저장한다.

- [ ] **Step 5: Production 배포와 실제 이메일 확인**

Production 배포 후 제공 URL에서 이메일을 제출한다. 수신함에서 제목, 25개 항목, 공식 혜택 링크를 확인한다. 브라우저 Network에서 `/api/send-checklist`가 200을 반환하는지 확인하고, 페이지에 성공 메시지가 표시되는지 확인한다.

- [ ] **Step 6: 최종 상태 기록**

README에 실제 Production URL을 추가하고 커밋·푸시한다.

```bash
git add README.md
git commit -m "docs: add production URL"
git push origin main
```

- [ ] **Step 7: 최종 검증**

Run: `npm run check`

Expected: all tests PASS.

GitHub 기본 브랜치의 마지막 커밋과 Vercel Production 배포 커밋이 같은지 확인한다. 사용자에게 저장소 URL, 배포 URL, 이메일 발송 검증 결과, 필요한 운영 환경 변수를 전달한다.
