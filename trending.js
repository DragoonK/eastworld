// ============================================================
// Trending sidebar: top five per category, across all countries.
// The picks come from the backend (/api/trending), curated in the
// admin dashboard's Trending tab. The response is cached so
// switching tabs is instant.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('trending-list');
  const tabs = document.querySelectorAll('.trending-tab');
  if (!list || tabs.length === 0) return;

  let activeTab = 'food';
  let cache = null;   // {food: [...], stays: [...], ...}

  // listings store places lowercase ("siem reap") -> "Siem Reap"
  const titleCase = (s) => s.replace(/\b\w/g, c => c.toUpperCase());

  async function render() {
    let data;
    try {
      if (!cache) {
        const res = await fetch('/api/trending?country=all');
        cache = await res.json();
      }
      data = cache;
    } catch {
      list.innerHTML = '<p class="posts-status">Could not load trending.</p>';
      return;
    }

    const items = data[activeTab] || [];
    if (items.length === 0) {
      list.innerHTML = '<p class="posts-status">No picks yet.</p>';
      return;
    }
    list.innerHTML = items.map((item, i) => `
      <a class="trending-item" href="${item.link || `listing.html?id=${item.id}`}">
        <span class="rank">${i + 1}</span>
        <img src="${item.image_url}" alt="${item.name}" loading="lazy"
             onerror="this.style.visibility='hidden'">
        <span class="trending-text">
          <span class="name">${item.name}</span>
          <span class="location">${titleCase(item.city || item.country)}${item.price_range ? ` · ${item.price_range}` : ''}</span>
          ${item.description ? `<span class="desc">${item.description}</span>` : ''}
        </span>
        ${item.rating ? `<span class="score">★ ${item.rating}</span>` : ''}
      </a>
    `).join('');
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.dataset.tab;
      render();
    });
  });

  render();
});
