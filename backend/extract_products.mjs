// One-off: pull the hardcoded product cards out of products.html
// into products_seed.json. app.py imports any product that isn't
// already in the listings table (matched by name).
//
// Run with:  node extract_products.mjs

import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync(new URL('../products.html', import.meta.url), 'utf8');

const cardRegex = /<div class="product-card" data-country="([^"]+)">([\s\S]*?)<\/button>\s*<\/div>\s*<\/div>/g;
const get = (block, re) => (block.match(re) || [])[1]?.trim() ?? '';

const products = [];
let match;
while ((match = cardRegex.exec(html)) !== null) {
  const [, country, block] = match;
  const name = get(block, /<h3 class="product-title">([\s\S]*?)<\/h3>/);
  const description = get(block, /<p class="product-desc">([\s\S]*?)<\/p>/);
  const price = get(block, /<div class="product-price">([\s\S]*?)<\/div>/);
  const image = get(block, /<img src="([^"]+)"/);
  const badge = get(block, /<span class="product-badge">([\s\S]*?)<\/span>/).toLowerCase();

  // Tier: explicit badge wins, otherwise infer from the price
  const amount = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
  const tier = badge === 'premium' ? 'premium'
    : amount > 0 && amount < 25 ? 'budget'
    : amount >= 80 ? 'premium'
    : 'standard';

  if (name) {
    products.push({
      type: 'product', name, country, city: '',
      price_range: price, budget_tier: tier,
      category: '', description, image_url: image, link: '',
    });
  }
}

writeFileSync(new URL('./products_seed.json', import.meta.url), JSON.stringify(products, null, 2));
console.log(`Wrote ${products.length} products.`);
