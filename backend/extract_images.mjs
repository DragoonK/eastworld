// One-off: pull the RESTAURANT_IMAGES map out of the legacy food.js
// and the place images out of places.js, writing images_seed.json.
// app.py applies it on boot to any listing that still has no image.
//
// Run with:  node extract_images.mjs

import { readFileSync, writeFileSync } from 'node:fs';

const entries = [];

// ---- food.js: RESTAURANT_IMAGES = { 'Name': 'url', ... } ----
const foodSrc = readFileSync(new URL('../food.js', import.meta.url), 'utf8');
const mapStart = foodSrc.indexOf('const RESTAURANT_IMAGES = {');
const mapEnd = foodSrc.indexOf('\n};', mapStart) + 2;
const RESTAURANT_IMAGES = eval('(' + foodSrc.slice(mapStart + 'const RESTAURANT_IMAGES = '.length, mapEnd) + ')');
for (const [name, image] of Object.entries(RESTAURANT_IMAGES)) {
  entries.push({ type: 'food', name, image });
}

// ---- places.js: objects with name: ... image: ... ----
const placesSrc = readFileSync(new URL('../places.js', import.meta.url), 'utf8');
const objRegex = /name:\s*'((?:[^'\\]|\\.)*)'[\s\S]{0,400}?image:\s*'([^']+)'/g;
let match;
while ((match = objRegex.exec(placesSrc)) !== null) {
  entries.push({ type: 'place', name: match[1].replace(/\\'/g, "'"), image: match[2] });
}

writeFileSync(new URL('./images_seed.json', import.meta.url), JSON.stringify(entries, null, 2));
console.log(`Wrote ${entries.length} image entries (${entries.filter(e => e.type === 'food').length} food, ${entries.filter(e => e.type === 'place').length} places).`);
