// ============================================================
// Eastworld interactive tourist map (homepage only).
//
// Mapbox GL JS with the monochrome "light" style. Pins are the
// food / stay / place listings from the database (lat/lng filled
// by backend/geocode_listings.py). The country toggle calls
// EastworldMap.setCountry() to fly to a country and re-scope pins.
// ============================================================

(function () {
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  const fallback = document.getElementById('map-fallback');
  const legend = document.getElementById('map-legend');

  // City-only focus: each country opens on its main city and shows
  // just that city's pins. WORLD keeps the regional overview.
  const COUNTRY_VIEWS = {
    world:     { center: [112, 16], zoom: 2.3 },
    cambodia:  { city: 'phnom-penh', center: [104.9282, 11.5564], zoom: 12.3 },
    vietnam:   { city: 'ho-chi-minh', center: [106.6297, 10.8231], zoom: 11.6 },
    japan:     { city: 'osaka', center: [135.5023, 34.6937], zoom: 11.8 },
    australia: { city: 'melbourne', center: [144.9631, -37.8136], zoom: 11.6 },
    china:     { city: 'guangzhou', center: [113.2644, 23.1291], zoom: 11.4 },
  };

  // Red = places, blue = food, green = stays
  const MARKER_COLORS = { food: '#2563eb', stay: '#16a34a', place: '#e3342f' };
  const TYPE_LABELS = { food: 'Food', stay: 'Stay', place: 'Place' };

  let map = null;
  let markers = [];
  let country = 'world';
  const listingsCache = {};

  async function listingsFor(c) {
    const view = COUNTRY_VIEWS[c] || COUNTRY_VIEWS.world;
    const key = `${c}:${view.city || 'all'}`;
    if (!listingsCache[key]) {
      let url = '/api/listings?limit=500';
      if (c !== 'world') url += `&country=${c}&city=${view.city}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      // Only mappable types with real coordinates become pins
      listingsCache[key] = (await res.json()).filter(
        l => ['food', 'stay', 'place'].includes(l.type) && l.lat != null && l.lng != null
      );
    }
    return listingsCache[key];
  }

  function popupHTML(l) {
    const href = l.link || `listing.html?id=${l.id}`;
    return `<div class="map-popup">
      ${l.image_url ? `<img src="${l.image_url}" alt="${l.name}">` : ''}
      <span class="map-popup-type">${TYPE_LABELS[l.type] || l.type}</span>
      <strong>${l.name}</strong>
      <small>${[l.city, l.country].filter(Boolean).join(', ')}</small><br>
      <a href="${href}">VIEW ↗</a>
    </div>`;
  }

  function clearMarkers() {
    markers.forEach(m => m.remove());
    markers = [];
  }

  async function setCountry(c) {
    country = c;
    if (!map) return;

    const view = COUNTRY_VIEWS[c] || COUNTRY_VIEWS.world;
    map.flyTo({ center: view.center, zoom: view.zoom, duration: 1400 });

    let listings;
    try {
      listings = await listingsFor(c);
    } catch {
      return;
    }
    clearMarkers();
    listings.forEach(l => {
      const marker = new mapboxgl.Marker({ color: MARKER_COLORS[l.type] || '#0a0a0a' })
        .setLngLat([l.lng, l.lat])
        .setPopup(new mapboxgl.Popup({ offset: 28, maxWidth: '260px' }).setHTML(popupHTML(l)))
        .addTo(map);
      markers.push(marker);
    });
  }

  function init() {
    if (!window.EASTWORLD_MAPBOX_TOKEN || typeof mapboxgl === 'undefined') {
      if (fallback) fallback.hidden = false;
      return;
    }
    mapboxgl.accessToken = window.EASTWORLD_MAPBOX_TOKEN;
    try {
      map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v11',
        center: COUNTRY_VIEWS.world.center,
        zoom: COUNTRY_VIEWS.world.zoom,
      });
    } catch {
      // No WebGL (old device / restricted browser): show the note instead
      if (fallback) fallback.hidden = false;
      return;
    }
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.scrollZoom.disable();   // don't trap the page scroll
    if (legend) legend.hidden = false;
    // Markers don't depend on the style being loaded — add them now
    setCountry(country);
  }

  window.EastworldMap = { setCountry };
  init();
})();
