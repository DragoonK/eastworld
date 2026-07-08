// ============================================================
// Stays page: hotels loaded from /api/listings?type=stay.
// Shared filter/pagination logic lives in catalog.js.
// ============================================================

// Featured hotel per country, shown when that country is picked.
// (Editorial content — edit freely.)
const FEATURED_HOTELS = {
  japan: {
    name: 'Aman Kyoto',
    city: 'kyoto',
    price: '$900-1800/night',
    description: 'Exclusive retreat set in a secret garden surrounded by forest and ancient temples',
    image: 'https://images.unsplash.com/photo-1578469645742-46cae010e5d4?auto=format&fit=crop&w=1050&q=80',
    link: 'stays/kyoto-aman.html'
  },
  china: {
    name: 'The Peninsula Shanghai',
    city: 'shanghai',
    price: '$400-800/night',
    description: 'Opulent art deco-inspired luxury hotel on the historic Bund waterfront',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1050&q=80'
  },
  cambodia: {
    name: 'Amansara',
    city: 'siem-reap',
    price: '$1000-1800/night',
    description: 'Former royal guesthouse transformed into an intimate luxury resort near Angkor Wat',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1050&q=80'
  },
  australia: {
    name: 'Park Hyatt Sydney',
    city: 'sydney',
    price: '$800-1500/night',
    description: 'Prestigious waterfront luxury hotel with unparalleled Opera House views',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1050&q=80'
  },
  thailand: {
    name: 'Amanpuri',
    city: 'phuket',
    price: '$900-2000/night',
    description: 'Elegant pavilions and villas on a secluded peninsula with a private beach',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1050&q=80',
    link: 'amanpuri.html'
  }
};

// The static three-card grid from the HTML is shown for "All";
// picking a country swaps in that country's featured hotel.
let initialFeaturedHTML = null;

function renderFeaturedStay(country) {
  const section = document.querySelector('.featured-section');
  const gridEl = document.querySelector('.featured-grid');
  if (!section || !gridEl) return;

  if (initialFeaturedHTML === null) initialFeaturedHTML = gridEl.innerHTML;

  if (country === 'all') {
    gridEl.innerHTML = initialFeaturedHTML;
    section.style.display = 'block';
    return;
  }

  const pick = FEATURED_HOTELS[country];
  if (!pick) {
    section.style.display = 'none';
    return;
  }

  gridEl.innerHTML = `
    <a href="${pick.link || '#'}" class="featured-card">
      <img src="${pick.image}" alt="${pick.name}">
      <div class="featured-content">
        <span class="featured-category">FEATURED</span>
        <h3 class="featured-title">${pick.name}</h3>
        <p class="featured-desc">${pick.description}</p>
        <p class="featured-desc"><strong>${pick.price}</strong> &middot; ${titleCase(pick.city)}</p>
      </div>
    </a>`;
  section.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  initCatalog({
    type: 'stay',
    grid: '.stays-grid',
    renderFeatured: renderFeaturedStay,
    cardHTML: (l) => `
      <a class="stay-card" href="${listingHref(l)}">
        <div class="stay-card-img">
          <img src="${l.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=70'}"
               alt="${l.name}" loading="lazy"
               onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=70'">
          <span class="stay-card-category">${(l.budget_tier || 'stay').toUpperCase()}</span>
        </div>
        <div class="stay-card-content">
          <h3 class="stay-card-title">${l.name}</h3>
          <p class="stay-card-desc">${l.description || ''}</p>
          <div class="stay-card-meta">
            <div class="stay-card-location">
              <i class="fas fa-map-marker-alt"></i> ${titleCase(l.city)}, ${titleCase(l.country)}
              ${l.price_range ? ` &middot; ${l.price_range}` : ''}
            </div>
            ${starsHTML(l.rating, 'stay-card-stars')}
          </div>
        </div>
      </a>`,
  });
});
