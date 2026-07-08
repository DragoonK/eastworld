// Browser check for Phase 8 + 8.5: the API-driven events page
// and the admin-managed homepage carousels.
import { chromium } from 'playwright';

const BASE = 'http://localhost:5001';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });

// ---------- events page ----------
await page.goto(`${BASE}/ew-events.html`, { waitUntil: 'networkidle' });

await page.waitForSelector('#featured-event:not([hidden])');
console.log('featured hero:', (await page.locator('.featured-event-title').textContent()).trim());
console.log('event cards:', await page.locator('.event-card').count());
console.log('city buttons:', (await page.locator('.city-btn').allTextContents()).join(', '));

// City filter narrows the grid
await page.locator('.city-btn[data-city="osaka"]').click();
const osakaCards = await page.locator('.event-card').count();
const osakaCities = await page.locator('.event-card .event-city').allTextContents();
console.log('after Osaka filter:', osakaCards, 'cards ->', [...new Set(osakaCities)].join(','));
await page.screenshot({ path: 'events-page-test.png' });

// ---------- homepage carousels from API ----------
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForSelector('[data-slides="top"] .carousel-item.active');
console.log('top first slide:', (await page.locator('[data-slides="top"] .carousel-item.active h1').textContent()).trim());
console.log('top slide count:', await page.locator('[data-slides="top"] .carousel-item').count());
console.log('bottom slide count:', await page.locator('[data-slides="bottom"] .carousel-item').count());
const bottomFirstHref = await page.locator('[data-slides="bottom"] .carousel-item').first().getAttribute('href');
console.log('bottom first slide links to:', bottomFirstHref);

// Carousel controls still work on dynamic slides
await page.locator('[data-slides="top"] .carousel-button.next').click();
console.log('after next click:', (await page.locator('[data-slides="top"] .carousel-item.active h1').textContent()).trim());

// ---------- admin tabs ----------
await page.goto(`${BASE}/admin.html`);
await page.fill('#login-password', 'eastworld');
await page.click('#login-btn');

await page.click('.admin-tab[data-tab="events"]');
await page.waitForSelector('#events-table .admin-table');
console.log('admin event rows:', await page.locator('#events-table tbody tr').count());

await page.click('.admin-tab[data-tab="carousels"]');
await page.waitForSelector('#slides-table .admin-table');
console.log('admin top-carousel rows:', await page.locator('#slides-table tbody tr').count());
await page.selectOption('#slide-carousel-select', 'bottom');
await page.waitForTimeout(200);
console.log('admin bottom-carousel rows:', await page.locator('#slides-table tbody tr').count());

// Reorder a slide and confirm it persists via the API
const secondSlide = (await page.locator('#slides-table tbody tr').nth(1).locator('td').nth(2).textContent()).trim();
await page.locator('[data-move-slide="1"][data-dir="-1"]').click();
await page.waitForTimeout(400);
const apiOrder = await (await fetch(`${BASE}/api/slides`)).json();
console.log('reorder persisted:', apiOrder.bottom[0].title === secondSlide.replace(/ FIRST$/, '') ? 'yes ✓' : 'NO');
// put it back
await page.locator('[data-move-slide="0"][data-dir="1"]').click();
await page.waitForTimeout(400);

await page.screenshot({ path: 'admin-carousels-test.png' });
await browser.close();
console.log('ALL CHECKS DONE');
