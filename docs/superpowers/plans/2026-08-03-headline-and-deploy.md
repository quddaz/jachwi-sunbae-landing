# Direct Headline and Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the direct loss-avoidance hero headline, merge the completed room-view hero into `main`, push it to GitHub, and verify the production deployment.

**Architecture:** Change only the two hero headline text nodes and the matching static regression assertion. Preserve the existing room image, responsive layout, CTA, form, and API behavior; integrate the reviewed feature branch into `main` with a normal merge and use the repository's existing Vercel deployment configuration.

**Tech Stack:** Semantic HTML5, Node.js built-in test runner, Git, GitHub, Vercel.

## Global Constraints

- The first headline line must be exactly `사진만 믿고 계약했다가`.
- The accent headline line must be exactly `한 달 내내 후회할 수 있어요`.
- Keep the eyebrow, description, CTA, room image, inspection points, form, and API unchanged.
- Do not force-push or rewrite `main` history.
- Deploy only after the complete test and static-check suite passes on the merged `main` tree.

---

### Task 1: Restore the Direct Hero Headline

**Files:**
- Modify: `tests/static.test.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: the existing `#hero-title` heading and static HTML regression suite.
- Produces: the exact approved two-line headline while preserving all existing hero styling hooks. Human-facing prose is verified in the browser rather than frozen by a source-string test.

- [ ] **Step 1: Remove the existing headline change-detector assertions**

Remove these two source-string assertions from `tests/static.test.js`:

```js
assert.match(html, /사진보다 먼저/);
assert.match(html, /살아갈 방을 확인하세요/);
```

- [ ] **Step 2: Verify the structural hero test still passes**

Run:

```bash
/Users/quda/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  --test --test-name-pattern="몰입형 히어로" tests/static.test.js
```

Expected: PASS because the test still protects the responsive room image, CTA destination, and inspection-point structure without freezing human-facing prose.

- [ ] **Step 3: Replace only the two heading lines**

Set the existing heading to:

```html
<h1 id="hero-title" class="animate-fade-up animate-delay-1">
  사진만 믿고 계약했다가<br>
  <span>한 달 내내 후회할 수 있어요</span>
</h1>
```

- [ ] **Step 4: Run the targeted and complete checks**

Run:

```bash
/Users/quda/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  --test --test-name-pattern="몰입형 히어로" tests/static.test.js
/Users/quda/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test
/Users/quda/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-static.js
```

Expected: the targeted test passes, all 30 tests pass, and static checks pass.

Open the local page and assert through the rendered DOM that `#hero-title` is visible with the exact text `사진만 믿고 계약했다가 한 달 내내 후회할 수 있어요`.

- [ ] **Step 5: Commit the approved headline**

```bash
git add index.html tests/static.test.js
git commit -m "feat: restore direct hero headline"
```

### Task 2: Merge, Push, and Verify Production

**Files:**
- Inspect: `vercel.json`
- Inspect: `README.md`

**Interfaces:**
- Consumes: the clean `feat/room-view-hero` branch and `origin` GitHub remote.
- Produces: tested `main` commit on GitHub and a verified Vercel production deployment.

- [ ] **Step 1: Fetch remote state without modifying local history**

```bash
git fetch origin
git status --short
git log --oneline --decorate -5 origin/main
```

Expected: the feature worktree is clean and remote `main` is visible for comparison.

- [ ] **Step 2: Merge the feature branch into local `main`**

From the primary checkout:

```bash
git checkout main
git pull --ff-only origin main
git merge --no-ff feat/room-view-hero -m "merge: add immersive room-view hero"
```

Expected: the merge completes without conflicts.

- [ ] **Step 3: Verify the merged tree before pushing**

```bash
/Users/quda/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test
/Users/quda/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-static.js
git diff --check HEAD^ HEAD
```

Expected: all 30 tests pass, static checks pass, and no whitespace errors are reported.

- [ ] **Step 4: Push the tested merge to GitHub**

```bash
git push origin main
```

Expected: `origin/main` advances to the local merge commit without force-push.

- [ ] **Step 5: Verify the Vercel production deployment**

From the tested primary checkout, create a production deployment and capture the URL printed by Vercel:

```bash
production_url=$(vercel deploy --prod)
vercel inspect "$production_url" --wait --timeout=5m
vercel curl / --deployment "$production_url"
```

Expected: `vercel inspect` reports the deployment as `READY`, and `vercel curl` returns HTML containing `사진만 믿고 계약했다가`, `한 달 내내 후회할 수 있어요`, `/assets/room-view-hero.webp`, and `href="#get-checklist"`.

Open `$production_url` in the browser and confirm the room hero image renders, the CTA scrolls to the signup section, and no console errors are present.

- [ ] **Step 6: Report the production URL and commit**

Report the final `main` commit SHA, production URL, test count, and deployment state. Preserve the feature worktree until production verification has succeeded.
