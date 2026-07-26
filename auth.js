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

  // Role drives card tier; elevated roles own the badge slot.
  // Members keep Local / Expat / Visitor in a muted badge.
  const role = (user.role || 'member').toLowerCase();
  const type = (user.user_type || 'visitor').toLowerCase();
  card.dataset.role = ['admin', 'creator', 'member'].includes(role) ? role : 'member';

  if (badgeEl) {
    delete badgeEl.dataset.type;
    delete badgeEl.dataset.role;
    if (role === 'admin') {
      badgeEl.textContent = 'Founder';
      badgeEl.dataset.role = 'admin';
    } else if (role === 'creator') {
      badgeEl.textContent = 'Creator';
      badgeEl.dataset.role = 'creator';
    } else {
      badgeEl.textContent = type;
      badgeEl.dataset.type = type;
    }
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

function populateProfileForm(user) {
  const country = document.getElementById('country');
  const homeCity = document.getElementById('home-city');
  const homeCityOther = document.getElementById('home-city-other');
  const homeCityOtherWrap = document.getElementById('home-city-other-wrap');
  const userType = document.getElementById('user-type');
  const bio = document.getElementById('bio');
  const dropPreview = document.getElementById('drop-preview');
  const dropInitials = document.getElementById('drop-initials');

  if (country) country.value = user.country || '';
  if (userType) userType.value = user.user_type || 'visitor';
  if (bio) bio.value = user.bio || '';

  const knownCities = new Set(['osaka', 'tokyo', 'melbourne', 'guangzhou', 'shanghai', 'phnom-penh']);
  const city = user.home_city || '';
  if (homeCity) {
    if (!city) {
      homeCity.value = '';
      homeCityOtherWrap?.classList.remove('is-open');
    } else if (knownCities.has(city)) {
      homeCity.value = city;
      homeCityOtherWrap?.classList.remove('is-open');
    } else {
      homeCity.value = 'other';
      homeCityOtherWrap?.classList.add('is-open');
      if (homeCityOther) homeCityOther.value = titleCaseSlug(city);
    }
  }

  if (dropInitials) dropInitials.textContent = initialsFrom(user.username);
  if (dropPreview) {
    if (user.profile_image_url) {
      dropPreview.src = user.profile_image_url;
      dropPreview.classList.add('is-ready');
      if (dropInitials) dropInitials.style.display = 'none';
    } else {
      dropPreview.removeAttribute('src');
      dropPreview.classList.remove('is-ready');
      if (dropInitials) dropInitials.style.display = '';
    }
  }
}

function setupProfileEdit(user) {
  const form = document.getElementById('profile-edit-form');
  const toggle = document.getElementById('profile-edit-toggle');
  const cancel = document.getElementById('profile-edit-cancel');
  const homeCity = document.getElementById('home-city');
  const homeCityOtherWrap = document.getElementById('home-city-other-wrap');
  const imageInput = document.getElementById('profile-image');
  const drop = document.getElementById('photo-drop');
  const dropPreview = document.getElementById('drop-preview');
  const dropInitials = document.getElementById('drop-initials');
  if (!form || !toggle) return;

  let currentUser = user;
  let previewUrl = '';

  const openForm = () => {
    populateProfileForm(currentUser);
    form.hidden = false;
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const closeForm = () => {
    form.hidden = true;
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = '';
    }
  };

  toggle.addEventListener('click', openForm);
  cancel?.addEventListener('click', closeForm);

  homeCity?.addEventListener('change', () => {
    homeCityOtherWrap?.classList.toggle('is-open', homeCity.value === 'other');
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
    fillIdCard({ ...currentUser, _previewUrl: previewUrl }, { emptyPlace: 'Eastworld member' });
  };

  imageInput?.addEventListener('change', () => setPreviewFile(imageInput.files?.[0]));
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

  ['country', 'home-city', 'home-city-other', 'user-type', 'bio'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', () => {
      let city = document.getElementById('home-city')?.value || '';
      if (city === 'other') city = (document.getElementById('home-city-other')?.value || '').trim();
      fillIdCard({
        ...currentUser,
        country: document.getElementById('country')?.value || currentUser.country,
        home_city: city,
        user_type: document.getElementById('user-type')?.value || currentUser.user_type,
        bio: document.getElementById('bio')?.value || '',
        _previewUrl: previewUrl || currentUser.profile_image_url,
      }, { emptyPlace: 'Eastworld member' });
    });
    document.getElementById(id)?.addEventListener('change', () => {
      document.getElementById(id)?.dispatchEvent(new Event('input'));
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const originalHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
      const body = new FormData(form);
      const res = await fetch('/api/auth/profile', { method: 'POST', body });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError(result.error || 'Could not update profile');
        button.disabled = false;
        button.innerHTML = originalHtml;
        return;
      }
      currentUser = result.user;
      fillIdCard(currentUser, { emptyPlace: 'Eastworld member' });
      populateProfileForm(currentUser);
      closeForm();
      showMessage('Pass updated', 'info');
    } catch (err) {
      showError('Could not reach the server');
    }
    button.disabled = false;
    button.innerHTML = originalHtml;
  });
}

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
    setupProfileEdit(user);
  } catch (err) {
    status.textContent = 'Could not load your pass.';
  }

  logoutBtn?.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = 'index.html';
  });
}

loadProfilePage();

// ---------- Nav auth state (pass chip + dropdown card) ----------

function ensurePassNavStyles() {
  if (document.getElementById('pass-nav-css')) return;
  const link = document.createElement('link');
  link.id = 'pass-nav-css';
  link.rel = 'stylesheet';
  // auth.js is always loaded from the site root on main pages
  link.href = 'pass-nav.css';
  document.head.appendChild(link);
}

function fillNavPassCard(user, root) {
  const role = (user.role || 'member').toLowerCase();
  const type = (user.user_type || 'visitor').toLowerCase();
  const username = user.username || 'Member';
  const card = root.querySelector('.nav-pass-id');
  const badge = root.querySelector('.id-badge');
  const nameEl = root.querySelector('.id-meta h3');
  const placeEl = root.querySelector('.id-meta p');
  const initialsEl = root.querySelector('.id-avatar span');
  const photoEl = root.querySelector('.id-avatar img');
  const sinceEl = root.querySelector('[data-nav-since]');
  const reviewsEl = root.querySelector('[data-nav-reviews]');

  if (card) {
    card.dataset.role = ['admin', 'creator', 'member'].includes(role) ? role : 'member';
  }
  if (nameEl) nameEl.textContent = username;
  const country = titleCaseSlug(user.country);
  const city = titleCaseSlug(user.home_city);
  if (placeEl) {
    if (country && city) placeEl.textContent = `${country} · ${city}`;
    else if (country) placeEl.textContent = country;
    else if (city) placeEl.textContent = city;
    else placeEl.textContent = 'Eastworld member';
  }
  if (badge) {
    delete badge.dataset.type;
    delete badge.dataset.role;
    if (role === 'admin') {
      badge.textContent = 'Founder';
      badge.dataset.role = 'admin';
    } else if (role === 'creator') {
      badge.textContent = 'Creator';
      badge.dataset.role = 'creator';
    } else {
      badge.textContent = type;
      badge.dataset.type = type;
    }
  }
  if (initialsEl) initialsEl.textContent = initialsFrom(username);
  if (photoEl) {
    if (user.profile_image_url) {
      photoEl.src = user.profile_image_url;
      photoEl.alt = username;
      photoEl.hidden = false;
      if (initialsEl) initialsEl.hidden = true;
    } else {
      photoEl.removeAttribute('src');
      photoEl.hidden = true;
      if (initialsEl) initialsEl.hidden = false;
    }
  }
  if (sinceEl) sinceEl.textContent = formatMemberSince(user.created_at);
  if (reviewsEl) reviewsEl.textContent = String(user.review_count ?? 0);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function mountNavPass(user) {
  // Skip on auth/profile shells — those pages already show the full pass
  if (document.querySelector('.auth-shell')) return;

  const loginLink = document.querySelector('a[href="login.html"], a[href$="/login.html"]');
  const registerLink = document.querySelector('a[href="register.html"], a[href$="/register.html"]');
  if (!loginLink && !registerLink) return;

  ensurePassNavStyles();

  const role = (user.role || 'member').toLowerCase();
  const safeRole = ['admin', 'creator', 'member'].includes(role) ? role : 'member';
  const name = escapeHtml((user.username || 'Member').toUpperCase());
  const initials = escapeHtml(initialsFrom(user.username));
  const photo = user.profile_image_url
    ? `<img src="${escapeHtml(user.profile_image_url)}" alt="">`
    : initials;

  const wrap = document.createElement('div');
  wrap.className = 'nav-pass auth-link';
  wrap.innerHTML = `
    <button type="button" class="nav-pass-chip" data-role="${safeRole}" aria-expanded="false" aria-haspopup="true">
      <span class="nav-pass-avatar">${photo}</span>
      <span class="nav-pass-name">${name}</span>
    </button>
    <div class="nav-pass-menu" hidden>
      <article class="nav-pass-id" data-role="${safeRole}">
        <div class="id-card-top">
          <div class="id-card-mark">Eastworld<small>Member pass</small></div>
          <span class="id-badge">Member</span>
        </div>
        <div class="id-card-body">
          <div class="id-avatar">
            <span></span>
            <img alt="" hidden>
          </div>
          <div class="id-meta">
            <h3></h3>
            <p></p>
          </div>
        </div>
        <div class="id-card-foot">
          <div>Reviews<strong data-nav-reviews>0</strong></div>
          <div>Member since<strong data-nav-since>—</strong></div>
        </div>
      </article>
      <div class="nav-pass-menu-actions">
        <a href="profile.html">Open pass</a>
        <button type="button" data-nav-logout>Log out</button>
      </div>
    </div>
  `;

  fillNavPassCard(user, wrap);

  const chip = wrap.querySelector('.nav-pass-chip');
  const menu = wrap.querySelector('.nav-pass-menu');
  chip.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = menu.hidden;
    menu.hidden = !open;
    wrap.classList.toggle('is-open', open);
    chip.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', () => {
    menu.hidden = true;
    wrap.classList.remove('is-open');
    chip.setAttribute('aria-expanded', 'false');
  });
  menu.addEventListener('click', (e) => e.stopPropagation());

  wrap.querySelector('[data-nav-logout]')?.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  });

  const stack = registerLink?.closest('.login-register-stack')
    || loginLink?.closest('.login-register-stack');
  if (stack) {
    stack.replaceWith(wrap);
  } else if (registerLink) {
    registerLink.replaceWith(wrap);
    loginLink?.remove();
  } else if (loginLink) {
    loginLink.replaceWith(wrap);
  }
}

async function checkAuthState() {
  // Don't hide auth links forever on login/register/profile pages
  const onAuthShell = !!document.querySelector('.auth-shell');

  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return;

    const user = await res.json();
    mountNavPass(user);
  } catch (err) {
    // silent fail — links stay as LOGIN/REGISTER
  } finally {
    if (!onAuthShell) {
      document.querySelectorAll('.auth-link').forEach((el) => {
        el.style.visibility = 'visible';
      });
    }
  }
}

checkAuthState();
