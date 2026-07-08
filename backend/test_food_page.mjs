// Browser test for the migrated food page filter system.
// Run with: node test_food_page.mjs
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
const fail = (msg) => { console.error('FAIL:', msg); process.exitCode = 1; };

await page.goto('http://localhost:5001/food.html');
await page.waitForSelector('.food-card');

const count = async () => page.locator('.food-card').count();
const filterText = async () => page.locator('.current-filter').textContent();

// Initial load: 9 cards (page 1 of all), pagination present
console.log('initial cards:', await count(), '| filter:', await filterText());
if (await count() !== 9) fail('expected 9 cards on initial page');
if (await page.locator('.pagination-btn').count() === 0) fail('pagination missing');

// Click JAPAN -> city buttons appear, featured section shows
await page.click('.filter-btn[data-country="japan"]');
await page.waitForTimeout(300);
console.log('japan cards:', await count(), '| filter:', await filterText());
if (!await page.locator('.japan-cities').isVisible()) fail('japan cities not visible');
if (!await page.locator('.featured-section').isVisible()) fail('featured section not visible');

// Click TOKYO
await page.click('.filter-btn[data-city="tokyo"]');
await page.waitForTimeout(300);
console.log('tokyo cards:', await count(), '| filter:', await filterText());

// Click BUDGET -> tokyo budget = 3
await page.click('.filter-btn[data-price="budget"]');
await page.waitForTimeout(300);
const tokyoBudget = await count();
console.log('tokyo+budget cards:', tokyoBudget, '| filter:', await filterText());
if (tokyoBudget !== 3) fail(`expected 3 tokyo budget cards, got ${tokyoBudget}`);

// Card links should point somewhere real
const href = await page.locator('.food-card').first().getAttribute('href');
console.log('first card href:', href);
if (!href || href === '#') fail('card has no destination');

// Clear filters -> back to all
await page.click('.clear-filter');
await page.waitForTimeout(300);
console.log('after clear:', await count(), '| filter:', await filterText());
if (await count() !== 9) fail('clear filters did not restore page 1 of all');

// Pagination: click page 2
await page.click('.pagination-btn.page-btn >> nth=1');
await page.waitForTimeout(300);
console.log('page 2 cards:', await count());

await page.screenshot({ path: 'food-page-test.png', fullPage: false });
await browser.close();
console.log(process.exitCode ? 'TESTS FAILED' : 'ALL TESTS PASSED');
