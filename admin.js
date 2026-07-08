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
            <td>${l.name}</td>
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
