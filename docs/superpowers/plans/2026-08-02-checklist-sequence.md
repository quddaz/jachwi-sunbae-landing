# Checklist Stage Sequence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 체크리스트 미리보기를 `방 선택 5개 → 이사 전 주거 혜택`의 두 단계 시퀀스로 표시한다.

**Architecture:** 기존 정적 `index.html`의 미리보기 카드를 의미 있는 두 개의 목록으로 분리하고, `src/styles.css`에서 세로 단계선과 단계별 카드 스타일을 추가한다. 데이터나 이메일 체크리스트 수량은 건드리지 않으며 정적 HTML 테스트로 구조와 문구를 고정한다.

**Tech Stack:** HTML5, CSS3, Node.js 기본 테스트 러너

## Global Constraints

- 고시원 점검 항목은 정확히 25개로 유지한다.
- 방 선택 미리보기 항목은 정확히 5개로 유지한다.
- 주거 혜택은 25개 점검 항목과 분리된 추가 정보로 표시한다.
- 모바일 390px에서 가로 스크롤 없이 `방 선택 → 이사 전` 순서로 표시한다.
- 새 JavaScript와 새 외부 의존성은 추가하지 않는다.

---

### Task 1: 미리보기 카드를 두 단계 시퀀스로 변경

**Files:**
- Modify: `tests/static.test.js:39`
- Modify: `index.html:117-136`
- Modify: `src/styles.css:479-536`
- Modify: `src/styles.css:817-837`

**Interfaces:**
- Consumes: 기존 `.preview`, `.preview__paper`, `.preview__body` 레이아웃과 25개 체크리스트 문구
- Produces: `.preview__sequence`, `.preview__step`, `.preview__step-list`, `.preview__step--benefits` 정적 UI 구조

- [ ] **Step 1: 실패하는 정적 구조 테스트 작성**

`tests/static.test.js`에 다음 테스트를 추가한다.

```js
test('체크리스트 미리보기는 방 선택 다음 이사 전 혜택 순서로 보여준다', async () => {
  const html = await readProjectFile('index.html');
  const roomSelection = html.match(
    /<section class="preview__step"[\s\S]*?<ol class="preview__step-list">([\s\S]*?)<\/ol>/,
  );

  assert.ok(roomSelection);
  assert.equal((roomSelection[1].match(/<li>/g) || []).length, 5);
  assert.match(html, /<span>01<\/span>[\s\S]*방 선택/);
  assert.match(html, /<span>02<\/span>[\s\S]*이사 전/);
  assert.match(html, /내 지역 주거 혜택 확인/);
  assert.ok(html.indexOf('방 선택') < html.indexOf('이사 전'));
});
```

- [ ] **Step 2: 테스트가 올바르게 실패하는지 확인**

Run:

```bash
/Users/quda/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/static.test.js
```

Expected: `roomSelection`이 `null`이어서 새 테스트만 FAIL한다.

- [ ] **Step 3: 두 단계 HTML 구조 구현**

`index.html`의 `.preview__checks`와 `.preview__more`를 다음 구조로 교체한다.

```html
<div class="preview__sequence">
  <section class="preview__step" aria-labelledby="room-step-title">
    <div class="preview__step-heading">
      <span>01</span>
      <h3 id="room-step-title">방 선택</h3>
    </div>
    <ol class="preview__step-list">
      <li>로드뷰 주변 업종</li>
      <li>창문과 환기</li>
      <li>수압과 온수</li>
      <li>벽 재질과 방음</li>
      <li>계약과 퇴실 조건</li>
    </ol>
    <p class="preview__more">+ 방문 전부터 계약까지 20개 항목 더</p>
  </section>
  <section class="preview__step preview__step--benefits" aria-labelledby="benefit-step-title">
    <div class="preview__step-heading">
      <span>02</span>
      <h3 id="benefit-step-title">이사 전</h3>
    </div>
    <p class="preview__step-kicker">내 지역 주거 혜택 확인</p>
    <p>청년 월세·이사비·보증료 지원을 공식 사이트에서 확인하는 방법도 함께 보내드려요.</p>
  </section>
</div>
```

- [ ] **Step 4: 단계 시퀀스 CSS 구현**

`src/styles.css`에서 기존 `.preview__checks` 규칙을 제거하고 다음 책임의 규칙을 추가한다.

```css
.preview__sequence {
  position: relative;
  display: grid;
  gap: 18px;
  margin-top: 32px;
}

.preview__step {
  position: relative;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--surface);
}

.preview__step + .preview__step::before {
  position: absolute;
  top: -19px;
  left: 35px;
  width: 2px;
  height: 18px;
  background: var(--orange);
  content: "";
}

.preview__step-heading {
  display: flex;
  gap: 12px;
  align-items: center;
}

.preview__step-heading span {
  color: var(--orange-dark);
  font-size: 0.78rem;
  font-weight: 900;
}

.preview__step-heading h3 {
  margin: 0;
  font-size: 1.15rem;
}

.preview__step-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 20px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}

.preview__step-list li {
  position: relative;
  padding: 12px 0 12px 28px;
  border-bottom: 1px solid var(--line);
}

.preview__step-list li::before {
  position: absolute;
  top: 13px;
  left: 0;
  width: 16px;
  height: 16px;
  border: 2px solid var(--orange);
  border-radius: 5px;
  content: "";
}

.preview__step--benefits {
  background: var(--orange-soft);
}

.preview__step-kicker {
  margin: 16px 0 6px;
  color: var(--orange-dark);
  font-weight: 900;
}
```

480px 이하 미디어 쿼리에서는 `.preview__step-list`를 단일 열로 바꾸고 `.preview__step` 패딩을 `20px`로 설정한다.

- [ ] **Step 5: 대상 테스트와 전체 검증 실행**

Run:

```bash
/Users/quda/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/static.test.js
/Users/quda/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test
/Users/quda/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-static.js
git diff --check
```

Expected: 정적 테스트 6개와 전체 테스트 29개가 PASS하고 정적 검사와 `git diff --check`가 성공한다.

- [ ] **Step 6: 구현 커밋**

```bash
git add index.html src/styles.css tests/static.test.js
git commit -m "feat: show checklist as staged journey"
```

### Task 2: GitHub 게시와 Vercel 배포 검증

**Files:**
- No code changes

**Interfaces:**
- Consumes: Task 1의 커밋과 기존 GitHub/Vercel 연결
- Produces: 공개 배포 페이지의 최신 2단계 시퀀스

- [ ] **Step 1: GitHub 원격 저장소에 변경 파일 반영**

로컬 셸 네트워크가 허용되면 `git push origin main`을 사용한다. 차단되면 GitHub 연결 도구로 `index.html`, `src/styles.css`, `tests/static.test.js`, 디자인 문서와 이 계획 문서를 같은 `main` 브랜치에 반영한다.

- [ ] **Step 2: Vercel 자동 배포 완료 확인**

Vercel 프로젝트 `jachwi-sunbae-landing`의 최신 배포가 `Ready`인지 확인한다.

- [ ] **Step 3: 공개 페이지 모바일 QA**

`https://jachwi-sunbae-landing.vercel.app`을 390×844 뷰포트로 열어 다음을 확인한다.

- `방 선택` 단계에 항목 5개가 있다.
- 이어지는 `이사 전` 단계에 `내 지역 주거 혜택 확인`이 있다.
- 단계 순서가 위에서 아래로 자연스럽다.
- 가로 스크롤이나 잘림이 없다.

- [ ] **Step 4: 최종 상태 확인**

Run:

```bash
git status --short
```

Expected: 출력 없음.
