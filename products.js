// ============================================================
// Products page: items loaded from /api/listings?type=product.
// Shared filter/pagination logic lives in catalog.js.
// ============================================================

// The static "featured from each country" cards narrow with the
// country filter, and the section hides if nothing matches.
function filterFeaturedProducts(country) {
  const cards = document.querySelectorAll('.featured-product');
  let visible = 0;
  cards.forEach(card => {
    const show = country === 'all' || card.dataset.country === country;
    card.style.display = show ? 'block' : 'none';
    if (show) visible++;
  });
  const section = document.querySelector('.featured-section');
  if (section) section.style.display = visible ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  initCatalog({
    type: 'product',
    grid: '.product-grid',
    renderFeatured: filterFeaturedProducts,
    cardHTML: (l) => `
      <a class="product-card" href="${listingHref(l)}">
        <div class="product-img">
          <img src="${l.image_url || 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=800&q=70'}"
               alt="${l.name}" loading="lazy"
               onerror="this.src='https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=800&q=70'">
          <span class="product-category">${titleCase(l.country)}</span>
          ${l.budget_tier === 'premium' ? '<span class="product-badge">Premium</span>' : ''}
        </div>
        <div class="product-content">
          <h3 class="product-title">${l.name}</h3>
          <p class="product-desc">${l.description || ''}</p>
          <div class="product-meta">
            <div class="product-price">${l.price_range || ''}</div>
            ${starsHTML(l.rating, 'product-rating')}
          </div>
        </div>
      </a>`,
  });
});
