// ============================================================
// Eastworld homepage scripts
//  1. Carousel: powers every element with class "carousel"
//  2. Blog posts: fetches posts from the backend API
// Both are no-ops on pages that don't have the elements.
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
// Blog posts with infinite scroll.
//
// The backend is paginated: /api/posts?limit=5&offset=10 returns
// posts 11-15. We load 5 at a time. An invisible "sentinel" div
// sits below the post list; an IntersectionObserver watches it,
// and whenever it comes into view we fetch the next 5 posts.
// When the API returns fewer than 5, we've reached the end and
// stop observing.
// ------------------------------------------------------------

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

function initInfinitePosts() {
  const grid = document.getElementById('posts-grid');
  const sentinel = document.getElementById('posts-sentinel');
  if (!grid || !sentinel) return;

  const PAGE_SIZE = 5;
  let offset = 0;
  let isLoading = false;   // prevents parallel fetches of the same page
  let reachedEnd = false;

  // The very first post of the feed becomes a large feature card;
  // everything after is a numbered editorial row.
  function renderCards(posts) {
    return posts.map((post, i) => {
      const num = String(offset + i + 1).padStart(2, '0');
      if (offset === 0 && i === 0) {
        return `
      <a class="story-feature reveal" href="post.html?id=${post.id}">
        <div class="story-feature-img"><img src="${post.image_url}" alt="${post.title}"></div>
        <div class="story-feature-body">
          <span class="category">${post.category}</span>
          <h3>${post.title}</h3>
          <p>${post.excerpt}</p>
          <span class="read-more">READ MORE</span>
        </div>
      </a>`;
      }
      return `
      <a class="story-row reveal" href="post.html?id=${post.id}">
        <span class="story-num">${num}</span>
        <div class="story-thumb"><img src="${post.image_url}" alt="${post.title}" loading="lazy"></div>
        <div class="story-body">
          <span class="category">${post.category}</span>
          <h3>${post.title}</h3>
          <p>${post.excerpt}</p>
        </div>
      </a>`;
    }).join('');
  }

  async function loadMore() {
    if (isLoading || reachedEnd) return;
    isLoading = true;
    sentinel.textContent = 'Loading more stories\u2026';

    try {
      const response = await fetch(`/api/posts?limit=${PAGE_SIZE}&offset=${offset}`);
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
        sentinel.textContent = offset === 0 ? 'No stories yet.' : "You're all caught up.";
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

  // No prefetch margin: the next page loads only when the reader
  // actually reaches the bottom, so the loading step is visible.
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) loadMore();
  });

  observer.observe(sentinel);
  loadMore(); // first page, immediately
}

// ------------------------------------------------------------
// Video rail (homepage sidebar, above trending).
//
// Shows the #1 video from the admin's VIDEOS tab, auto-playing.
// Browsers only allow autoplay when muted, so it starts silent
// and viewers unmute with one click on the player.
// ------------------------------------------------------------

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
    const res = await fetch('/api/videos?limit=5');
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    videos = await res.json();
  } catch {
    return; // no backend or no data: the band just stays hidden
  }
  if (videos.length === 0) return;

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
    const res = await fetch('/api/posts?limit=8');
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    posts = await res.json();
  } catch {
    return; // no backend: the bar just stays hidden
  }
  if (posts.length === 0) return;

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
// Carousels marked with data-slides="top|bottom" get their
// slides from /api/slides — curated in the admin's CAROUSELS
// tab. Carousels without the attribute (on older pages) keep
// their hardcoded slides and initialize immediately.
// ------------------------------------------------------------

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

function hideCarousel(el) {
  // Hide the whole band (header included) when there's nothing to show
  const band = el.closest('.guides-band');
  (band || el).style.display = 'none';
  // In the header, the spotlights panel then takes the full width
  const hero = el.closest('.hero');
  if (hero) hero.classList.add('no-carousel');
}

async function initDynamicCarousels(carousels) {
  let slides;
  try {
    const res = await fetch('/api/slides');
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
    el.querySelector('.carousel-track').innerHTML =
      items.map((s, i) => slideHTML(s, i === 0)).join('');
    new Carousel(el);
  });
}

document.addEventListener('DOMContentLoaded', () => {
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
