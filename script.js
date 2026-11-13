// ============================================================
// Eastworld homepage scripts
//  1. Carousel: powers every element with class "carousel"
//  2. Blog posts: fetches posts from the backend API
//  3. Country filter: WORLD or a single country; re-filters the
//     carousel, spotlights, stories, videos, ticker and map
// All features are no-ops on pages that don't have the elements.
// ============================================================

class Carousel {
  constructor(element) {
    this.element = element;
    this.items = element.querySelectorAll('.carousel-item');
    this.indicatorsContainer = element.querySelector('.carousel-indicators');
    this.currentIndex = 0;
    this.autoplaySpeed = 5000;
    this.interval = null;

    this.buildIndicators();
    this.bindControls();
    this.startAutoplay();

    // Pause on hover so users can read / click
    element.addEventListener('mouseenter', () => this.stopAutoplay());
    element.addEventListener('mouseleave', () => this.startAutoplay());
  }

  buildIndicators() {
    if (!this.indicatorsContainer) return;
    this.items.forEach((_, index) => {
      const dot = document.createElement('div');
      dot.classList.add('carousel-indicator');
      if (index === 0) dot.classList.add('active');
      dot.addEventListener('click', () => this.showSlide(index));
      this.indicatorsContainer.appendChild(dot);
    });
  }

  bindControls() {
    this.element.querySelectorAll('.carousel-button').forEach(button => {
      button.addEventListener('click', () => {
        button.classList.contains('prev') ? this.prev() : this.next();
      });
    });
  }

  showSlide(index) {
    this.items[this.currentIndex].classList.remove('active');
    this.items[index].classList.add('active');

    if (this.indicatorsContainer) {
      const dots = this.indicatorsContainer.querySelectorAll('.carousel-indicator');
      dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    }
    this.currentIndex = index;
  }

  next() { this.showSlide((this.currentIndex + 1) % this.items.length); }
  prev() { this.showSlide((this.currentIndex - 1 + this.items.length) % this.items.length); }

  startAutoplay() {
    this.stopAutoplay();
    this.interval = setInterval(() => this.next(), this.autoplaySpeed);
  }

  stopAutoplay() {
    if (this.interval) clearInterval(this.interval);
  }
}

// ------------------------------------------------------------
// Country filter state. 'world' = no filtering. Every homepage
// data fetch goes through withCountry() so switching the toggle
// re-scopes the whole page.
// ------------------------------------------------------------

let currentCountry = 'world';

function withCountry(url) {
  if (currentCountry === 'world') return url;
  return `${url}${url.includes('?') ? '&' : '?'}country=${currentCountry}`;
}

// "phnom-penh" + "cambodia" -> "PHNOM PENH, CAMBODIA"
function placeTag(item) {
  const pretty = s => s.replace(/-/g, ' ').toUpperCase();
  return [item.city, item.country].filter(Boolean).map(pretty).join(', ');
}

// ------------------------------------------------------------
// Scroll reveal: elements with .reveal fade/slide in when they
// enter the viewport. observeReveals() is called for every new
// batch of dynamically added cards, with a stagger per batch.
// ------------------------------------------------------------

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, { rootMargin: '0px 0px -40px 0px' });

function observeReveals(container, stagger = 90) {
  container.querySelectorAll('.reveal:not(.in)').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 6) * stagger}ms`;
    revealObserver.observe(el);
  });
}

// ------------------------------------------------------------
// Blog posts with infinite scroll.
//
// The backend is paginated: /api/posts?limit=5&offset=10 returns
// posts 11-15. We load 5 at a time. An invisible "sentinel" div
// sits below the post list; an IntersectionObserver watches it,
// and whenever it comes into view we fetch the next 5 posts.
// reloadStories() resets everything when the country changes.
// ------------------------------------------------------------

let reloadStories = null;

function initInfinitePosts() {
  const grid = document.getElementById('posts-grid');
  const sentinel = document.getElementById('posts-sentinel');
  if (!grid || !sentinel) return;

  const PAGE_SIZE = 5;
  let offset = 0;
  let isLoading = false;   // prevents parallel fetches of the same page
  let reachedEnd = false;

  function renderCards(posts) {
    return posts.map(post => `
      <a class="story-card reveal" href="post.html?id=${post.id}">
        <div class="story-card-img"><img src="${post.image_url}" alt="${post.title}" loading="lazy"></div>
        <div class="story-card-body">
          <span class="category">${post.category}</span>
          <h3>${post.title}</h3>
          <p>${post.excerpt}</p>
          ${placeTag(post) ? `<span class="story-meta">${placeTag(post)}</span>` : ''}
          <span class="read-more">READ MORE</span>
        </div>
      </a>
    `).join('');
  }

  async function loadMore() {
    if (isLoading || reachedEnd) return;
    isLoading = true;
    sentinel.textContent = 'Loading more stories…';

    try {
      const response = await fetch(withCountry(`/api/posts?limit=${PAGE_SIZE}&offset=${offset}`));
      if (!response.ok) throw new Error(`API returned ${response.status}`);
      const posts = await response.json();

      // First page replaces the "Loading..." placeholder
      if (offset === 0) grid.innerHTML = '';

      grid.insertAdjacentHTML('beforeend', renderCards(posts));
      offset += posts.length;
      observeReveals(grid);

      if (posts.length < PAGE_SIZE) {
        reachedEnd = true;
        observer.disconnect();
        sentinel.textContent = offset === 0 ? 'No stories here yet.' : "You're all caught up.";
      } else {
        sentinel.textContent = '';
      }
    } catch (err) {
      reachedEnd = true;
      observer.disconnect();
      grid.innerHTML = `
        <p class="posts-status">
          Couldn't load stories. Is the backend running?<br>
          Start it with: <code>cd backend &amp;&amp; python3 app.py</code>
          then open <a href="http://localhost:5001">http://localhost:5001</a>
        </p>`;
      sentinel.textContent = '';
    } finally {
      isLoading = false;
      // The observer only fires when the sentinel ENTERS the viewport.
      // If the newly added cards didn't push it below the fold, no new
      // event will ever come — so re-check manually and keep loading
      // until the sentinel is genuinely out of view (or we're done).
      if (!reachedEnd && sentinel.getBoundingClientRect().top < window.innerHeight) {
        loadMore();
      }
    }
  }

  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) loadMore();
  });

  reloadStories = () => {
    offset = 0;
    isLoading = false;
    reachedEnd = false;
    observer.disconnect();
    grid.innerHTML = '<p class="posts-status">Loading stories…</p>';
    sentinel.textContent = '';
    observer.observe(sentinel);
    loadMore();
  };

  observer.observe(sentinel);
  loadMore(); // first page, immediately
}

// ------------------------------------------------------------
// Vertical videos strip (homepage, below the stories).
//
// Up to five videos from the admin's VIDEOS tab, each in a
// portrait 9:16 player, laid out in one horizontal row.
// The whole band stays hidden if there are no videos.
// ------------------------------------------------------------

async function initVideosStrip() {
  const band = document.getElementById('videos-band');
  const strip = document.getElementById('videos-strip');
  if (!band || !strip) return;

  let videos;
  try {
    const res = await fetch(withCountry('/api/videos?limit=5'));
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    videos = await res.json();
  } catch {
    return; // no backend: the band just stays hidden
  }
  if (videos.length === 0) {
    band.hidden = true;
    return;
  }

  strip.innerHTML = videos.map(video => `
    <div class="video-card">
      <iframe src="${video.embed_url}?rel=0&playsinline=1" title="${video.title}"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen loading="lazy"></iframe>
      <p class="video-title">${video.title}</p>
    </div>`).join('');
  band.hidden = false;
}

// ------------------------------------------------------------
// Headline ticker (homepage, under the nav).
//
// Scrolls the latest post titles in an infinite marquee. The
// track content is duplicated exactly once so the CSS animation
// can loop seamlessly by translating -50%.
// ------------------------------------------------------------

async function initTicker() {
  const ticker = document.getElementById('ticker');
  const track = document.getElementById('ticker-track');
  if (!ticker || !track) return;

  let posts;
  try {
    const res = await fetch(withCountry('/api/posts?limit=8'));
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    posts = await res.json();
  } catch {
    return; // no backend: the bar just stays hidden
  }
  if (posts.length === 0) {
    ticker.hidden = true;
    return;
  }

  const sequence = posts
    .map(p => `<a href="post.html?id=${p.id}">${p.title}</a><span class="ticker-dot">◆</span>`)
    .join('');
  track.innerHTML = sequence + sequence;

  // Speed scales with content length so long lists don't race by
  const seconds = Math.max(30, posts.length * 7);
  track.style.animationDuration = `${seconds}s`;
  ticker.hidden = false;
}

// ------------------------------------------------------------
// Dynamic carousels (homepage).
//
// Carousels marked with data-slides="top" get their slides from
// /api/slides — curated in the admin's CAROUSELS tab. Carousels
// without the attribute (on older pages) keep their hardcoded
// slides and initialize immediately.
// ------------------------------------------------------------

// Live instances, so a country switch can stop the old autoplay
// timers before the slides are rebuilt.
const activeCarousels = new Map();

function hideCarousel(el) {
  el.style.display = 'none';
  // In the header, the spotlights panel then takes the full width
  const hero = el.closest('.hero');
  if (hero) hero.classList.add('no-carousel');
}

function slideHTML(slide, isFirst) {
  const caption = `
    <div class="carousel-caption">
      ${slide.category ? `<span class="category">${slide.category}</span>` : ''}
      <h1>${slide.title}</h1>
      <p>${slide.description}</p>
    </div>`;
  const cls = `carousel-item${isFirst ? ' active' : ''}`;
  const img = `<img src="${slide.image_url}" alt="${slide.title}">`;

  return slide.link
    ? `<a class="${cls}" href="${slide.link}">${img}${caption}</a>`
    : `<div class="${cls}">${img}${caption}</div>`;
}

async function initDynamicCarousels(carousels) {
  let slides;
  try {
    const res = await fetch(withCountry('/api/slides'));
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    slides = await res.json();
  } catch {
    carousels.forEach(hideCarousel);
    return;
  }

  carousels.forEach(el => {
    const items = slides[el.dataset.slides] || [];
    if (items.length === 0) {
      hideCarousel(el);   // an empty carousel shows nothing
      return;
    }
    el.style.display = '';
    el.closest('.hero')?.classList.remove('no-carousel');

    if (activeCarousels.has(el)) {
      activeCarousels.get(el).stopAutoplay();
      activeCarousels.delete(el);
    }
    el.querySelector('.carousel-track').innerHTML =
      items.map((s, i) => slideHTML(s, i === 0)).join('');
    el.querySelector('.carousel-indicators').innerHTML = '';
    activeCarousels.set(el, new Carousel(el));
  });
}

// ------------------------------------------------------------
// Country toggle (homepage, above the map). One click re-scopes
// every section and flies the map to the selected country.
// ------------------------------------------------------------

function applyCountryFilter() {
  // The trending sidebar has its own country dropdown; drive it
  const select = document.getElementById('trending-country');
  if (select) {
    select.value = currentCountry === 'world' ? 'all' : currentCountry;
    select.dispatchEvent(new Event('change'));
  }

  if (reloadStories) reloadStories();

  const dynamic = [...document.querySelectorAll('.carousel[data-slides]')];
  if (dynamic.length) initDynamicCarousels(dynamic);

  initTicker();
  initVideosStrip();

  if (window.EastworldMap) window.EastworldMap.setCountry(currentCountry);
}

function initCountryFilter() {
  const toggle = document.getElementById('country-toggle');
  if (!toggle) return;

  // Allow shareable filtered links, e.g. index.html?country=cambodia
  const requested = new URLSearchParams(location.search).get('country');
  const valid = [...toggle.querySelectorAll('.country-btn')].map(b => b.dataset.country);
  if (requested && valid.includes(requested)) {
    currentCountry = requested;
    toggle.querySelectorAll('.country-btn')
      .forEach(b => b.classList.toggle('active', b.dataset.country === requested));
    if (window.EastworldMap) window.EastworldMap.setCountry(requested);
    // trending.js reads this select's value on its initial render
    const select = document.getElementById('trending-country');
    if (select) select.value = requested;
  }

  toggle.querySelectorAll('.country-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.country === currentCountry) return;
      currentCountry = btn.dataset.country;
      toggle.querySelectorAll('.country-btn')
        .forEach(b => b.classList.toggle('active', b === btn));
      applyCountryFilter();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCountryFilter();

  const dynamic = [];
  document.querySelectorAll('.carousel').forEach(el => {
    if (el.dataset.slides) dynamic.push(el);
    else new Carousel(el);
  });
  if (dynamic.length) initDynamicCarousels(dynamic);

  initTicker();
  initInfinitePosts();
  initVideosStrip();
});
