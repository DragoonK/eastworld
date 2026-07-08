// ============================================================
// Places page: attractions loaded from /api/listings?type=place.
// Shared filter/pagination logic lives in catalog.js.
// ============================================================

// Featured wonder per country. (Editorial content — edit freely.)
const FEATURED_WONDERS = {
  japan: {
    name: 'Fushimi Inari Taisha',
    city: 'kyoto',
    category: 'cultural',
    description: 'Iconic shrine with thousands of vermilion torii gates winding up Mount Inari',
    image: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
    link: 'places/fushimi-inari.html'
  },
  china: {
    name: 'Great Wall of China',
    city: 'beijing',
    category: 'historical',
    description: 'One of the greatest wonders of the world, stretching thousands of kilometers across northern China',
    image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
    link: 'places/great-wall.html'
  },
  thailand: {
    name: 'Grand Palace',
    city: 'bangkok',
    category: 'historical',
    description: 'Spectacular complex of buildings serving as the official residence of the Kings of Thailand',
    image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
  },
  cambodia: {
    name: 'Angkor Wat',
    city: 'siem-reap',
    category: 'historical',
    description: 'The largest religious monument in the world and the heart of the ancient Khmer empire',
    image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1050&q=80',
    link: 'places/angkor-wat.html'
  },
  australia: {
    name: 'Sydney Opera House',
    city: 'sydney',
    category: 'landmark',
    description: "Australia's most recognizable building and a masterpiece of 20th century architecture",
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
  }
};

function renderFeaturedWonder(country) {
  const section = document.querySelector('.featured-section');
  const gridEl = document.querySelector('.featured-grid');
  if (!section || !gridEl) return;

  const pick = FEATURED_WONDERS[country];
  if (!pick) {
    section.style.display = 'none';
    return;
  }

  gridEl.innerHTML = `
    <a href="${pick.link || '#'}" class="featured-card">
      <img src="${pick.image}" alt="${pick.name}">
      <div class="featured-content">
        <span class="featured-category">${titleCase(pick.category)}</span>
        <h3 class="featured-title">${pick.name}</h3>
        <p class="featured-desc">${pick.description}</p>
      </div>
    </a>`;
  section.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  initCatalog({
    type: 'place',
    grid: '.places-grid',
    renderFeatured: renderFeaturedWonder,
    cardHTML: (l) => `
      <a class="wonder-card" href="${listingHref(l)}">
        <div class="wonder-card-img">
          <img src="${l.image_url || 'https://images.unsplash.com/photo-1480796927426-f609979314bd?auto=format&fit=crop&w=800&q=70'}"
               alt="${l.name}" loading="lazy"
               onerror="this.src='https://images.unsplash.com/photo-1480796927426-f609979314bd?auto=format&fit=crop&w=800&q=70'">
        </div>
        <div class="wonder-card-content">
          <div class="wonder-card-category">${(l.category || 'place').toUpperCase()}</div>
          <h3 class="wonder-card-title">${l.name}</h3>
          <p class="wonder-card-description">${l.description || ''}</p>
          <div class="wonder-card-location">
            <i class="fas fa-map-marker-alt"></i> ${titleCase(l.city)}, ${titleCase(l.country)}
          </div>
        </div>
      </a>`,
  });
});
