# Room-View Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current illustrated two-column hero with a responsive, full-screen, photorealistic gosiwon room-view hero that preserves the existing checklist conversion flow.

**Architecture:** Keep the existing static HTML/CSS/vanilla JavaScript application and replace only the header/hero presentation. Use a locally stored generated room image rendered through a responsive `<picture>`, CSS overlays and hotspots, and CSS-only motion with a reduced-motion fallback; leave form and API behavior untouched.

**Tech Stack:** Semantic HTML5, vanilla CSS, Node.js built-in test runner, local WebP assets, ImageGen for the source artwork.

## Global Constraints

- The camera view must feel like standing at the doorway of a realistic, compact Korean gosiwon room.
- The visible room must include a bed, usable desk and chair, exterior window, wall, and storage.
- Avoid horror, extreme neglect, luxury-hotel styling, and misleadingly large room proportions.
- Keep the existing `#get-checklist` CTA destination and all form/email behavior unchanged.
- Use `#030305`, `#ffffff`, `#d5d5d5`, `#8a63f8`, `rgba(20, 20, 25, 0.48)`, and `rgba(255, 255, 255, 0.12)` for the immersive hero tokens.
- Disable decorative motion when `prefers-reduced-motion: reduce` is active.
- Preserve the existing orange visual system below the hero.
- Do not add a runtime JavaScript dependency.

---

## File Map

- `index.html`: immersive hero semantics, responsive room image, copy, CTA, and three inspection hotspots.
- `src/styles.css`: overlay header, full-viewport hero, room image treatment, glass labels, transitions, responsive layout, and reduced-motion behavior.
- `assets/room-view-hero.webp`: optimized wide photorealistic room artwork.
- `assets/room-view-hero-mobile.webp`: portrait crop focused on the window, desk, and bed.
- `tests/static.test.js`: regression assertions for hero copy, image sources, hotspot labels, CTA destination, and reduced-motion support.
- `scripts/check-static.js`: required-asset checks for both new room images.

### Task 1: Lock the Immersive Hero Contract with Tests

**Files:**
- Modify: `tests/static.test.js`
- Modify: `scripts/check-static.js`

**Interfaces:**
- Consumes: current static `index.html` and `src/styles.css` files.
- Produces: failing regression tests that define the required hero structure and required asset paths.

- [ ] **Step 1: Add a failing hero structure test**

Append this test to `tests/static.test.js`:

```js
test('상단은 실제 방을 둘러보는 몰입형 히어로를 제공한다', async () => {
  const html = await readProjectFile('index.html');

  assert.match(html, /class="hero__picture"/);
  assert.match(html, /srcset="\/assets\/room-view-hero-mobile\.webp"/);
  assert.match(html, /src="\/assets\/room-view-hero\.webp"/);
  assert.match(html, /사진보다 먼저/);
  assert.match(html, /살아갈 방을 확인하세요/);
  assert.match(html, /href="#get-checklist"[^>]*>25개 체크리스트 받기/);

  for (const label of ['외창·환기', '책상 높이', '벽 재질·방음']) {
    assert.match(html, new RegExp(label));
  }
});
```

- [ ] **Step 2: Add failing CSS behavior assertions**

Extend the existing motion/responsiveness test with:

```js
assert.match(css, /\.hero__media-image[\s\S]*animation:\s*room-drift/);
assert.match(css, /@keyframes\s+room-drift/);
assert.match(css, /\.inspection-point/);
assert.match(css, /\.hero__overlay/);
```

- [ ] **Step 3: Require the two local room assets**

Add these entries to `requiredFiles` in `scripts/check-static.js`:

```js
'assets/room-view-hero.webp',
'assets/room-view-hero-mobile.webp',
```

- [ ] **Step 4: Run tests and confirm the intended failure**

Run: `npm test -- --test-name-pattern="몰입형 히어로|작은 화면"`

Expected: FAIL because the new hero structure, CSS selectors, and room image sources do not exist yet.

- [ ] **Step 5: Commit the test contract**

```bash
git add tests/static.test.js scripts/check-static.js
git commit -m "test: define immersive room hero contract"
```

### Task 2: Create and Optimize the Photorealistic Room Assets

**Files:**
- Create: `assets/room-view-hero.webp`
- Create: `assets/room-view-hero-mobile.webp`

**Interfaces:**
- Consumes: the visual requirements in `docs/superpowers/specs/2026-08-03-room-view-hero-design.md`.
- Produces: two local WebP images consumed by the `<picture class="hero__picture">` element in Task 3.

- [ ] **Step 1: Read the ImageGen skill and generate the wide source image**

Use ImageGen with this complete prompt:

```text
Photorealistic editorial interior photograph of a compact but realistic Korean gosiwon room, viewed from standing at the open doorway at natural eye level with a moderately wide lens. The room must feel genuinely small, practical, tidy, and lived-in, not luxurious and not neglected. Show a single bed along one wall, a properly usable desk and chair, a visible exterior window with soft late-afternoon daylight, plain wall surfaces whose construction could be inspected, and compact storage. Preserve generous darker negative space on the left for Korean website copy while keeping the window, desk, bed, and wall clearly visible toward the center and right. Warm practical ceiling light mixed with cool window light, refined cinematic contrast, premium Korean editorial photography, subtle depth, no people, no text, no logos, no labels, no fisheye distortion, no insects, no horror mood. Wide 16:9 website hero composition.
```

Save the generated source as `/private/tmp/jachwi-room-source.png` and visually inspect it before conversion. Generate a replacement when the room looks like a hotel, is unrealistically large, or omits a required furnishing.

- [ ] **Step 2: Create the wide WebP asset**

From the inspected source image, use Pillow to make a centered 16:9 crop and export it at 1920×1080:

```bash
python3 - <<'PY'
from PIL import Image

source = Image.open('/private/tmp/jachwi-room-source.png').convert('RGB')
target_ratio = 16 / 9
source_ratio = source.width / source.height

if source_ratio > target_ratio:
    crop_width = round(source.height * target_ratio)
    left = (source.width - crop_width) // 2
    source = source.crop((left, 0, left + crop_width, source.height))
else:
    crop_height = round(source.width / target_ratio)
    top = (source.height - crop_height) // 2
    source = source.crop((0, top, source.width, top + crop_height))

source.resize((1920, 1080), Image.Resampling.LANCZOS).save(
    'assets/room-view-hero.webp', 'WEBP', quality=86, method=6
)
PY
```

Expected: `assets/room-view-hero.webp` exists at 1920×1080 and keeps the complete doorway composition.

- [ ] **Step 3: Create the mobile crop**

Create a 900×1600 portrait crop from the same source. Bias the crop 64% toward the right so the window, desk, and bed remain visible:

```bash
python3 - <<'PY'
from PIL import Image

source = Image.open('/private/tmp/jachwi-room-source.png').convert('RGB')
target_ratio = 9 / 16
source_ratio = source.width / source.height

if source_ratio > target_ratio:
    crop_width = round(source.height * target_ratio)
    focal_x = round(source.width * 0.64)
    left = max(0, min(source.width - crop_width, focal_x - crop_width // 2))
    source = source.crop((left, 0, left + crop_width, source.height))
else:
    crop_height = round(source.width / target_ratio)
    top = max(0, (source.height - crop_height) // 2)
    source = source.crop((0, top, source.width, top + crop_height))

source.resize((900, 1600), Image.Resampling.LANCZOS).save(
    'assets/room-view-hero-mobile.webp', 'WEBP', quality=84, method=6
)
PY
```

Expected: the portrait asset preserves the window and desk in its upper/middle area and enough darker lower-left space for mobile copy.

- [ ] **Step 4: Verify both assets**

Run:

```bash
sips -g pixelWidth -g pixelHeight -g format assets/room-view-hero.webp assets/room-view-hero-mobile.webp
```

Expected: both report `format: webp`; the wide asset is landscape and the mobile asset is portrait.

- [ ] **Step 5: Commit the image assets**

```bash
git add assets/room-view-hero.webp assets/room-view-hero-mobile.webp
git commit -m "feat: add photorealistic room hero artwork"
```

### Task 3: Replace the Header and Hero Markup

**Files:**
- Modify: `index.html`
- Test: `tests/static.test.js`

**Interfaces:**
- Consumes: `/assets/room-view-hero.webp`, `/assets/room-view-hero-mobile.webp`, and the existing `#get-checklist` section.
- Produces: `.site-header--overlay`, `.hero--immersive`, `.hero__picture`, `.hero__overlay`, `.hero__copy`, and three `.inspection-point` elements for Task 4 styling.

- [ ] **Step 1: Mark the header as an overlay**

Change the header opening tag to:

```html
<header class="site-header site-header--overlay">
```

Keep the existing brand and `무료로 받기` anchor unchanged.

- [ ] **Step 2: Replace only the current hero section**

Replace the complete current `<section class="hero section-shell" ...>` block with:

```html
<section class="hero hero--immersive" aria-labelledby="hero-title">
  <div class="hero__media" aria-hidden="true">
    <picture class="hero__picture">
      <source media="(max-width: 600px)" srcset="/assets/room-view-hero-mobile.webp">
      <img
        class="hero__media-image"
        src="/assets/room-view-hero.webp"
        alt=""
        width="1920"
        height="1080"
        fetchpriority="high"
      >
    </picture>
    <div class="hero__overlay"></div>
  </div>

  <div class="hero__inner section-shell">
    <div class="hero__copy">
      <p class="eyebrow hero__eyebrow animate-fade-up">고시원 계약 전 5분만</p>
      <h1 id="hero-title" class="animate-fade-up animate-delay-1">
        사진보다 먼저,<br>
        <span>살아갈 방을 확인하세요</span>
      </h1>
      <p class="hero__description animate-fade-up animate-delay-2">
        벌레·소음·환기처럼 사진에 나오지 않는 것까지<br>
        직접 살아본 선배가 알려드려요.
      </p>
      <div class="hero__actions animate-fade-up animate-delay-3">
        <a class="button button--hero" href="#get-checklist">25개 체크리스트 받기</a>
        <span class="hero__microcopy">광고 없이 무료로 보내드려요</span>
      </div>
    </div>

    <div class="hero__inspection" aria-label="방에서 확인할 주요 항목">
      <span class="inspection-point inspection-point--window"><i></i><b>외창·환기</b></span>
      <span class="inspection-point inspection-point--desk"><i></i><b>책상 높이</b></span>
      <span class="inspection-point inspection-point--wall"><i></i><b>벽 재질·방음</b></span>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Run the hero structure test**

Run: `npm test -- --test-name-pattern="몰입형 히어로"`

Expected: PASS for HTML assertions; the CSS behavior test remains failing until Task 4.

- [ ] **Step 4: Commit the semantic hero**

```bash
git add index.html tests/static.test.js
git commit -m "feat: add immersive room hero structure"
```

### Task 4: Implement the Immersive Visual System and Responsive Behavior

**Files:**
- Modify: `src/styles.css`
- Test: `tests/static.test.js`

**Interfaces:**
- Consumes: hero class names created in Task 3.
- Produces: full-screen layout, readable overlays, glass inspection labels, entrance animation, `room-drift`, mobile reductions, and reduced-motion fallback.

- [ ] **Step 1: Add hero-specific design tokens**

Add to `:root`:

```css
--hero-bg: #030305;
--hero-text: #ffffff;
--hero-muted: #d5d5d5;
--hero-accent: #8a63f8;
--hero-glass: rgba(20, 20, 25, 0.48);
--hero-glass-border: rgba(255, 255, 255, 0.12);
```

- [ ] **Step 2: Replace the old hero/card/roadview rules with the immersive layout**

Implement these exact behaviors in the existing hero section of `src/styles.css`:

```css
.site-header--overlay {
  position: absolute;
  top: 0;
  left: 50%;
  z-index: 20;
  color: var(--hero-text);
  transform: translateX(-50%);
}

.site-header--overlay .brand { color: var(--hero-text); }
.site-header--overlay .header-cta {
  border-color: var(--hero-glass-border);
  background: var(--hero-glass);
  color: var(--hero-text);
  backdrop-filter: blur(14px);
}

.hero--immersive {
  position: relative;
  display: grid;
  min-height: max(720px, 100svh);
  overflow: hidden;
  background: var(--hero-bg);
  color: var(--hero-text);
}

.hero__media,
.hero__picture,
.hero__overlay { position: absolute; inset: 0; }
.hero__picture { overflow: hidden; }
.hero__media-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  animation: room-drift 16s cubic-bezier(.2,.65,.3,1) both;
}
.hero__overlay {
  background:
    linear-gradient(90deg, rgba(3,3,5,.96) 0%, rgba(3,3,5,.78) 34%, rgba(3,3,5,.22) 68%, rgba(3,3,5,.38) 100%),
    linear-gradient(0deg, rgba(3,3,5,.58) 0%, transparent 44%);
}
.hero__inner {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, .9fr) minmax(360px, 1.1fr);
  align-items: center;
  min-height: inherit;
  padding-block: 132px 82px;
}
.hero__copy { max-width: 760px; }
.hero__eyebrow { color: #bca8ff; }
.hero--immersive h1 {
  margin: 0;
  font-size: clamp(3rem, 6.2vw, 5.8rem);
  font-weight: 900;
  letter-spacing: -.075em;
  line-height: 1.04;
}
.hero--immersive h1 span {
  background: linear-gradient(90deg, #b99fff 0%, #79a6ff 100%);
  background-clip: text;
  color: transparent;
}
.hero--immersive .hero__description { color: var(--hero-muted); }
.button--hero {
  background: linear-gradient(135deg, #8a63f8 0%, #5c43fa 100%);
  box-shadow: 0 12px 30px rgba(138,99,248,.3);
  color: #fff;
}
.hero--immersive .hero__microcopy { color: rgba(255,255,255,.68); }
.hero__inspection { position: relative; align-self: stretch; }
.inspection-point { position: absolute; display: flex; align-items: center; gap: 9px; }
.inspection-point i {
  width: 14px;
  height: 14px;
  border: 3px solid #fff;
  border-radius: 50%;
  background: var(--hero-accent);
  box-shadow: 0 0 0 7px rgba(138,99,248,.2);
}
.inspection-point b {
  padding: 8px 11px;
  border: 1px solid var(--hero-glass-border);
  border-radius: 999px;
  background: var(--hero-glass);
  color: #fff;
  font-size: .78rem;
  backdrop-filter: blur(14px);
}
.inspection-point--window { top: 20%; right: 7%; }
.inspection-point--desk { top: 53%; right: 27%; }
.inspection-point--wall { top: 38%; left: 6%; }
```

- [ ] **Step 3: Add entrance and room movement keyframes**

```css
.animate-fade-up { animation: fade-up .8s cubic-bezier(.16,1,.3,1) both; }
.animate-delay-1 { animation-delay: .1s; }
.animate-delay-2 { animation-delay: .2s; }
.animate-delay-3 { animation-delay: .35s; }
@keyframes fade-up { from { opacity: 0; transform: translateY(28px); } }
@keyframes room-drift {
  from { transform: scale(1.035) translate3d(-.5%, 0, 0); }
  to { transform: scale(1.085) translate3d(.7%, -.4%, 0); }
}
```

- [ ] **Step 4: Replace old hero responsive overrides**

At `max-width: 820px`, use a single-column `.hero__inner`, keep the copy near the bottom, and make `.hero__inspection` absolute over the image. At `max-width: 600px`, set `min-height: max(680px, 100svh)`, use `object-position: 58% center`, make `.button--hero` nearly full width, hide `.inspection-point--wall`, and shorten labels without changing their text. At `max-width: 480px`, use a `clamp(2.65rem, 13vw, 3.7rem)` title and keep all copy inside the safe viewport.

Add an explicit reduced-motion rule:

```css
@media (prefers-reduced-motion: reduce) {
  .hero__media-image,
  .animate-fade-up { animation: none !important; }
}
```

- [ ] **Step 5: Run targeted and complete checks**

Run: `npm test -- --test-name-pattern="몰입형 히어로|작은 화면"`

Expected: PASS.

Run: `npm run check`

Expected: all Node tests pass and output ends with `Static checks passed`.

- [ ] **Step 6: Commit the visual implementation**

```bash
git add src/styles.css
git commit -m "feat: style immersive room-view hero"
```

### Task 5: Browser QA and Final Refinement

**Files:**
- Inspect: `index.html`
- Inspect: `src/styles.css`
- Inspect: `assets/room-view-hero.webp`
- Inspect: `assets/room-view-hero-mobile.webp`

**Interfaces:**
- Consumes: the completed static hero from Tasks 2–4.
- Produces: visually verified desktop and mobile hero with no overlap, clipping, contrast, or interaction regressions.

- [ ] **Step 1: Start the static site locally**

Run:

```bash
python3 -m http.server 4173
```

Expected: the site is available at `http://127.0.0.1:4173`.

- [ ] **Step 2: Verify desktop presentation**

Open the page at 1440×1000 and confirm: the room reads as a compact gosiwon; bed, desk, exterior window, wall, and storage remain visible; all copy is legible; all three inspection labels point to plausible areas; and the CTA scrolls to `#get-checklist`.

- [ ] **Step 3: Verify tablet and mobile presentation**

Check 1024×768, 768×1024, and 390×844. Confirm no title, CTA, or hotspot is clipped; the portrait asset keeps the window and desk visible; only two hotspots remain on mobile; and the header does not collide with the hero copy.

- [ ] **Step 4: Verify reduced motion and keyboard focus**

Emulate `prefers-reduced-motion: reduce` and confirm the room image and copy are stationary. Navigate with Tab and confirm visible focus on the header CTA and primary CTA.

- [ ] **Step 5: Record the visual QA result**

Record the four viewport outcomes and reduced-motion result in the implementation handoff. A failed viewport returns the work to Task 4 with the exact failing viewport and selector; it does not broaden scope to lower-page styling, copy, form behavior, or API files.

- [ ] **Step 6: Run final verification**

Run: `npm run check`

Expected: all tests pass and static checks pass.

- [ ] **Step 7: Confirm the worktree contains no uncommitted implementation changes**

Run: `git status --short`

Expected: no output. When Task 5 sends work back to Task 4, commit the correction there as `fix: refine room hero responsiveness` before repeating browser QA.
