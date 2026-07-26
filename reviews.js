(function () {
  const params = new URLSearchParams(window.location.search);
  const listingId = params.get('id');
  if (!listingId) return;

  const mount = document.getElementById('reviews-mount');
  if (!mount) return;

  const TYPE_LABEL = { local: 'Local', expat: 'Expat', visitor: 'Visitor' };
  let currentUser = null;

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function starString(rating) {
    const n = Math.max(0, Math.min(5, Number(rating) || 0));
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  function initials(name) {
    return (name || '?').trim().charAt(0).toUpperCase();
  }

  function renderSummary(summary) {
    const rows = ['local', 'expat', 'visitor'].map(key => {
      const s = summary[key] || { average: null, count: 0 };
      const empty = !s.count;
      return `
        <div class="rv-summary-card rv-${key} ${empty ? 'rv-empty' : ''}">
          <div class="rv-label">${TYPE_LABEL[key]}</div>
          <div class="rv-score">${empty ? '—' : s.average}</div>
          <div class="rv-count">${s.count} review${s.count === 1 ? '' : 's'}</div>
        </div>`;
    }).join('');
    return `<div class="rv-summary">${rows}</div>`;
  }

  function renderForm(existing) {
    if (!currentUser) {
      return `
        <div class="rv-signin-prompt">
          <a href="login.html">Sign in</a> to leave a review of this place.
        </div>`;
    }
    const btnLabel = existing ? 'Update Review' : 'Post Review';
    const body = existing?.body ? escapeHtml(existing.body) : '';
    return `
      <form class="rv-form" id="rv-form">
        <div class="rv-stars" id="rv-stars">
          ${[1, 2, 3, 4, 5].map(n => `<span class="rv-star" data-value="${n}">★</span>`).join('')}
        </div>
        <textarea id="rv-body" placeholder="What should locals or expats know about this place?">${body}</textarea>
        <button type="submit" id="rv-submit" ${existing ? '' : 'disabled'}>${btnLabel}</button>
      </form>`;
  }

  function renderList(reviews) {
    if (reviews.length === 0) {
      return `<div class="rv-empty-state">No reviews yet — be the first to share a perspective.</div>`;
    }
    return `<div class="rv-list">${reviews.map(r => `
      <div class="rv-item">
        ${r.profile_image_url
          ? `<img class="rv-avatar" src="${escapeHtml(r.profile_image_url)}" alt="">`
          : `<div class="rv-avatar-fallback">${escapeHtml(initials(r.username))}</div>`}
        <div>
          <div class="rv-item-head">
            <span class="rv-item-name">${escapeHtml(r.username)}</span>
            <span class="rv-badge ${escapeHtml(r.user_type)}">${TYPE_LABEL[r.user_type] || escapeHtml(r.user_type)}</span>
          </div>
          <div class="rv-item-stars">${starString(r.rating)}</div>
          ${r.body ? `<div class="rv-item-body">${escapeHtml(r.body)}</div>` : ''}
          <div class="rv-item-date">${new Date((r.created_at || '').replace(' ', 'T') + 'Z').toLocaleDateString()}</div>
        </div>
      </div>`).join('')}</div>`;
  }

  function wireForm(existingRating) {
    const form = document.getElementById('rv-form');
    if (!form) return;

    let selected = existingRating || 0;
    const stars = form.querySelectorAll('.rv-star');
    const submitBtn = document.getElementById('rv-submit');

    const paint = () => {
      stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.value, 10) <= selected));
    };
    paint();

    stars.forEach(star => {
      star.addEventListener('click', () => {
        selected = parseInt(star.dataset.value, 10);
        paint();
        submitBtn.disabled = false;
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!selected) return;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Posting...';

      try {
        const res = await fetch(`/api/listings/${listingId}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rating: selected,
            body: document.getElementById('rv-body').value.trim(),
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(err.error || 'Could not post review');
          submitBtn.disabled = false;
          submitBtn.textContent = existingRating ? 'Update Review' : 'Post Review';
          return;
        }
        await load();
      } catch (err) {
        alert('Could not reach the server');
        submitBtn.disabled = false;
        submitBtn.textContent = existingRating ? 'Update Review' : 'Post Review';
      }
    });
  }

  async function load() {
    mount.innerHTML = `<div class="rv-wrap"><p style="color:#999;">Loading reviews…</p></div>`;

    const [meRes, reviewsRes] = await Promise.all([
      fetch('/api/auth/me'),
      fetch(`/api/listings/${listingId}/reviews`),
    ]);

    currentUser = meRes.ok ? await meRes.json() : null;
    const data = await reviewsRes.json();
    if (!reviewsRes.ok) {
      mount.innerHTML = `<div class="rv-wrap"><p class="rv-empty-state">${escapeHtml(data.error || 'Could not load reviews.')}</p></div>`;
      return;
    }

    const mine = currentUser
      ? (data.reviews || []).find(r => r.user_id === currentUser.id)
      : null;

    mount.innerHTML = `
      <div class="rv-wrap">
        <h2>Reviews</h2>
        ${renderSummary(data.summary)}
        ${renderForm(mine)}
        ${renderList(data.reviews || [])}
      </div>`;

    wireForm(mine?.rating || 0);
  }

  load();
})();
