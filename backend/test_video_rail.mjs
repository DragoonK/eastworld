// Quick browser check for Phase 7: the homepage WATCH rail and
// the admin VIDEOS tab. Run with the Flask server on :5001.
import { chromium } from 'playwright';

const BASE = 'http://localhost:5001';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });

// ---------- homepage ----------
await page.goto(BASE, { waitUntil: 'networkidle' });

const topLabel = await page.locator('.main-col .carousel').first().getAttribute('aria-label');
const bottomLabel = await page.locator('.main-col .carousel').last().getAttribute('aria-label');
console.log('top carousel:', topLabel, '| bottom carousel:', bottomLabel);
if (topLabel !== 'Spotlights' || bottomLabel !== 'City guides') throw new Error('Carousels not swapped');

await page.waitForSelector('#video-rail:not([hidden])');
console.log('main video title:', await page.locator('.video-main .video-title').textContent());
console.log('thumb count:', await page.locator('.video-thumb').count());

// Clicking a thumbnail should promote it to the main slot as an iframe
const thumbTitle = (await page.locator('.video-thumb span').first().textContent()).trim();
await page.locator('.video-thumb').first().click();
await page.waitForSelector('.video-main iframe');
const nowPlaying = (await page.locator('.video-main .video-title').textContent()).trim();
console.log('clicked thumb ->', nowPlaying === thumbTitle ? 'plays in main slot ✓' : `MISMATCH: ${nowPlaying}`);

await page.screenshot({ path: 'video-rail-test.png', fullPage: false });

// ---------- admin ----------
await page.goto(`${BASE}/admin.html`);
await page.fill('#login-password', 'eastworld');
await page.click('#login-btn');
await page.click('.admin-tab[data-tab="videos"]');
await page.waitForSelector('#videos-table .admin-table');
console.log('admin video rows:', await page.locator('#videos-table tbody tr').count());

// Move row 2 up and confirm it becomes MAIN
const secondTitle = (await page.locator('#videos-table tbody tr').nth(1).locator('td').nth(2).textContent()).trim();
await page.locator('[data-move-video="1"][data-dir="-1"]').click();
await page.waitForTimeout(400);
const firstNow = (await page.locator('#videos-table tbody tr').nth(0).locator('td').nth(2).textContent()).trim();
console.log('reorder:', firstNow.startsWith(secondTitle.replace(/ MAIN$/, '')) ? 'row moved to top ✓' : `MISMATCH: ${firstNow}`);

// Put it back
await page.locator('[data-move-video="0"][data-dir="1"]').click();
await page.waitForTimeout(400);
await page.screenshot({ path: 'admin-videos-test.png' });

await browser.close();
console.log('ALL CHECKS DONE');
