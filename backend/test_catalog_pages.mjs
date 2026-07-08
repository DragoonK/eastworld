// Browser test for the stays / places / products catalog pages.
// Run with: node test_catalog_pages.mjs
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const fail = (msg) => { console.error('FAIL:', msg); process.exitCode = 1; };

async function testPage(url, cardSel, country, city, extra) {
  await page.goto(`http://localhost:5001/${url}`);
  await page.waitForSelector(cardSel);
  const count = () => page.locator(cardSel).count();
  console.log(`\n--- ${url}: ${await count()} cards initially`);
  if (await count() === 0) fail(`${url}: no cards loaded`);

  await page.click(`.filter-btn[data-country="${country}"]`);
  await page.waitForTimeout(250);
  console.log(`${country}: ${await count()} cards | filter: ${await page.locator('.current-filter').textContent()}`);

  if (city) {
    await page.click(`.filter-btn[data-city="${city}"]`);
    await page.waitForTimeout(250);
    console.log(`${city}: ${await count()} cards`);
    if (await count() === 0) fail(`${url}: ${city} shows no cards`);
  }

  if (extra) await extra(count);

  await page.click('.clear-filter');
  await page.waitForTimeout(250);
  console.log(`cleared: ${await count()} cards`);

  const href = await page.locator(cardSel).first().getAttribute('href');
  if (!href || href === '#') fail(`${url}: card missing destination (${href})`);
}

await testPage('stays.html', '.stay-card', 'japan', 'tokyo', async (count) => {
  await page.click('.filter-btn[data-price="standard"]');
  await page.waitForTimeout(250);
  console.log(`+standard tier: ${await count()} cards`);
  if (await count() === 0) fail('stays: standard tier empty');
});

await testPage('places.html', '.wonder-card', 'japan', 'kyoto', async (count) => {
  await page.click('.filter-btn[data-category="cultural"]');
  await page.waitForTimeout(250);
  console.log(`+cultural: ${await count()} cards`);
  if (await count() === 0) fail('places: japan cultural empty');
});

// China places sanity check
await page.click('.filter-btn[data-country="china"]');
await page.waitForTimeout(250);
console.log(`china places: ${await page.locator('.wonder-card').count()} cards`);

await testPage('products.html', '.product-card', 'japan', null, async (count) => {
  await page.click('.filter-btn[data-price="premium"]');
  await page.waitForTimeout(250);
  console.log(`+premium: ${await count()} cards`);
  if (await count() === 0) fail('products: premium tier empty');
});

// Vietnam button exists and shows the empty state gracefully
await page.goto('http://localhost:5001/food.html');
await page.waitForSelector('.food-card');
await page.click('.filter-btn[data-country="vietnam"]');
await page.waitForTimeout(250);
const msg = await page.locator('.food-grid .initial-message').textContent().catch(() => '');
console.log('\nvietnam (no content yet):', msg.trim().slice(0, 40));
if (!await page.locator('.filter-btn[data-city="ho-chi-minh"]').isVisible()) fail('ho-chi-minh city button not visible');

if (errors.length) fail('JS errors: ' + errors.join(' | '));
await browser.close();
console.log(process.exitCode ? '\nTESTS FAILED' : '\nALL CATALOG TESTS PASSED');
