// ============================================================
// Shared engine for the listing catalog pages (stays, places,
// products). Each page provides a small config and this file
// does the rest: fetching from /api/listings, the country >
// city > price/category filter system, breadcrumb, pagination.
//
// config = {
//   type:        'stay' | 'place' | 'product',
//   grid:        CSS selector of the cards container,
//   cardHTML:    (listing) => html string,
//   renderFeatured: (country) => void   // optional
// }
// ============================================================

const ITEMS_PER_PAGE = 9;

const titleCase = (s) => (s || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

function initCatalog(config) {
  let allListings = [];
  let filtered = [];
  let currentPage = 1;
  const filterState = { country: 'all', city: null, price: null, category: null };

  const grid = document.querySelector(config.grid);
  if (!grid) return;

  // ---------------- loading ----------------

  (async () => {
    try {
      const res = await fetch(`/api/listings?type=${config.type}&limit=500`);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      allListings = await res.json();
    } catch {
      grid.innerHTML = `
        <div class="initial-message" style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #666;">
          Couldn't load listings. Is the backend running?<br>
          Start it with: <code>cd backend &amp;&amp; python3 app.py</code>
        </div>`;
      return;
    }
    wireFilters();
    if (config.renderFeatured) config.renderFeatured('all');
    applyFilters();
  })();

  // ---------------- filters ----------------

  function wireFilters() {
    document.querySelectorAll('.filter-section.countries .filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filterState.country = btn.dataset.country;
        filterState.city = null;
        filterState.price = null;
        filterState.category = null;

        document.querySelectorAll('.filter-btn.active').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const allCat = document.querySelector('.filter-btn[data-category="all"]');
        if (allCat) allCat.classList.add('active');

        revealSections(filterState.country);
        if (config.renderFeatured) config.renderFeatured(filterState.country);
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

    document.querySelectorAll('.filter-btn[data-price]').forEach(btn => {
      btn.addEventListener('click', () => {
        const wasActive = btn.classList.contains('active');
        document.querySelectorAll('.filter-btn[data-price].active')
          .forEach(b => b.classList.remove('active'));
        filterState.price = wasActive ? null : btn.dataset.price;  // second click = off
        if (!wasActive) btn.classList.add('active');
        applyFilters();
      });
    });

    document.querySelectorAll('.filter-btn[data-category]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn[data-category].active')
          .forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterState.category = btn.dataset.category === 'all' ? null : btn.dataset.category;
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
      (!filterState.price || l.budget_tier === filterState.price) &&
      (!filterState.category || l.category === filterState.category)
    );
    currentPage = 1;
    updateFilterPath();
    showPage(1);
  }

  function resetFilters() {
    filterState.country = 'all';
    filterState.city = null;
    filterState.price = null;
    filterState.category = null;

    document.querySelectorAll('.filter-btn.active').forEach(b => b.classList.remove('active'));
    const allBtn = document.querySelector('.filter-btn[data-country="all"]');
    if (allBtn) allBtn.classList.add('active');
    const allCat = document.querySelector('.filter-btn[data-category="all"]');
    if (allCat) allCat.classList.add('active');

    revealSections('all');
    if (config.renderFeatured) config.renderFeatured('all');
    applyFilters();
  }

  // City list for the picked country appears; the price/category
  // sections are hidden until a country is chosen (as before).
  function revealSections(country) {
    document.querySelectorAll('.filter-section.cities').forEach(s => s.style.display = 'none');

    ['.filter-section.price-categories', '.filter-section.categories'].forEach(sel => {
      const section = document.querySelector(sel);
      if (section) section.style.display = country === 'all' ? 'none' : 'block';
    });

    if (country === 'all') return;
    const citySection = document.querySelector(`.filter-section.cities.${country}-cities`);
    if (citySection) citySection.style.display = 'block';
  }

  function updateFilterPath() {
    const el = document.querySelector('.current-filter');
    if (!el) return;

    const parts = [];
    if (filterState.country !== 'all') parts.push(titleCase(filterState.country));
    if (filterState.city) parts.push(titleCase(filterState.city));
    if (filterState.price) parts.push(titleCase(filterState.price));
    if (filterState.category) parts.push(titleCase(filterState.category));

    el.textContent = parts.length
      ? (filterState.city || filterState.price || filterState.category
          ? parts.join(' > ') : `All ${parts[0]}`)
      : 'All';
  }

  // ---------------- cards + pagination ----------------

  function showPage(page, scroll = false) {
    currentPage = page;
    const start = (page - 1) * ITEMS_PER_PAGE;
    const slice = filtered.slice(start, start + ITEMS_PER_PAGE);

    grid.innerHTML = slice.length
      ? slice.map(config.cardHTML).join('')
      : `<div class="initial-message" style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #666;">
           Nothing matches these filters yet.
         </div>`;

    renderPagination();
    if (scroll) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderPagination() {
    let container = document.querySelector('.pagination');
    if (!container) {
      container = document.createElement('div');
      container.className = 'pagination';
      grid.after(container);
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
}

// Helper shared by the page configs: destination for a card
function listingHref(listing) {
  return listing.link || `listing.html?id=${listing.id}`;
}

// Helper: font-awesome star row for a 0-5 rating (empty if unrated)
function starsHTML(rating, cssClass) {
  if (rating == null) return '';
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  let icons = '<i class="fas fa-star"></i>'.repeat(full);
  if (half) icons += '<i class="fas fa-star-half-alt"></i>';
  return `<div class="${cssClass}">${icons}</div>`;
}
