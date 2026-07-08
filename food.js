// ============================================================
// Food page: restaurant listings loaded from the backend API.
//
// The listings come from /api/listings?type=food — the same
// database you manage in admin.html. Filtering (country > city,
// price tier) and pagination happen client-side on the loaded
// list, matching the original page's behavior.
// ============================================================

const ITEMS_PER_PAGE = 9;

let allListings = [];
let filtered = [];
let currentPage = 1;

const filterState = { country: 'all', city: null, price: null };

// Editorial "featured restaurant" per country, shown when a
// country is selected. (Curate freely — this is content, not code.)
const COUNTRY_HIGHLIGHT = {
  japan: {
    city: 'tokyo',
    name: 'Sushi Dai',
    image: 'https://www.gotokyo.org/en/spot/482/images/482_0203_1.jpg',
    description: "Located in Tokyo's renowned Toyosu Market, Sushi Dai offers some of the freshest sushi in the world. Despite the early morning queues, diners are rewarded with an unforgettable omakase experience featuring seasonal seafood selected by master chefs.",
    price: '$40-60 per person'
  },
  china: {
    city: 'guangzhou',
    name: 'Guangzhou Dim Sum',
    image: 'https://www.springtomorrow.com/wp-content/uploads/2019/04/Din-Tai-Fung-Dim-Sum-Feast.jpg',
    description: "Experience the birthplace of Cantonese dim sum with delicate dumplings, steamed buns, and other bite-sized delights. Guangzhou's teahouses offer traditional dim sum service, where trolleys loaded with bamboo steamers circulate through the dining room.",
    price: '$15-30 per person'
  },
  cambodia: {
    city: 'siem-reap',
    name: 'Cuisine Wat Damnak',
    image: 'https://media-cdn.tripadvisor.com/media/photo-s/10/84/75/3a/cuisine-wat-damnak.jpg',
    description: 'Located in a traditional Cambodian wooden house, Cuisine Wat Damnak offers innovative Cambodian cuisine using fresh local ingredients. Chef Joannès Rivière creates sophisticated dishes based on traditional flavors, with seasonal tasting menus that highlight the richness of Cambodian culinary heritage.',
    price: '$25-35 per person'
  },
  australia: {
    city: 'melbourne',
    name: 'Attica',
    image: 'https://cdn.broadsheet.com.au/cache/58/80/5880547647c4b2ae6155b92748dee379.jpg',
    description: "One of Australia's most celebrated restaurants, Attica showcases native Australian ingredients in innovative ways. Chef Ben Shewry's tasting menu tells the story of the land through creative dishes that highlight indigenous flavors and sustainable practices.",
    price: '$300-350 per person'
  }
};

// Generic cuisine images for listings that have no photo yet
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
  'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
];

const titleCase = (s) => (s || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

function imageFor(listing) {
  if (listing.image_url) return listing.image_url;
  // Hash the name so each listing gets a stable fallback image
  let hash = 0;
  for (const ch of listing.name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return FALLBACK_IMAGES[Math.abs(hash) % FALLBACK_IMAGES.length];
}

// ------------------------------------------------------------
// Init
// ------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.querySelector('.food-grid');
  if (!grid) return;

  try {
    const res = await fetch('/api/listings?type=food&limit=500');
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    allListings = await res.json();
  } catch {
    grid.innerHTML = `
      <div class="initial-message" style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #666;">
        Couldn't load restaurant listings. Is the backend running?<br>
        Start it with: <code>cd backend &amp;&amp; python3 app.py</code>
      </div>`;
    return;
  }

  wireFilters();
  showFeaturedRestaurant('all');   // hidden until a country is picked
  applyFilters();
});

// ------------------------------------------------------------
// Filtering
// ------------------------------------------------------------

function wireFilters() {
  document.querySelectorAll('.filter-section.countries .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterState.country = btn.dataset.country;
      filterState.city = null;
      filterState.price = null;

      document.querySelectorAll('.filter-btn.active').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      showCitiesForCountry(filterState.country);
      showFeaturedRestaurant(filterState.country);
      applyFilters();
    });
  });

  document.querySelectorAll('.filter-section.cities .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterState.city = btn.dataset.city;
      document.querySelectorAll('.filter-section.cities .filter-btn.active')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilters();
    });
  });

  document.querySelectorAll('.filter-section.price-categories .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const wasActive = btn.classList.contains('active');
      document.querySelectorAll('.filter-section.price-categories .filter-btn.active')
        .forEach(b => b.classList.remove('active'));
      filterState.price = wasActive ? null : btn.dataset.price;  // click again = toggle off
      if (!wasActive) btn.classList.add('active');
      applyFilters();
    });
  });

  const clearBtn = document.querySelector('.clear-filter');
  if (clearBtn) clearBtn.addEventListener('click', resetFilters);
}

function applyFilters() {
  filtered = allListings.filter(l =>
    (filterState.country === 'all' || l.country === filterState.country) &&
    (!filterState.city || l.city === filterState.city) &&
    (!filterState.price || l.budget_tier === filterState.price)
  );

  currentPage = 1;
  updateFilterPath();
  showPage(1);
}

function resetFilters() {
  filterState.country = 'all';
  filterState.city = null;
  filterState.price = null;

  document.querySelectorAll('.filter-btn.active').forEach(b => b.classList.remove('active'));
  const allBtn = document.querySelector('.filter-btn[data-country="all"]');
  if (allBtn) allBtn.classList.add('active');

  showCitiesForCountry('all');
  showFeaturedRestaurant('all');
  applyFilters();
}

function showCitiesForCountry(country) {
  document.querySelectorAll('.filter-section.cities').forEach(s => s.style.display = 'none');

  // The price filter is hidden by default (style.css) and appears
  // once a country is chosen — same as the original page.
  const priceSection = document.querySelector('.filter-section.price-categories');
  if (priceSection) priceSection.style.display = country === 'all' ? 'none' : 'block';

  if (country === 'all') return;
  const section = document.querySelector(`.filter-section.cities.${country}-cities`);
  if (section) section.style.display = 'block';
}

function updateFilterPath() {
  const el = document.querySelector('.current-filter');
  if (!el) return;

  const parts = [];
  if (filterState.country !== 'all') parts.push(titleCase(filterState.country));
  if (filterState.city) parts.push(titleCase(filterState.city));
  if (filterState.price) parts.push(titleCase(filterState.price));

  el.textContent = parts.length
    ? (filterState.city ? parts.join(' > ') : `All ${parts.join(' > ')}`)
    : 'All';
}

// ------------------------------------------------------------
// Featured restaurant
// ------------------------------------------------------------

function showFeaturedRestaurant(country) {
  const section = document.querySelector('.featured-section');
  const hero = document.querySelector('.featured-hero');
  if (!section || !hero) return;

  const pick = COUNTRY_HIGHLIGHT[country];
  if (!pick) {
    section.style.display = 'none';
    return;
  }

  hero.innerHTML = `
    <div class="featured-hero-image">
      <img src="${pick.image}" alt="${pick.name}">
    </div>
    <div class="featured-hero-content">
      <span class="featured-category">Featured</span>
      <h3 class="featured-title">${pick.name}</h3>
      <p class="featured-desc">${pick.description}</p>
      <div class="featured-meta">
        <div class="featured-location"><i class="fas fa-map-marker-alt"></i> ${titleCase(pick.city)}, ${titleCase(country)}</div>
        <div class="featured-price">${pick.price}</div>
      </div>
      <a href="#" class="featured-cta" data-city="${pick.city}">Explore Restaurants in ${titleCase(pick.city)}</a>
    </div>`;
  section.style.display = 'block';

  hero.querySelector('.featured-cta').addEventListener('click', (e) => {
    e.preventDefault();
    const cityBtn = document.querySelector(`.filter-btn[data-city="${pick.city}"]`);
    if (cityBtn) cityBtn.click();
  });
}

// ------------------------------------------------------------
// Cards + pagination
// ------------------------------------------------------------

function cardHTML(listing) {
  const href = listing.link || `listing.html?id=${listing.id}`;
  const tier = (listing.budget_tier || 'standard').toUpperCase();
  const stars = listing.rating != null
    ? `<div class="food-card-stars">${'★'.repeat(Math.round(listing.rating))}</div>` : '';
  return `
    <a class="food-card" href="${href}">
      <div class="food-card-img">
        <img src="${imageFor(listing)}" alt="${listing.name}" loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800&q=80'">
        <span class="food-card-category">${tier}</span>
      </div>
      <div class="food-card-content">
        <h3 class="food-card-title">${listing.name}</h3>
        <p class="food-card-desc">${listing.description || ''}</p>
        <div class="food-card-meta">
          <div>${listing.price_range || ''}</div>
          ${stars}
          <div>${titleCase(listing.city)}, ${titleCase(listing.country)}</div>
        </div>
      </div>
    </a>`;
}

function showPage(page, scroll = false) {
  currentPage = page;
  const grid = document.querySelector('.food-grid');
  const start = (page - 1) * ITEMS_PER_PAGE;
  const slice = filtered.slice(start, start + ITEMS_PER_PAGE);

  grid.innerHTML = slice.length
    ? slice.map(cardHTML).join('')
    : `<div class="initial-message" style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #666;">
         No restaurants match these filters yet.
       </div>`;

  renderPagination();
  if (scroll) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderPagination() {
  let container = document.querySelector('.pagination');
  if (!container) {
    container = document.createElement('div');
    container.className = 'pagination';
    document.querySelector('.food-grid').after(container);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  if (totalPages === 1) {
    container.innerHTML = '';
    return;
  }

  let html = `<button class="pagination-btn" data-page="${currentPage - 1}"
                ${currentPage === 1 ? 'disabled' : ''}>&laquo; Previous</button>`;
  for (let p = 1; p <= totalPages; p++) {
    html += `<button class="pagination-btn page-btn ${p === currentPage ? 'active' : ''}"
               data-page="${p}">${p}</button>`;
  }
  html += `<button class="pagination-btn" data-page="${currentPage + 1}"
             ${currentPage === totalPages ? 'disabled' : ''}>Next &raquo;</button>`;
  container.innerHTML = html;

  container.querySelectorAll('button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => showPage(Number(btn.dataset.page), true));
  });
}
