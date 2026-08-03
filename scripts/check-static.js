import { access, readFile } from 'node:fs/promises';

const requiredFiles = [
  'index.html',
  'privacy.html',
  'vercel.json',
  'README.md',
  'src/styles.css',
  'src/content.js',
  'src/form.js',
  'src/app.js',
  'api/send-checklist.js',
  'api/lib/checklist-email.js',
  'assets/favicon.svg',
  'assets/og-image.svg',
  'assets/room-view-hero.webp',
  'assets/room-view-hero-mobile.webp',
];

for (const path of requiredFiles) {
  await access(new URL(`../${path}`, import.meta.url));
}

const trackedText = await Promise.all(
  requiredFiles.map((path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')),
);

if (trackedText.some((content) => /\bre_[A-Za-z0-9]{16,}\b/.test(content))) {
  throw new Error('A Resend API key pattern was found in a static file.');
}

console.log('Static checks passed');
