// ============================================================
// Eastworld admin dashboard.
//
// Auth: the password is checked once against /api/admin/check,
// then kept in sessionStorage and sent with every write request
// as an X-Admin-Password header. Closing the tab forgets it.
// ============================================================

const $ = (sel) => document.querySelector(sel);

let password = sessionStorage.getItem('ew_admin_pw') || '';

function authHeaders() {
  return { 'X-Admin-Password': password };
}

// ---------------------------- login ----------------------------

async function tryLogin(pw) {
  const res = await fetch('/api/admin/check', { headers: { 'X-Admin-Password': pw } });
  return res.ok;
}

function showDashboard() {
  $('#login-view').hidden = true;
  $('#dashboard').hidden = false;
  $('#logout-btn').hidden = false;
  loadPosts();
  loadListings();
  loadTrending();
  loadVideos();
  loadEvents();
  loadSlides();
  loadUsers();
}

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pw = $('#login-password').value;
  if (await tryLogin(pw)) {
    password = pw;
    sessionStorage.setItem('ew_admin_pw', pw);
    showDashboard();
  } else {
    $('#login-status').textContent = 'Wrong password.';
  }
});

$('#logout-btn').addEventListener('click', () => {
  sessionStorage.removeItem('ew_admin_pw');
  location.reload();
});

// Auto-login if the password is still in this browser session
if (password) {
  tryLogin(password).then(ok => ok ? showDashboard() : sessionStorage.removeItem('ew_admin_pw'));
}

// ---------------------------- tabs ----------------------------

document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p => p.hidden = true);
    $(`#${tab.dataset.tab}-tab`).hidden = false;
  });
});

// ============================================================
// POSTS
// ============================================================

let editingPostId = null;   // null = creating, number = editing

async function loadPosts() {
  const res = await fetch('/api/posts?limit=50');
  const posts = await res.json();

  $('#posts-table').innerHTML = `
    <table class="admin-table">
      <thead><tr><th>Title</th><th>Category</th><th>Created</th><th></th></tr></thead>
      <tbody>
        ${posts.map(p => `
          <tr>
            <td><a href="post.html?id=${p.id}" target="_blank">${p.title}</a></td>
            <td>${p.category}</td>
            <td>${(p.created_at || '').slice(0, 10)}</td>
            <td class="row-actions">
              <button data-edit-post="${p.id}">Edit</button>
              <button data-delete-post="${p.id}" class="danger">Delete</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

$('#new-post-btn').addEventListener('click', () => {
  editingPostId = null;
  $('#post-form').reset();
  $('#post-form-title').textContent = 'New Post';
  $('#post-form').hidden = false;
  $('#post-form').scrollIntoView({ behavior: 'smooth' });
});

$('#posts-table').addEventListener('click', async (e) => {
  const editId = e.target.dataset.editPost;
  const deleteId = e.target.dataset.deletePost;

  if (editId) {
    const post = await (await fetch(`/api/posts/${editId}`)).json();
    const form = $('#post-form');
    form.reset();
    form.title.value = post.title;
    form.category.value = post.category;
    form.excerpt.value = post.excerpt;
    form.content.value = post.content;
    // image inputs stay empty = keep the current image
    editingPostId = post.id;
    $('#post-form-title').textContent = `Editing: ${post.title}`;
    form.hidden = false;
    form.scrollIntoView({ behavior: 'smooth' });
  }

  if (deleteId) {
    if (!confirm('Delete this post permanently?')) return;
    const res = await fetch(`/api/posts/${deleteId}`, { method: 'DELETE', headers: authHeaders() });
    if (res.ok) loadPosts();
    else alert('Delete failed: ' + (await res.json()).error);
  }
});

$('#post-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const msg = form.querySelector('.form-msg');
  msg.textContent = 'Saving…';

  const url = editingPostId ? `/api/posts/${editingPostId}` : '/api/posts';
  const method = editingPostId ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: authHeaders(),
    body: new FormData(form),
  });
  const result = await res.json();

  if (res.ok) {
    msg.textContent = '';
    form.hidden = true;
    form.reset();
    loadPosts();
  } else {
    msg.textContent = 'Error: ' + result.error;
  }
});

// ============================================================
// LISTINGS
// ============================================================

let editingListingId = null;

async function loadListings() {
  const params = new URLSearchParams({ limit: 500 });
  if ($('#filter-type').value) params.set('type', $('#filter-type').value);
  if ($('#filter-country').value) params.set('country', $('#filter-country').value);
  if ($('#filter-search').value.trim()) params.set('q', $('#filter-search').value.trim());

  const res = await fetch(`/api/listings?${params}`);
  const listings = await res.json();

  $('#listings-table').innerHTML = `
    <p class="table-count">${listings.length} listing${listings.length === 1 ? '' : 's'}</p>
    <table class="admin-table">
      <thead><tr>
        <th>Name</th><th>Type</th><th>Country</th><th>City</th>
        <th>Tier</th><th>Price</th><th>Rating</th><th></th>
      </tr></thead>
      <tbody>
        ${listings.map(l => `
          <tr>
            <td><a href="listing.html?id=${l.id}" target="_blank">${l.name}</a></td>
            <td>${l.type}</td>
            <td>${l.country}</td>
            <td>${l.city || '—'}</td>
            <td>${l.budget_tier || '—'}</td>
            <td>${l.price_range || '—'}</td>
            <td>${l.rating ?? '—'}</td>
            <td class="row-actions">
              <button data-edit-listing="${l.id}">Edit</button>
              <button data-delete-listing="${l.id}" class="danger">Delete</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

['filter-type', 'filter-country'].forEach(id =>
  document.getElementById(id).addEventListener('change', loadListings));

let searchTimer;
$('#filter-search').addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadListings, 300);   // debounce typing
});

$('#new-listing-btn').addEventListener('click', () => {
  editingListingId = null;
  $('#listing-form').reset();
  $('#listing-form-title').textContent = 'New Listing';
  $('#listing-form').hidden = false;
  $('#listing-form').scrollIntoView({ behavior: 'smooth' });
});

$('#listings-table').addEventListener('click', async (e) => {
  const editId = e.target.dataset.editListing;
  const deleteId = e.target.dataset.deleteListing;

  if (editId) {
    const listing = await (await fetch(`/api/listings/${editId}`)).json();
    const form = $('#listing-form');
    form.reset();
    for (const key of ['type', 'name', 'country', 'city', 'price_range',
                       'budget_tier', 'category', 'description', 'content']) {
      if (form[key]) form[key].value = listing[key] ?? '';
    }
    form.rating.value = listing.rating ?? '';
    editingListingId = listing.id;
    $('#listing-form-title').textContent = `Editing: ${listing.name}`;
    form.hidden = false;
    form.scrollIntoView({ behavior: 'smooth' });
  }

  if (deleteId) {
    if (!confirm('Delete this listing permanently?')) return;
    const res = await fetch(`/api/listings/${deleteId}`, { method: 'DELETE', headers: authHeaders() });
    if (res.ok) loadListings();
    else alert('Delete failed: ' + (await res.json()).error);
  }
});

$('#listing-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const msg = form.querySelector('.form-msg');
  msg.textContent = 'Saving…';

  const url = editingListingId ? `/api/listings/${editingListingId}` : '/api/listings';
  const method = editingListingId ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: authHeaders(),
    body: new FormData(form),
  });
  const result = await res.json();

  if (res.ok) {
    msg.textContent = '';
    form.hidden = true;
    form.reset();
    loadListings();
  } else {
    msg.textContent = 'Error: ' + result.error;
  }
});

// Cancel buttons on both forms
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => {
    $(`#${btn.dataset.close}-form`).hidden = true;
  });
});

// ============================================================
// TRENDING (curated top 5 per tab + country)
// ============================================================

// The working copy of the list being edited. Nothing is saved to the
// server until SAVE ORDER sends the whole ranked list in one request.
let trendPicks = [];
let trendDirty = false;

const TAB_TO_TYPE = { food: 'food', stays: 'stay', places: 'place', products: 'product' };

function trendKey() {
  return { tab: $('#trend-tab-select').value, country: $('#trend-country-select').value };
}

async function loadTrending() {
  const { tab, country } = trendKey();
  const res = await fetch(`/api/trending?country=${country}`);
  const data = await res.json();
  trendPicks = data[tab] || [];
  trendDirty = false;
  $('#trend-search').value = '';
  $('#trend-results').innerHTML = '';
  renderTrendPicks();
}

function renderTrendPicks() {
  $('#trend-save-btn').disabled = !trendDirty;
  $('#trend-msg').textContent = trendDirty ? 'Unsaved changes — hit SAVE ORDER to publish.' : '';

  if (trendPicks.length === 0) {
    $('#trend-current').innerHTML = trendKey().country === 'world'
      ? `<p class="posts-status">No hand-picked world list yet — the homepage's "All Countries"
         view currently auto-mixes each country's top picks. Add up to 5 listings below
         (from any country) to curate it yourself.</p>`
      : '<p class="posts-status">No picks yet — search below to add some.</p>';
    return;
  }

  $('#trend-current').innerHTML = trendPicks.map((item, i) => `
    <div class="trend-pick">
      <span class="rank">${i + 1}</span>
      <img src="${item.image_url}" alt="" onerror="this.style.visibility='hidden'">
      <span class="trend-pick-name">${item.name}<small>${item.city || item.country}</small></span>
      <span class="trend-pick-actions">
        <button data-move="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''}>&uarr;</button>
        <button data-move="${i}" data-dir="1" ${i === trendPicks.length - 1 ? 'disabled' : ''}>&darr;</button>
        <button data-remove="${i}" class="danger">&times;</button>
      </span>
    </div>`).join('');
}

$('#trend-current').addEventListener('click', (e) => {
  const moveIdx = e.target.dataset.move;
  const removeIdx = e.target.dataset.remove;

  if (moveIdx !== undefined) {
    const i = Number(moveIdx), j = i + Number(e.target.dataset.dir);
    [trendPicks[i], trendPicks[j]] = [trendPicks[j], trendPicks[i]];
    trendDirty = true;
    renderTrendPicks();
  }
  if (removeIdx !== undefined) {
    trendPicks.splice(Number(removeIdx), 1);
    trendDirty = true;
    renderTrendPicks();
  }
});

['trend-tab-select', 'trend-country-select'].forEach(id =>
  document.getElementById(id).addEventListener('change', () => {
    if (trendDirty && !confirm('Discard unsaved trending changes?')) return;
    loadTrending();
  }));

// Search within the currently selected type + country
let trendSearchTimer;
$('#trend-search').addEventListener('input', () => {
  clearTimeout(trendSearchTimer);
  trendSearchTimer = setTimeout(async () => {
    const q = $('#trend-search').value.trim();
    if (!q) { $('#trend-results').innerHTML = ''; return; }

    const { tab, country } = trendKey();
    const params = new URLSearchParams({ type: TAB_TO_TYPE[tab], q, limit: 10 });
    if (country !== 'world') params.set('country', country);  // world searches everywhere
    const listings = await (await fetch(`/api/listings?${params}`)).json();
    const pickedIds = new Set(trendPicks.map(p => p.id));
    const candidates = listings.filter(l => !pickedIds.has(l.id));

    $('#trend-results').innerHTML = candidates.length
      ? candidates.map(l => `
          <button class="trend-result" data-add="${l.id}" data-name="${l.name}">
            + ${l.name} <small>${l.city || l.country}</small>
          </button>`).join('')
      : '<p class="posts-status">No matches (already picked, or try the Listings tab to create it first).</p>';

    // stash the listing objects so we can add them without refetching
    $('#trend-results')._candidates = candidates;
  }, 300);
});

$('#trend-results').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-add]');
  if (!btn) return;
  if (trendPicks.length >= 5) {
    $('#trend-msg').textContent = 'Top 5 is full — remove one first.';
    return;
  }
  const listing = $('#trend-results')._candidates.find(l => l.id === Number(btn.dataset.add));
  trendPicks.push(listing);
  trendDirty = true;
  btn.remove();
  renderTrendPicks();
});

$('#trend-save-btn').addEventListener('click', async () => {
  const { tab, country } = trendKey();
  const res = await fetch('/api/trending', {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ tab, country, listing_ids: trendPicks.map(p => p.id) }),
  });
  const result = await res.json();
  if (res.ok) {
    trendDirty = false;
    renderTrendPicks();
    $('#trend-msg').textContent = 'Saved — the homepage sidebar is updated.';
  } else {
    $('#trend-msg').textContent = 'Error: ' + result.error;
  }
});

// ============================================================
// VIDEOS (homepage WATCH rail)
// ============================================================

let videosList = [];
let editingVideoId = null;

async function loadVideos() {
  videosList = await (await fetch('/api/videos')).json();
  renderVideos();
}

function renderVideos() {
  if (videosList.length === 0) {
    $('#videos-table').innerHTML =
      '<p class="posts-status">No videos yet — add a YouTube link above and it appears on the homepage.</p>';
    return;
  }

  $('#videos-table').innerHTML = `
    <table class="admin-table">
      <thead><tr><th></th><th></th><th>Title</th><th>Video</th><th></th></tr></thead>
      <tbody>
        ${videosList.map((v, i) => `
          <tr>
            <td class="row-actions" style="text-align:left">
              <button data-move-video="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''}>&uarr;</button>
              <button data-move-video="${i}" data-dir="1" ${i === videosList.length - 1 ? 'disabled' : ''}>&darr;</button>
            </td>
            <td><img src="${v.thumbnail}" alt="" style="width:90px;aspect-ratio:16/9;object-fit:cover;border-radius:6px;display:block"></td>
            <td>${v.title}${i === 0 ? ' <small style="color:#b0342c;font-weight:700">MAIN</small>' : ''}</td>
            <td><a href="${v.watch_url}" target="_blank">${v.youtube_id}</a></td>
            <td class="row-actions">
              <button data-edit-video="${v.id}">Edit</button>
              <button data-delete-video="${v.id}" class="danger">Delete</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

$('#new-video-btn').addEventListener('click', () => {
  editingVideoId = null;
  $('#video-form').reset();
  $('#video-form-title').textContent = 'Add Video';
  $('#video-form').hidden = false;
  $('#video-form').scrollIntoView({ behavior: 'smooth' });
});

$('#videos-table').addEventListener('click', async (e) => {
  const moveIdx = e.target.dataset.moveVideo;
  const editId = e.target.dataset.editVideo;
  const deleteId = e.target.dataset.deleteVideo;

  if (moveIdx !== undefined) {
    const i = Number(moveIdx), j = i + Number(e.target.dataset.dir);
    [videosList[i], videosList[j]] = [videosList[j], videosList[i]];
    renderVideos();
    // Order saves immediately (no separate save button needed here)
    await fetch('/api/videos/order', {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: videosList.map(v => v.id) }),
    });
  }

  if (editId) {
    const video = videosList.find(v => v.id === Number(editId));
    const form = $('#video-form');
    form.reset();
    form.title.value = video.title;
    form.url.value = video.watch_url;
    editingVideoId = video.id;
    $('#video-form-title').textContent = `Editing: ${video.title}`;
    form.hidden = false;
    form.scrollIntoView({ behavior: 'smooth' });
  }

  if (deleteId) {
    if (!confirm('Remove this video from the site?')) return;
    const res = await fetch(`/api/videos/${deleteId}`, { method: 'DELETE', headers: authHeaders() });
    if (res.ok) loadVideos();
    else alert('Delete failed: ' + (await res.json()).error);
  }
});

$('#video-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const msg = form.querySelector('.form-msg');
  msg.textContent = 'Saving…';

  const url = editingVideoId ? `/api/videos/${editingVideoId}` : '/api/videos';
  const res = await fetch(url, {
    method: editingVideoId ? 'PUT' : 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: form.title.value, url: form.url.value }),
  });
  const result = await res.json();

  if (res.ok) {
    msg.textContent = '';
    form.hidden = true;
    form.reset();
    loadVideos();
  } else {
    msg.textContent = 'Error: ' + result.error;
  }
});

// ============================================================
// EVENTS (the EW EVENTS page)
// ============================================================

let eventsList = [];
let editingEventId = null;

async function loadEvents() {
  eventsList = await (await fetch('/api/events')).json();
  const today = new Date().toISOString().slice(0, 10);

  if (eventsList.length === 0) {
    $('#events-table').innerHTML = '<p class="posts-status">No events yet.</p>';
    return;
  }

  $('#events-table').innerHTML = `
    <table class="admin-table">
      <thead><tr><th>Event</th><th>City</th><th>Date</th><th>Status</th><th></th></tr></thead>
      <tbody>
        ${eventsList.map(ev => {
          const past = (ev.end_date || ev.event_date) < today;
          return `
          <tr>
            <td>${ev.title}${ev.featured ? ' <small style="color:#b0342c;font-weight:700">FEATURED</small>' : ''}</td>
            <td>${ev.city}</td>
            <td>${ev.event_date}${ev.end_date ? ' → ' + ev.end_date : ''}</td>
            <td>${past ? '<span style="color:#999">past (hidden)</span>' : 'upcoming'}</td>
            <td class="row-actions">
              <button data-edit-event="${ev.id}">Edit</button>
              <button data-delete-event="${ev.id}" class="danger">Delete</button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

$('#new-event-btn').addEventListener('click', () => {
  editingEventId = null;
  $('#event-form').reset();
  $('#event-form-title').textContent = 'New Event';
  $('#event-form').hidden = false;
  $('#event-form').scrollIntoView({ behavior: 'smooth' });
});

$('#events-table').addEventListener('click', async (e) => {
  const editId = e.target.dataset.editEvent;
  const deleteId = e.target.dataset.deleteEvent;

  if (editId) {
    const ev = eventsList.find(x => x.id === Number(editId));
    const form = $('#event-form');
    form.reset();
    for (const key of ['title', 'city', 'country', 'event_date', 'end_date',
                       'time', 'venue', 'price', 'description', 'sponsor', 'link']) {
      if (form[key]) form[key].value = ev[key] ?? '';
    }
    form.featured.checked = Boolean(ev.featured);
    editingEventId = ev.id;
    $('#event-form-title').textContent = `Editing: ${ev.title}`;
    form.hidden = false;
    form.scrollIntoView({ behavior: 'smooth' });
  }

  if (deleteId) {
    if (!confirm('Delete this event permanently?')) return;
    const res = await fetch(`/api/events/${deleteId}`, { method: 'DELETE', headers: authHeaders() });
    if (res.ok) loadEvents();
    else alert('Delete failed: ' + (await res.json()).error);
  }
});

$('#event-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const msg = form.querySelector('.form-msg');
  msg.textContent = 'Saving…';

  const url = editingEventId ? `/api/events/${editingEventId}` : '/api/events';
  const res = await fetch(url, {
    method: editingEventId ? 'PUT' : 'POST',
    headers: authHeaders(),
    body: new FormData(form),
  });
  const result = await res.json();

  if (res.ok) {
    msg.textContent = '';
    form.hidden = true;
    form.reset();
    loadEvents();
  } else {
    msg.textContent = 'Error: ' + result.error;
  }
});

// ============================================================
// CAROUSELS (homepage slides)
// ============================================================

let slidesByCarousel = { top: [], bottom: [] };
let editingSlideId = null;

const currentCarousel = () => $('#slide-carousel-select').value;

async function loadSlides() {
  slidesByCarousel = await (await fetch('/api/slides')).json();
  renderSlides();
}

function renderSlides() {
  const slides = slidesByCarousel[currentCarousel()] || [];

  if (slides.length === 0) {
    $('#slides-table').innerHTML =
      '<p class="posts-status">No slides in this carousel — it\'s hidden on the homepage until you add one.</p>';
    return;
  }

  $('#slides-table').innerHTML = `
    <table class="admin-table">
      <thead><tr><th></th><th></th><th>Title</th><th>Label</th><th>Link</th><th></th></tr></thead>
      <tbody>
        ${slides.map((s, i) => `
          <tr>
            <td class="row-actions" style="text-align:left">
              <button data-move-slide="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''}>&uarr;</button>
              <button data-move-slide="${i}" data-dir="1" ${i === slides.length - 1 ? 'disabled' : ''}>&darr;</button>
            </td>
            <td><img src="${s.image_url}" alt="" style="width:90px;height:50px;object-fit:cover;border-radius:6px;display:block"></td>
            <td>${s.title}${i === 0 ? ' <small style="color:#b0342c;font-weight:700">FIRST</small>' : ''}</td>
            <td>${s.category || '—'}</td>
            <td>${s.link ? `<a href="${s.link}" target="_blank">link</a>` : '—'}</td>
            <td class="row-actions">
              <button data-edit-slide="${s.id}">Edit</button>
              <button data-delete-slide="${s.id}" class="danger">Delete</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

$('#slide-carousel-select').addEventListener('change', renderSlides);

$('#new-slide-btn').addEventListener('click', () => {
  editingSlideId = null;
  $('#slide-form').reset();
  $('#slide-form-title').textContent =
    `New Slide (${currentCarousel()} carousel)`;
  $('#slide-form').hidden = false;
  $('#slide-form').scrollIntoView({ behavior: 'smooth' });
});

$('#slides-table').addEventListener('click', async (e) => {
  const moveIdx = e.target.dataset.moveSlide;
  const editId = e.target.dataset.editSlide;
  const deleteId = e.target.dataset.deleteSlide;
  const slides = slidesByCarousel[currentCarousel()];

  if (moveIdx !== undefined) {
    const i = Number(moveIdx), j = i + Number(e.target.dataset.dir);
    [slides[i], slides[j]] = [slides[j], slides[i]];
    renderSlides();
    await fetch('/api/slides/order', {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: slides.map(s => s.id) }),
    });
  }

  if (editId) {
    const slide = slides.find(s => s.id === Number(editId));
    const form = $('#slide-form');
    form.reset();
    form.title.value = slide.title;
    form.category.value = slide.category || '';
    form.description.value = slide.description || '';
    form.link.value = slide.link || '';
    editingSlideId = slide.id;
    $('#slide-form-title').textContent = `Editing: ${slide.title}`;
    form.hidden = false;
    form.scrollIntoView({ behavior: 'smooth' });
  }

  if (deleteId) {
    if (!confirm('Delete this slide?')) return;
    const res = await fetch(`/api/slides/${deleteId}`, { method: 'DELETE', headers: authHeaders() });
    if (res.ok) loadSlides();
    else alert('Delete failed: ' + (await res.json()).error);
  }
});

$('#slide-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const msg = form.querySelector('.form-msg');
  msg.textContent = 'Saving…';

  const body = new FormData(form);
  body.set('carousel', currentCarousel());   // new slides join the selected carousel

  const url = editingSlideId ? `/api/slides/${editingSlideId}` : '/api/slides';
  const res = await fetch(url, {
    method: editingSlideId ? 'PUT' : 'POST',
    headers: authHeaders(),
    body,
  });
  const result = await res.json();

  if (res.ok) {
    msg.textContent = '';
    form.hidden = true;
    form.reset();
    loadSlides();
  } else {
    msg.textContent = 'Error: ' + result.error;
  }
});

// ============================================================
// USERS (read-only list of registered accounts)
// ============================================================

async function loadUsers() {
  const res = await fetch('/api/admin/users', { headers: authHeaders() });
  if (!res.ok) {
    $('#users-table').innerHTML = '<p class="posts-status">Could not load users.</p>';
    return;
  }
  const users = await res.json();

  if (users.length === 0) {
    $('#users-table').innerHTML =
      '<p class="posts-status">No registered users yet.</p>';
    return;
  }

  $('#users-table').innerHTML = `
    <p class="table-count">${users.length} user${users.length === 1 ? '' : 's'}</p>
    <table class="admin-table">
      <thead><tr><th>Username</th><th>Email</th><th>Type</th><th>Home city</th><th>Joined</th></tr></thead>
      <tbody>
        ${users.map(u => `
          <tr>
            <td>${u.username}</td>
            <td>${u.email}</td>
            <td>${u.user_type || ''}</td>
            <td>${u.home_city || '—'}</td>
            <td>${(u.created_at || '').slice(0, 10)}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}
