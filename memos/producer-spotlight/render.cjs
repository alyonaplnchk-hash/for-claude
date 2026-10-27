// Renders filming-memo.html to PDF (and optional per-page PNG previews) with Chromium.
// Usage: node render.cjs [previewDir]
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const here = __dirname;
  const previewDir = process.argv[2];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 1.6 });
  await page.goto('file://' + path.join(here, 'filming-memo.html'), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  if (previewDir) {
    const pages = await page.$$('section.page');
    for (let i = 0; i < pages.length; i++) {
      await pages[i].screenshot({ path: path.join(previewDir, `page-${String(i + 1).padStart(2, '0')}.png`) });
    }
  }

  await page.pdf({
    path: path.join(here, 'AVU-Producer-Spotlight-Filming-Memo.pdf'),
    preferCSSPageSize: true,
    printBackground: true,
  });
  await browser.close();
  console.log('PDF written');
})();
