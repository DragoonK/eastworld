// ============================================================
// EW Events page: everything comes from /api/events, managed
// in the admin's EVENTS tab. The page shows:
//   - a hero for the event marked "featured"
//   - upcoming events (today or later), soonest first
//   - city filter buttons built from the events themselves
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('events-grid');
  const hero = document.getElementById('featured-event');
  const cityFilter = document.getElementById('city-filter');
  if (!grid || !hero || !cityFilter) return;

  const titleCase = (s) => (s || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  function formatDate(iso, endIso) {
    const opts = { month: 'short', day: 'numeric', year: 'numeric' };
    const start = new Date(iso + 'T00:00:00');
    if (!endIso) return start.toLocaleDateString('en-US', opts);
    const end = new Date(endIso + 'T00:00:00');
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()}\u2013${end.getDate()}, ${end.getFullYear()}`;
    }
    return `${start.toLocaleDateString('en-US', opts)} \u2013 ${end.toLocaleDateString('en-US', opts)}`;
  }

  let events;
  try {
    events = await (await fetch('/api/events')).json();
  } catch {
    grid.innerHTML = `
      <p style="grid-column: 1 / -1; text-align: center; color: #888; padding: 2rem 0;">
        Couldn't load events. Is the backend running?
      </p>`;
    return;
  }

  // Anything that hasn't fully ended yet counts as upcoming
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter(e => (e.end_date || e.event_date) >= today);

  // ---------------- featured hero ----------------

  const featured = upcoming.find(e => e.featured) || events.find(e => e.featured);
  if (featured) {
    const info = [
      { icon: 'far fa-calendar', text: formatDate(featured.event_date, featured.end_date) },
      { icon: 'fas fa-map-marker-alt', text: [featured.venue, titleCase(featured.country)].filter(Boolean).join(', ') },
      { icon: 'fas fa-ticket-alt', text: featured.price },
    ].filter(item => item.text);

    hero.innerHTML = `
      <div class="featured-event">
        <div class="featured-event-img">
          <img src="${featured.image_url}" alt="${featured.title}">
        </div>
        <div class="featured-event-content">
          <span class="featured-badge">FEATURED EVENT</span>
          <h2 class="featured-event-title">${featured.title}</h2>
          <p class="featured-event-description">${featured.description}</p>
          <div class="event-info">
            ${info.map(i => `
              <div class="event-info-item"><i class="${i.icon}"></i><span>${i.text}</span></div>`).join('')}
          </div>
          ${featured.link ? `<a href="${featured.link}" class="event-cta">RESERVE YOUR SPOT</a>` : ''}
        </div>
      </div>`;
    hero.hidden = false;
  }

  // ---------------- upcoming grid + city filter ----------------

  const listed = upcoming.filter(e => e !== featured);

  function cardHTML(event) {
    const info = [
      { icon: 'far fa-clock', text: event.time },
      { icon: 'fas fa-map-marker-alt', text: event.venue },
      { icon: 'fas fa-ticket-alt', text: event.price },
    ].filter(item => item.text);

    return `
      <div class="event-card" data-city="${event.city}">
        <div class="event-img">
          <img src="${event.image_url}" alt="${event.title}">
          <span class="event-city">${titleCase(event.city)}</span>
          <span class="event-date">${formatDate(event.event_date, event.end_date)}</span>
        </div>
        <div class="event-content">
          <h3 class="event-title">${event.title}</h3>
          <p class="event-description">${event.description}</p>
          <div class="event-info">
            ${info.map(i => `
              <div class="event-info-item"><i class="${i.icon}"></i><span>${i.text}</span></div>`).join('')}
          </div>
          ${event.sponsor ? `<div class="event-sponsor">${event.sponsor}</div>` : ''}
          ${event.link ? `<a href="${event.link}" class="event-cta">REGISTER NOW</a>` : ''}
        </div>
      </div>`;
  }

  function render(city) {
    const visible = city === 'all' ? listed : listed.filter(e => e.city === city);
    grid.innerHTML = visible.length
      ? visible.map(cardHTML).join('')
      : `<p style="grid-column: 1 / -1; text-align: center; color: #888; padding: 2rem 0;">
           No upcoming events here yet — check back soon.
         </p>`;
  }

  const cities = [...new Set(listed.map(e => e.city))];
  cityFilter.innerHTML =
    `<button class="city-btn active" data-city="all">All Cities</button>` +
    cities.map(c => `<button class="city-btn" data-city="${c}">${titleCase(c)}</button>`).join('');

  cityFilter.querySelectorAll('.city-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      cityFilter.querySelectorAll('.city-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render(btn.dataset.city);
    });
  });

  render('all');
});
