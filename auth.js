const COUNTRY_LABELS = {
  japan: 'Japan',
  china: 'China',
  australia: 'Australia',
  cambodia: 'Cambodia',
  vietnam: 'Vietnam',
  usa: 'United States',
  uk: 'United Kingdom',
  singapore: 'Singapore',
  korea: 'South Korea',
  thailand: 'Thailand',
  other: 'Other',
};

const CITY_LABELS = {
  osaka: 'Osaka',
  tokyo: 'Tokyo',
  melbourne: 'Melbourne',
  guangzhou: 'Guangzhou',
  shanghai: 'Shanghai',
  'phnom-penh': 'Phnom Penh',
};

function initialsFrom(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'EW';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function titleCaseSlug(slug) {
  if (!slug) return '';
  if (CITY_LABELS[slug]) return CITY_LABELS[slug];
  if (COUNTRY_LABELS[slug]) return COUNTRY_LABELS[slug];
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatMemberSince(iso) {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return (iso || '').slice(0, 10) || '—';
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function showError(message) {
  const errorElement = document.querySelector('.auth-error');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => { errorElement.style.display = 'none'; }, 5000);
  } else {
    showMessage(message, 'error');
  }
}

function showMessage(message, type = 'error') {
  let messageEl = document.getElementById('auth-message');
  if (!messageEl) {
    messageEl = document.createElement('div');
    messageEl.id = 'auth-message';
    document.body.appendChild(messageEl);
  }
  messageEl.className = `auth-message ${type}`;
  messageEl.textContent = message;
  messageEl.style.display = 'block';
  setTimeout(() => { messageEl.style.display = 'none'; }, 5000);
}

// Toggle password visibility
document.querySelectorAll('.toggle-password').forEach((toggle) => {
  toggle.addEventListener('click', function () {
    const input = this.parentElement.querySelector('input');
    if (!input) return;
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
  });
});

// ---------- Live ID card (register + shared fill helper) ----------

function fillIdCard(user, opts = {}) {
  const nameEl = document.getElementById('card-name');
  const placeEl = document.getElementById('card-place');
  const badgeEl = document.getElementById('card-badge');
  const initialsEl = document.getElementById('card-initials');
  const photoEl = document.getElementById('card-photo');
  const sinceEl = document.getElementById('card-since');
  const reviewsEl = document.getElementById('card-reviews');
  const card = document.getElementById('id-card');
  if (!nameEl || !card) return;

  const username = user.username || 'Your name';
  nameEl.textContent = username;

  const country = titleCaseSlug(user.country);
  const city = titleCaseSlug(user.home_city);
  if (country && city) placeEl.textContent = `${country} · ${city}`;
  else if (country) placeEl.textContent = country;
  else if (city) placeEl.textContent = city;
  else placeEl.textContent = opts.emptyPlace || 'Pick a country to begin';

  const type = (user.user_type || 'visitor').toLowerCase();
  if (badgeEl) {
    badgeEl.textContent = type;
    badgeEl.dataset.type = type;
  }

  const initials = initialsFrom(username);
  if (initialsEl) initialsEl.textContent = initials;

  if (photoEl) {
    const url = user.profile_image_url || user._previewUrl || '';
    if (url) {
      photoEl.src = url;
      photoEl.classList.add('is-ready');
      photoEl.alt = username;
      if (initialsEl) initialsEl.style.display = 'none';
    } else {
      photoEl.removeAttribute('src');
      photoEl.classList.remove('is-ready');
      photoEl.alt = '';
      if (initialsEl) initialsEl.style.display = '';
    }
  }

  if (sinceEl) sinceEl.textContent = formatMemberSince(user.created_at);
  if (reviewsEl) reviewsEl.textContent = String(user.review_count ?? 0);

  card.hidden = false;
  card.classList.add('is-live');
  clearTimeout(fillIdCard._tiltTimer);
  fillIdCard._tiltTimer = setTimeout(() => card.classList.remove('is-live'), 420);
}

function setupRegisterPreview() {
  const form = document.getElementById('register-form');
  if (!form) return;

  const username = document.getElementById('username');
  const country = document.getElementById('country');
  const homeCity = document.getElementById('home-city');
  const homeCityOther = document.getElementById('home-city-other');
  const homeCityOtherWrap = document.getElementById('home-city-other-wrap');
  const userType = document.getElementById('user-type');
  const imageInput = document.getElementById('profile-image');
  const drop = document.getElementById('photo-drop');
  const dropPreview = document.getElementById('drop-preview');
  const dropInitials = document.getElementById('drop-initials');

  let previewUrl = '';

  const sync = () => {
    let city = homeCity?.value || '';
    if (city === 'other') city = (homeCityOther?.value || '').trim();
    fillIdCard({
      username: username?.value.trim() || 'Your name',
      country: country?.value || '',
      home_city: city,
      user_type: userType?.value || 'visitor',
      _previewUrl: previewUrl,
      created_at: '',
      review_count: 0,
    });
    if (dropInitials) dropInitials.textContent = initialsFrom(username?.value);
  };

  [username, country, homeCity, homeCityOther, userType].forEach((el) => {
    el?.addEventListener('input', sync);
    el?.addEventListener('change', sync);
  });

  homeCity?.addEventListener('change', () => {
    const open = homeCity.value === 'other';
    homeCityOtherWrap?.classList.toggle('is-open', open);
    if (!open && homeCityOther) homeCityOther.value = '';
    sync();
  });

  const setPreviewFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    if (dropPreview) {
      dropPreview.src = previewUrl;
      dropPreview.classList.add('is-ready');
    }
    if (dropInitials) dropInitials.style.display = 'none';
    sync();
  };

  imageInput?.addEventListener('change', () => {
    setPreviewFile(imageInput.files?.[0]);
  });

  ['dragenter', 'dragover'].forEach((evt) => {
    drop?.addEventListener(evt, (e) => {
      e.preventDefault();
      drop.classList.add('is-dragover');
    });
  });
  ['dragleave', 'drop'].forEach((evt) => {
    drop?.addEventListener(evt, (e) => {
      e.preventDefault();
      drop.classList.remove('is-dragover');
    });
  });
  drop?.addEventListener('drop', (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (!file || !imageInput) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    imageInput.files = dt.files;
    setPreviewFile(file);
  });

  sync();
}

setupRegisterPreview();

// ---------- Login ----------

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const button = e.target.querySelector('button');
  const originalHtml = button.innerHTML;

  button.disabled = true;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const result = await res.json().catch(() => ({}));

    if (!res.ok) {
      showError(result.error || 'Login failed');
      button.disabled = false;
      button.innerHTML = originalHtml;
      return;
    }
    window.location.href = 'profile.html';
  } catch (err) {
    showError('Could not reach the server');
    button.disabled = false;
    button.innerHTML = originalHtml;
  }
});

// ---------- Register (multipart) ----------

document.getElementById('register-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password')?.value;
  const userType = document.getElementById('user-type')?.value;
  const country = document.getElementById('country')?.value;
  const button = form.querySelector('button[type="submit"]');
  const originalHtml = button.innerHTML;

  if (password.length < 6) {
    showError('Password must be at least 6 characters');
    return;
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    showError('Passwords do not match');
    return;
  }
  if (!country) {
    showError('Please select your country of origin');
    return;
  }
  if (!userType) {
    showError('Please select whether you are a local, expat or visitor');
    return;
  }

  const homeCity = document.getElementById('home-city')?.value;
  if (homeCity === 'other' && !(document.getElementById('home-city-other')?.value || '').trim()) {
    showError('Please enter your city');
    return;
  }

  button.disabled = true;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating pass...';

  try {
    const body = new FormData(form);
    const res = await fetch('/api/auth/register', { method: 'POST', body });
    const result = await res.json().catch(() => ({}));

    if (!res.ok) {
      showError(result.error || 'Registration failed');
      button.disabled = false;
      button.innerHTML = originalHtml;
      return;
    }
    window.location.href = 'profile.html';
  } catch (err) {
    showError('Could not reach the server');
    button.disabled = false;
    button.innerHTML = originalHtml;
  }
});

// ---------- Profile page ----------

async function loadProfilePage() {
  const status = document.getElementById('profile-status');
  const actions = document.getElementById('profile-actions');
  const logoutBtn = document.getElementById('profile-logout');
  if (!status || !document.body.classList.contains('auth-page')) return;
  if (!document.querySelector('.auth-shell--profile')) return;

  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) {
      status.textContent = 'Sign in to see your pass.';
      setTimeout(() => { window.location.href = 'login.html'; }, 900);
      return;
    }
    const user = await res.json();
    status.hidden = true;
    fillIdCard(user, { emptyPlace: 'Eastworld member' });
    if (actions) actions.hidden = false;
  } catch (err) {
    status.textContent = 'Could not load your pass.';
  }

  logoutBtn?.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = 'index.html';
  });
}

loadProfilePage();

// ---------- Nav auth state ----------

async function checkAuthState() {
  const loginLink = document.querySelector('a[href="login.html"], a[href$="/login.html"]');
  const registerLink = document.querySelector('a[href="register.html"], a[href$="/register.html"]');

  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return;

    const user = await res.json();

    if (loginLink) {
      loginLink.textContent = 'LOG OUT';
      loginLink.href = '#';
      loginLink.addEventListener('click', async (e) => {
        e.preventDefault();
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.reload();
      });
    }
    if (registerLink) {
      registerLink.textContent = user.username.toUpperCase();
      registerLink.href = 'profile.html';
    }
  } catch (err) {
    // silent fail — links stay as LOGIN/REGISTER
  } finally {
    document.querySelectorAll('.auth-link').forEach((el) => {
      el.style.visibility = 'visible';
    });
  }
}

checkAuthState();
