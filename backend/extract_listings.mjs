// One-time extraction tool.
//
// Reads the hardcoded data objects out of the legacy frontend files
// (food.js, stays.js, places.js, trending.js) and writes a unified
// backend/listings_seed.json. The backend seeds its `listings` table
// from that file on first boot.
//
// Run with:  node extract_listings.mjs

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Pull `const NAME = {...};` out of a JS file and evaluate just the
// object literal. The data objects in these files all end with a
// line containing only "};".
function extractObject(filePath, constName) {
  const source = readFileSync(join(ROOT, filePath), 'utf8');
  const start = source.indexOf(`const ${constName} = {`);
  if (start === -1) throw new Error(`${constName} not found in ${filePath}`);
  const braceStart = source.indexOf('{', start);
  const end = source.indexOf('\n};', braceStart);
  if (end === -1) throw new Error(`End of ${constName} not found in ${filePath}`);
  const objectText = source.slice(braceStart, end + 2);
  return eval(`(${objectText})`);
}

const CITY_TO_COUNTRY = {
  tokyo: 'japan', osaka: 'japan', kyoto: 'japan', kobe: 'japan',
  shanghai: 'china', beijing: 'china', shenzhen: 'china',
  chongqing: 'china', guangzhou: 'china',
  seoul: 'korea', busan: 'korea',
  bangkok: 'thailand', 'chiang-mai': 'thailand', phuket: 'thailand',
  'phnom-penh': 'cambodia', 'siem-reap': 'cambodia',
  melbourne: 'australia', sydney: 'australia',
};

const COUNTRIES = new Set(['japan', 'china', 'korea', 'thailand', 'cambodia', 'australia']);

// Some legacy data filed items under a country instead of a city
function resolvePlace(cityKey) {
  if (COUNTRIES.has(cityKey)) return { country: cityKey, city: '' };
  return { country: CITY_TO_COUNTRY[cityKey] || 'other', city: cityKey };
}

const listings = [];

// ---- FOOD: food.js RESTAURANTS_BY_CITY ----
const restaurants = extractObject('food.js', 'RESTAURANTS_BY_CITY');
for (const [city, items] of Object.entries(restaurants)) {
  for (const item of items) {
    listings.push({
      type: 'food',
      name: item.name,
      ...resolvePlace(city),
      price_range: item.price || '',
      budget_tier: item.category || '',      // budget | standard | premium
      category: '',
      description: item.description || '',
      image_url: item.forceImage || '',
      link: item.link || '',
    });
  }
}

// ---- STAYS: stays.js hotelData ----
const hotels = extractObject('stays.js', 'hotelData');
for (const [city, items] of Object.entries(hotels)) {
  for (const item of items) {
    listings.push({
      type: 'stay',
      name: item.name,
      ...resolvePlace(city),
      price_range: item.price || '',
      budget_tier: item.category || '',
      category: '',
      description: item.description || '',
      image_url: item.forceImage || '',
      link: item.link || '',
    });
  }
}

// ---- PLACES: places.js wondersData ----
const wonders = extractObject('places.js', 'wondersData');
for (const [city, items] of Object.entries(wonders)) {
  for (const item of items) {
    listings.push({
      type: 'place',
      name: item.name,
      ...resolvePlace(city),
      price_range: '',
      budget_tier: '',
      category: item.category || '',         // cultural | landmark | nature | ...
      description: item.description || '',
      image_url: item.forceImage || '',
      link: item.link || '',
    });
  }
}

// ---- PRODUCTS: trending.js TRENDING_DATA.products ----
// Products were never in a data file of their own (the products page
// hardcodes its cards in HTML), so the curated trending set is the
// best available source.
const trendingSource = readFileSync(join(ROOT, 'trending.js'), 'utf8');
const tStart = trendingSource.indexOf('const TRENDING_DATA = {');
const tEnd = trendingSource.indexOf('\n};', tStart);
const trending = eval(`(${trendingSource.slice(trendingSource.indexOf('{', tStart), tEnd + 2)})`);
for (const [country, items] of Object.entries(trending.products)) {
  for (const item of items) {
    listings.push({
      type: 'product',
      name: item.name,
      country,
      city: '',
      price_range: '',
      budget_tier: '',
      category: '',
      description: '',
      image_url: item.image || '',
      link: item.link || '',
    });
  }
}

// De-duplicate (same name + type + city can appear in multiple sources)
const seen = new Set();
const unique = listings.filter(l => {
  const key = `${l.type}|${l.name.toLowerCase()}|${l.city}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

writeFileSync(
  join(ROOT, 'backend', 'listings_seed.json'),
  JSON.stringify(unique, null, 2)
);

const counts = {};
for (const l of unique) counts[l.type] = (counts[l.type] || 0) + 1;
console.log(`Wrote ${unique.length} listings:`, counts);
