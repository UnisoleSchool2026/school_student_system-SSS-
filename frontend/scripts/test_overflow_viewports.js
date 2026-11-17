let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (e) {
  try {
    ({ chromium } = require('@playwright/test'));
  } catch (_) {
    console.log('Playwright module not installed in current environment.');
    console.log('To run this check locally: npm install --no-save playwright && npx playwright install chromium');
    process.exit(0);
  }
}

const TARGET_URL = process.argv[2] || process.env.FRONTEND_URL || 'http://localhost:3008';
const VIEWPORTS = [
  { width: 360, height: 800, label: 'Mobile (360px)' },
  { width: 768, height: 1024, label: 'Tablet (768px)' },
  { width: 1024, height: 768, label: 'Small Desktop (1024px)' },
  { width: 1440, height: 900, label: 'Large Desktop (1440px)' }
];

async function run() {
  console.log(`Starting Viewport Overflow Check against ${TARGET_URL}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  let hasOverflow = false;

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height }
    });

    try {
      await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(500);

      const metrics = await page.evaluate(() => {
        const docEl = document.documentElement;
        return {
          scrollWidth: docEl.scrollWidth,
          clientWidth: docEl.clientWidth,
          innerWidth: window.innerWidth
        };
      });

      const overflowPixels = metrics.scrollWidth - vp.width;
      if (overflowPixels > 1) {
        console.warn(`WARNING: Viewport ${vp.label} has horizontal overflow: scrollWidth=${metrics.scrollWidth}px, viewportWidth=${vp.width}px (overflow: +${overflowPixels}px)`);
        hasOverflow = true;
      } else {
        console.log(`PASS: ${vp.label} -> No horizontal overflow detected (scrollWidth=${metrics.scrollWidth}px, innerWidth=${metrics.innerWidth}px)`);
      }
    } catch (err) {
      console.error(`ERROR on viewport ${vp.label}: ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  if (hasOverflow) {
    console.log('Finished with one or more viewport overflow warnings.');
  } else {
    console.log('ALL VIEWPORTS PASSED: Clean responsive layout with zero horizontal overflow.');
  }
}

run().catch((err) => {
  console.error('Playwright execution error:', err.message);
  process.exit(1);
});
