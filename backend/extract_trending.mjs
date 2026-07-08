// One-off: pull the curated TRENDING_DATA object out of trending.js
// and flatten it into trending_seed.json, which app.py uses to seed
// the trending table on first boot.
//
// Run with:  node extract_trending.mjs

import { readFileSync, writeFileSync } from 'node:fs';

const source = readFileSync(new URL('../trending.js', import.meta.url), 'utf8');

// Grab just the object literal assigned to TRENDING_DATA
const start = source.indexOf('const TRENDING_DATA = ') + 'const TRENDING_DATA = '.length;
const end = source.indexOf('\n};', start) + 2;
const TRENDING_DATA = eval('(' + source.slice(start, end) + ')');

const rows = [];
for (const [tab, countries] of Object.entries(TRENDING_DATA)) {
  for (const [country, items] of Object.entries(countries)) {
    items.forEach((item, i) => {
      rows.push({
        tab,                        // food | stays | places | products
        country,
        rank: i + 1,
        name: item.name,
        location: item.location,    // city, or country name for products
        image: item.image,
        link: item.link || '',
      });
    });
  }
}

writeFileSync(new URL('./trending_seed.json', import.meta.url), JSON.stringify(rows, null, 2));
console.log(`Wrote ${rows.length} trending entries.`);
