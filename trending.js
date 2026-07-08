// ============================================================
// Trending sidebar: top five per category, filterable by country.
// The picks now come from the backend (/api/trending), where they
// are curated from the admin dashboard's Trending tab. Responses
// are cached per country so switching tabs is instant.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('trending-list');
  const countrySelect = document.getElementById('trending-country');
  const tabs = document.querySelectorAll('.trending-tab');
  if (!list || !countrySelect || tabs.length === 0) return;

  let activeTab = 'food';
  const cache = {};   // country -> {food: [...], stays: [...], ...}

  // listings store places lowercase ("siem reap") -> "Siem Reap"
  const titleCase = (s) => s.replace(/\b\w/g, c => c.toUpperCase());

  async function dataFor(country) {
    if (!cache[country]) {
      const res = await fetch(`/api/trending?country=${country}`);
      cache[country] = await res.json();
    }
    return cache[country];
  }

  async function render() {
    const country = countrySelect.value;
    let data;
    try {
      data = await dataFor(country);
    } catch {
      list.innerHTML = '<p class="posts-status">Could not load trending.</p>';
      return;
    }

    const items = data[activeTab] || [];
    list.innerHTML = items.map((item, i) => `
      <a class="trending-item" href="${item.link || '#'}">
        <span class="rank">${i + 1}</span>
        <img src="${item.image_url}" alt="${item.name}" loading="lazy"
             onerror="this.style.visibility='hidden'">
        <span class="trending-text">
          <span class="name">${item.name}</span>
          <span class="location">${titleCase(item.city || item.country)}</span>
        </span>
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

  countrySelect.addEventListener('change', render);

  render();
});
