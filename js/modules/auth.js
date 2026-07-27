const Auth = {
  currentUser: null,

  getUserId() {
    return this.currentUser?.id;
  },

  updateUI(user) {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');

    if (user) {
      sidebar.classList.remove('hidden');
      mainContent.classList.remove('expanded');
      document.getElementById('logoutBtn').onclick = () => this.confirmLogout();
    } else {
      sidebar.classList.add('hidden');
      mainContent.classList.add('expanded');
    }
  },

  authDecor() {
    return `
      <div style="position:absolute;top:-60px;right:-60px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,var(--primary-glow),transparent 70%);pointer-events:none"></div>
      <div style="position:absolute;bottom:-40px;left:-40px;width:140px;height:140px;border-radius:50%;background:radial-gradient(circle,var(--primary-glow),transparent 70%);pointer-events:none"></div>
    `;
  },

  showLogin() {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `
      <div style="max-width:420px;margin:80px auto;position:relative">
        ${this.authDecor()}
        <div class="auth-container" style="position:relative;z-index:1">
          <div style="text-align:center;margin-bottom:28px">
            <div style="font-size:1.6rem;font-weight:800;letter-spacing:-0.5px;margin-bottom:6px">TaskPilot <span class="logo-ai">AI</span></div>
            <p style="color:var(--gray-400);font-size:0.9rem">Welcome back! Sign in to continue</p>
          </div>
          <button class="btn btn-google btn-block" id="googleLoginBtn">
            <svg width="18" height="18" viewBox="0 0 48 48" style="margin-right:8px;flex-shrink:0"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
            Continue with Google
          </button>
          <div class="auth-divider"><span>or</span></div>
          <form id="loginForm">
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="loginEmail" placeholder="you@example.com" required>
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" id="loginPassword" placeholder="Enter your password" required>
            </div>
            <div id="loginError" class="error-msg"></div>
            <button type="submit" class="btn btn-primary btn-block" id="loginBtn">Sign In</button>
          </form>
          <div class="auth-link">Don't have an account? <a id="goToRegister">Create one</a></div>
        </div>
      </div>
    `;
    document.getElementById('loginForm').onsubmit = (e) => {
      e.preventDefault();
      this.login();
    };
    document.getElementById('googleLoginBtn').onclick = () => this.signInWithGoogle();
    document.getElementById('goToRegister').onclick = () => router.navigate('register');
  },

  showRegister() {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `
      <div style="max-width:420px;margin:80px auto;position:relative">
        ${this.authDecor()}
        <div class="auth-container" style="position:relative;z-index:1">
          <div style="text-align:center;margin-bottom:28px">
            <div style="font-size:1.6rem;font-weight:800;letter-spacing:-0.5px;margin-bottom:6px">TaskPilot <span class="logo-ai">AI</span></div>
            <p style="color:var(--gray-400);font-size:0.9rem">Create your account and get started</p>
          </div>
          <button class="btn btn-google btn-block" id="googleRegBtn">
            <svg width="18" height="18" viewBox="0 0 48 48" style="margin-right:8px;flex-shrink:0"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
            Continue with Google
          </button>
          <div class="auth-divider"><span>or</span></div>
          <form id="registerForm">
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="regEmail" placeholder="you@example.com" required>
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" id="regPassword" placeholder="Min 6 characters" required minlength="6">
            </div>
            <div id="regError" class="error-msg"></div>
            <button type="submit" class="btn btn-primary btn-block" id="registerBtn">Create Account</button>
          </form>
          <div class="auth-link">Already have an account? <a id="goToLogin">Sign In</a></div>
        </div>
      </div>
    `;
    document.getElementById('registerForm').onsubmit = (e) => {
      e.preventDefault();
      this.register();
    };
    document.getElementById('googleRegBtn').onclick = () => this.signInWithGoogle();
    document.getElementById('goToLogin').onclick = () => router.navigate('login');
  },

  async signInWithGoogle() {
    try {
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async login() {
    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px;border-top-color:currentColor;border-color:rgba(255,255,255,0.3);margin:0 auto"></span>';
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    try {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showToast('Signed in successfully', 'success');
    } catch (err) {
      errorEl.textContent = err.message;
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  },

  async register() {
    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px;border-top-color:currentColor;border-color:rgba(255,255,255,0.3);margin:0 auto"></span>';
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const errorEl = document.getElementById('regError');
    errorEl.style.color = '';
    try {
      const { error } = await sb.auth.signUp({ email, password });
      if (error) throw error;
      errorEl.textContent = 'Registration successful! You can now sign in.';
      errorEl.style.color = '';
      errorEl.style.color = 'var(--secondary)';
      btn.disabled = false;
      btn.textContent = 'Create Account';
      showToast('Account created! Check your email to confirm.', 'success');
    } catch (err) {
      errorEl.textContent = err.message;
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  },

  confirmLogout() {
    const modal = showModal(`
      <h3 style="margin-bottom:8px">Sign Out</h3>
      <p style="color:var(--gray-500);font-size:0.9rem">Are you sure you want to sign out?</p>
      <div class="modal-actions" style="margin-top:24px">
        <button class="btn btn-ghost" id="cancelLogout">Cancel</button>
        <button class="btn btn-danger" id="confirmLogout">Sign Out</button>
      </div>
    `);
    document.getElementById('cancelLogout').onclick = () => closeModal();
    document.getElementById('confirmLogout').onclick = () => {
      closeModal();
      this.logout();
    };
  },

  async logout() {
    await sb.auth.signOut();
    showToast('Signed out successfully', 'info');
  }
};
