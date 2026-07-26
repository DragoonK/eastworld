// Toggle password visibility
document.querySelectorAll('.toggle-password').forEach(toggle => {
  toggle.addEventListener('click', function() {
    const input = this.previousElementSibling;
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
  });
});

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
    window.location.href = 'index.html';
  } catch (err) {
    showError('Could not reach the server');
    button.disabled = false;
    button.innerHTML = originalHtml;
  }
});

document.getElementById('register-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username')?.value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password')?.value;
  const userType = document.getElementById('user-type')?.value;
  const homeCity = document.getElementById('home-city')?.value.trim();
  const button = e.target.querySelector('button');
  const originalHtml = button.innerHTML;

  if (password.length < 6) {
    showError('Password must be at least 6 characters');
    return;
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    showError('Passwords do not match');
    return;
  }
  if (!userType) {
    showError('Please select whether you are a local, expat or visitor');
    return;
  }

  button.disabled = true;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        email,
        password,
        user_type: userType,
        home_city: homeCity,
      }),
    });
    const result = await res.json().catch(() => ({}));

    if (!res.ok) {
      showError(result.error || 'Registration failed');
      button.disabled = false;
      button.innerHTML = originalHtml;
      return;
    }
    window.location.href = 'index.html';
  } catch (err) {
    showError('Could not reach the server');
    button.disabled = false;
    button.innerHTML = originalHtml;
  }
});

document.querySelectorAll('.social-auth-btn, .social-button').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    const provider = this.getAttribute('data-provider')
      || (this.classList.contains('google') ? 'Google' : 'Apple');
    showMessage(`${provider} login is not implemented yet`, 'info');
  });
});

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
