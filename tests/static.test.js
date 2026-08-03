import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('랜딩 문서는 한국어 모바일 페이지로 공유할 수 있다', async () => {
  const html = await readProjectFile('index.html');

  assert.match(html, /<html lang="ko">/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /property="og:title"/);
  assert.match(html, /property="og:description"/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
});

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

test('전환 폼은 이메일, 두 동의, 허니팟과 상태 영역을 제공한다', async () => {
  const html = await readProjectFile('index.html');

  for (const id of [
    'lead-form',
    'email',
    'privacy-consent',
    'follow-up-consent',
    'company',
    'submit-button',
    'form-status',
    'tips-list',
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }

  assert.match(html, /href="\/privacy\.html"/);
  assert.match(html, /type="email"/);
  assert.match(html, /aria-live="polite"/);
});

test('스타일은 작은 화면과 모션 감소 설정을 지원한다', async () => {
  const css = await readProjectFile('src/styles.css');

  assert.match(css, /@media\s*\(max-width:\s*480px\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /minmax\(0,\s*1fr\)/);
  assert.match(css, /\.hero__media-image[\s\S]*animation:\s*room-drift/);
  assert.match(css, /@keyframes\s+room-drift/);
  assert.match(css, /\.inspection-point/);
  assert.match(css, /\.hero__overlay/);
});

test('상단은 실제 방을 둘러보는 몰입형 히어로를 제공한다', async () => {
  const html = await readProjectFile('index.html');

  assert.match(html, /class="hero__picture"/);
  assert.match(html, /srcset="\/assets\/room-view-hero-mobile\.webp"/);
  assert.match(html, /src="\/assets\/room-view-hero\.webp"/);
  assert.match(html, /href="#get-checklist"[^>]*>25개 체크리스트 받기/);

  for (const label of ['외창·환기', '책상 높이', '벽 재질·방음']) {
    assert.match(html, new RegExp(label));
  }
});

test('개인정보 안내는 수집 목적과 삭제 방법을 설명한다', async () => {
  const html = await readProjectFile('privacy.html');

  assert.match(html, /이메일 주소/);
  assert.match(html, /체크리스트 발송/);
  assert.match(html, /선택/);
  assert.match(html, /Resend/);
  assert.match(html, /보관/);
  assert.match(html, /답장/);
  assert.match(html, /철회/);
});

test('Vercel 배포는 보안 헤더와 API 비캐시 정책을 설정한다', async () => {
  const config = JSON.parse(await readProjectFile('vercel.json'));
  const headers = config.headers.flatMap((rule) => rule.headers);
  const keys = new Set(headers.map(({ key }) => key));

  for (const key of [
    'X-Content-Type-Options',
    'Referrer-Policy',
    'Permissions-Policy',
    'Content-Security-Policy',
    'Cache-Control',
  ]) {
    assert.ok(keys.has(key), `${key} header is required`);
  }
});
