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
      <a class="post-card" href="post.html?id=${post.id}">
        <img src="${post.image_url}" alt="${post.title}" loading="lazy">
        <div class="post-card-body">
          <span class="category">${post.category}</span>
          <h3>${post.title}</h3>
          <p>${post.excerpt}</p>
        </div>
      </a>
    `).join('');
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
    }
  }

  // rootMargin makes the sentinel "visible" 400px before it enters
  // the viewport, so the next page is usually ready by the time
  // the reader gets there.
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) loadMore();
  }, { rootMargin: '400px' });

  observer.observe(sentinel);
  loadMore(); // first page, immediately
}

// ------------------------------------------------------------
// Video rail (homepage sidebar, above trending).
//
// Videos are curated in the admin's VIDEOS tab and served by
// /api/videos. Nothing is embedded until the user clicks play:
// we show YouTube thumbnails, and only then swap in the iframe.
// That keeps the homepage fast (a YouTube embed loads ~1MB of
// scripts) and means zero video traffic on our server.
// ------------------------------------------------------------

async function initVideoRail() {
  const rail = document.getElementById('video-rail');
  const main = document.getElementById('video-main');
  const thumbs = document.getElementById('video-thumbs');
  if (!rail || !main || !thumbs) return;

  let videos;
  try {
    const res = await fetch('/api/videos?limit=4');
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    videos = await res.json();
  } catch {
    return; // no backend or no data: the rail just stays hidden
  }
  if (videos.length === 0) return;

  function showMain(video, autoplay) {
    main.innerHTML = autoplay
      ? `<iframe src="${video.embed_url}?autoplay=1&rel=0" title="${video.title}"
           allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
           allowfullscreen></iframe>
         <p class="video-title">${video.title}</p>`
      : `<button class="video-poster" aria-label="Play: ${video.title}">
           <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
           <span class="video-play">&#9654;</span>
         </button>
         <p class="video-title">${video.title}</p>`;

    const poster = main.querySelector('.video-poster');
    if (poster) poster.addEventListener('click', () => showMain(video, true));
  }

  function renderThumbs(mainVideo) {
    thumbs.innerHTML = videos
      .filter(v => v.id !== mainVideo.id)
      .map(v => `
        <button class="video-thumb" data-video="${v.id}">
          <img src="${v.thumbnail}" alt="" loading="lazy">
          <span>${v.title}</span>
        </button>`)
      .join('');

    thumbs.querySelectorAll('.video-thumb').forEach(btn => {
      btn.addEventListener('click', () => {
        const video = videos.find(v => v.id === Number(btn.dataset.video));
        showMain(video, true);
        renderThumbs(video);
      });
    });
  }

  showMain(videos[0], false);
  renderThumbs(videos[0]);
  rail.hidden = false;
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

async function initDynamicCarousels(carousels) {
  let slides;
  try {
    const res = await fetch('/api/slides');
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    slides = await res.json();
  } catch {
    carousels.forEach(el => el.style.display = 'none');
    return;
  }

  carousels.forEach(el => {
    const items = slides[el.dataset.slides] || [];
    if (items.length === 0) {
      el.style.display = 'none';   // an empty carousel shows nothing
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

  initInfinitePosts();
  initVideoRail();
});
