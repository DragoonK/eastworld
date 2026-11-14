// ============================================================
// Bespoke tour builder: a stepped wizard (city -> themes ->
// stops -> details) with a live itinerary preview, Mapbox pins
// and a rolling price estimate. Submitting creates a booking
// request with a bespoke_payload — the same admin pipeline as
// packaged-tour requests.
// ============================================================

const state = {
  step: 0,
  city: null,            // phnom-penh | siem-reap | both
  themes: new Set(),
  stops: [],             // ordered listing objects
  listings: [],
};

const STEP_COUNT = 4;

// Themes loosely shape which listing types we suggest first;
// everything is always shown, suggestions just sort to the top.
const THEME_TYPE_HINTS = {
  food: ['food'],
  temples: ['place'],
  history: ['place'],
  photo: ['place'],
  nightlife: ['food', 'place'],
};

const titleCase = (s) => (s || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// ---------------- steps ----------------

function showStep(n) {
  state.step = n;
  document.querySelectorAll('.builder-step').forEach(s =>
    s.classList.toggle('active', Number(s.dataset.step) === n));
  document.querySelectorAll('.step-pill').forEach(p => {
    const i = Number(p.dataset.step);
    p.classList.toggle('active', i === n);
    p.classList.toggle('done', i < n);
  });
  document.getElementById('builder-back').hidden = n === 0;
  document.getElementById('builder-next').textContent =
    n === STEP_COUNT - 1 ? 'Send my tour request' : 'Next →';

  if (n === 2) renderStopPicker();
}

function canAdvance() {
  if (state.step === 0 && !state.city) return 'Pick a city first.';
  if (state.step === 2 && state.stops.length < 2) return 'Add at least 2 stops.';
  if (state.step === 3) {
    if (!document.getElementById('bf-name').value.trim()) return 'We need your name.';
    if (!document.getElementById('bf-email').value.includes('@')) return 'We need a valid email.';
  }
  return null;
}

document.getElementById('builder-next').addEventListener('click', () => {
  const problem = canAdvance();
  if (problem) { flashError(problem); return; }
  if (state.step === STEP_COUNT - 1) { submitBuild(); return; }
  showStep(state.step + 1);
});

document.getElementById('builder-back').addEventListener('click', () => {
  if (state.step > 0) showStep(state.step - 1);
});

function flashError(msg) {
  const btn = document.getElementById('builder-next');
  const original = btn.textContent;
  btn.textContent = msg;
  btn.style.background = '#c0392b';
  setTimeout(() => {
    btn.textContent = original;
    btn.style.background = '';
  }, 1600);
}

// ---------------- city + theme choices ----------------

document.querySelectorAll('#city-choices .choice-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('#city-choices .choice-card')
      .forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    state.city = card.dataset.value;
    state.stops = [];          // changing city invalidates picked stops
    renderItinerary();
    setTimeout(() => showStep(1), 350);   // auto-advance feels alive
  });
});

document.querySelectorAll('#theme-choices .choice-card').forEach(card => {
  card.addEventListener('click', () => {
    card.classList.toggle('selected');
    const value = card.dataset.value;
    if (state.themes.has(value)) state.themes.delete(value);
    else state.themes.add(value);
  });
});

// ---------------- stop picker ----------------

async function loadListings() {
  const res = await fetch('/api/listings?country=cambodia&limit=500');
  state.listings = await res.json();
}

function visibleListings() {
  const cities = state.city === 'both'
    ? ['phnom-penh', 'siem-reap'] : [state.city];
  const pool = state.listings.filter(l =>
    (l.type === 'food' || l.type === 'place') && cities.includes(l.city));

  if (state.themes.size === 0) return pool;
  const hinted = new Set();
  state.themes.forEach(t => (THEME_TYPE_HINTS[t] || []).forEach(ty => hinted.add(ty)));
  return [...pool].sort((a, b) =>
    (hinted.has(b.type) ? 1 : 0) - (hinted.has(a.type) ? 1 : 0));
}

function renderStopPicker() {
  const picker = document.getElementById('stop-picker');
  const items = visibleListings();

  picker.innerHTML = items.map(l => `
    <div class="stop-card ${state.stops.some(s => s.id === l.id) ? 'selected' : ''}"
         data-id="${l.id}">
      ${l.image_url ? `<img src="${l.image_url}" alt="${l.name}" loading="lazy"
            onerror="this.style.display='none'">` : ''}
      <div class="stop-card-body">
        <strong>${l.name}</strong>
        <span>${l.type} · ${titleCase(l.city)}</span>
      </div>
      <span class="stop-add">${state.stops.some(s => s.id === l.id) ? '✓ In your tour' : '+ Add'}</span>
    </div>`).join('');

  picker.querySelectorAll('.stop-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = Number(card.dataset.id);
      const existing = state.stops.findIndex(s => s.id === id);
      if (existing >= 0) {
        state.stops.splice(existing, 1);
      } else {
        state.stops.push(state.listings.find(l => l.id === id));
      }
      renderItinerary();
      // update just this card's state rather than re-rendering the grid
      card.classList.toggle('selected', existing < 0);
      card.querySelector('.stop-add').textContent =
        existing < 0 ? '✓ In your tour' : '+ Add';
    });
  });
}

// ---------------- live preview: itinerary + estimate + map ----------------

function estimateDays() {
  if (state.city === 'both') return Math.max(2, Math.ceil(state.stops.length / 4));
  return state.stops.length > 4 ? 2 : 1;
}

function estimatePrice() {
  if (state.stops.length === 0) return 0;
  return 40 * estimateDays() + 10 * state.stops.length;
}

function renderItinerary() {
  const list = document.getElementById('itin-list');

  if (state.stops.length === 0) {
    list.innerHTML = '<p class="itin-empty">Pick stops and watch your tour build itself here.</p>';
  } else {
    list.innerHTML = state.stops.map((s, i) => `
      <div class="itin-item">
        <span class="num">${i + 1}</span>
        <div>
          <strong>${s.name}</strong><br>
          <small style="color:#999">${titleCase(s.city)}</small>
        </div>
        <button class="rm" data-id="${s.id}" title="Remove">&times;</button>
      </div>`).join('');
    list.querySelectorAll('.rm').forEach(btn => {
      btn.addEventListener('click', () => {
        state.stops = state.stops.filter(s => s.id !== Number(btn.dataset.id));
        renderItinerary();
        renderStopPicker();
      });
    });
  }

  const days = state.stops.length ? estimateDays() : null;
  document.getElementById('est-price').textContent = `$${estimatePrice()}`;
  document.getElementById('est-days').textContent =
    days ? `${days} day${days > 1 ? 's' : ''}` : '—';

  updateMap();
}

// Map: one numbered marker per stop plus a route line through
// them, fitted to bounds. No token -> the panel just stays grey.
let map = null;
let markers = [];

function initMap() {
  const token = window.EASTWORLD_MAPBOX_TOKEN;
  if (!token || !window.mapboxgl) return;
  mapboxgl.accessToken = token;
  map = new mapboxgl.Map({
    container: 'builder-map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [104.92, 12.55],   // Cambodia
    zoom: 6.4,
  });
  map.on('load', () => updateMap());
}

function updateMap() {
  if (!map || !map.loaded()) return;

  markers.forEach(m => m.remove());
  markers = [];

  const points = state.stops.filter(s => s.lat && s.lng);
  points.forEach((s, i) => {
    const el = document.createElement('div');
    el.textContent = i + 1;
    el.style.cssText = 'width:24px;height:24px;border-radius:50%;background:#ff4d4d;' +
      'color:#fff;font-weight:700;font-size:12px;display:flex;align-items:center;' +
      'justify-content:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)';
    markers.push(new mapboxgl.Marker(el).setLngLat([s.lng, s.lat]).addTo(map));
  });

  if (map.getSource('route')) {
    map.getSource('route').setData({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: points.map(s => [s.lng, s.lat]) },
    });
  } else if (points.length > 1) {
    map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: points.map(s => [s.lng, s.lat]) },
      },
    });
    map.addLayer({
      id: 'route', type: 'line', source: 'route',
      paint: { 'line-color': '#ff4d4d', 'line-width': 3, 'line-dasharray': [2, 2] },
    });
  }

  if (points.length > 0) {
    const bounds = points.reduce(
      (b, s) => b.extend([s.lng, s.lat]),
      new mapboxgl.LngLatBounds([points[0].lng, points[0].lat], [points[0].lng, points[0].lat])
    );
    map.fitBounds(bounds, { padding: 45, maxZoom: 12, duration: 800 });
  }
}

// ---------------- submit ----------------

async function submitBuild() {
  const btn = document.getElementById('builder-next');
  btn.disabled = true;

  const payload = {
    type: 'bespoke-tour',
    city: state.city,
    themes: [...state.themes],
    pace: document.getElementById('bf-pace').value,
    days: estimateDays(),
    estimate_usd: estimatePrice(),
    stops: state.stops.map((s, i) => ({ position: i + 1, listing_id: s.id, name: s.name })),
  };

  try {
    const res = await fetch('/api/booking-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tour_id: null,
        name: document.getElementById('bf-name').value,
        email: document.getElementById('bf-email').value,
        dates: document.getElementById('bf-dates').value,
        party_size: document.getElementById('bf-party').value,
        message: document.getElementById('bf-msg').value,
        bespoke_payload: payload,
      }),
    });
    if (!res.ok) throw new Error(res.status);
    document.getElementById('builder-main').hidden = true;
    document.getElementById('builder-success').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch {
    flashError('Failed to send — try again.');
  } finally {
    btn.disabled = false;
  }
}

// ---------------- boot ----------------

(async () => {
  try {
    await loadListings();
  } catch {
    document.getElementById('stop-picker').innerHTML = `
      <p class="posts-status">Couldn't load places. Is the backend running?<br>
      Start it with: <code>cd backend &amp;&amp; python3 app.py</code></p>`;
  }
  initMap();
})();
