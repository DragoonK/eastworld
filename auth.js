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

// Form validation and submission
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const button = e.target.querySelector('button');
  
  try {
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    
    // Simulate login delay (for demo purposes)
    setTimeout(() => {
      // For demo, just redirect to homepage
      window.location.href = 'index.html';
    }, 1500);
    
  } catch (error) {
    showError('An error occurred during login');
  }
});

// Register form handling
document.getElementById('register-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username')?.value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const button = e.target.querySelector('button');
  
  // Simple validation
  if (password.length < 6) {
    showError('Password must be at least 6 characters');
    return;
  }
  
  try {
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    
    // Simulate registration delay (for demo purposes)
    setTimeout(() => {
      // For demo, just redirect to login page
      window.location.href = 'login.html';
    }, 1500);
    
  } catch (error) {
    showError('An error occurred during registration');
  }
});

// Social auth handling (for demo purposes)
document.querySelectorAll('.social-auth-btn').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    const provider = this.getAttribute('data-provider');
    showMessage(`${provider} login is not implemented in this demo`, 'info');
  });
});

// Helper functions
function showError(message) {
  const errorElement = document.querySelector('.auth-error');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  } else {
    showMessage(message, 'error');
  }
}

function showMessage(message, type = 'error') {
  // Create message element if it doesn't exist
  let messageEl = document.getElementById('auth-message');
  if (!messageEl) {
    messageEl = document.createElement('div');
    messageEl.id = 'auth-message';
    document.body.appendChild(messageEl);
  }
  
  // Set styles based on message type
  messageEl.className = `auth-message ${type}`;
  messageEl.textContent = message;
  messageEl.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    messageEl.style.display = 'none';
  }, 5000);
} 