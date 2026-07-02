// Tabbed Login Flow Logic

const LoginFlow = {
  currentTab: 'developer', // developer, super_admin, school

  render() {
    const container = document.getElementById('view-container');
    if (!container) return;

    container.innerHTML = `
      <div class="login-container">
        <div class="login-card card-glass">
          <div class="login-title-area">
            <div class="login-logo">S</div>
            <h2 id="login-subtitle">Developer Portal</h2>
            <p style="color: var(--text-muted); font-size: 13px; margin-top: 5px;">School Management SaaS Platform</p>
          </div>

          <!-- Tab Controls -->
          <div class="tabs-control">
            <div class="tab-btn active" id="tab-developer" onclick="LoginFlow.switchTab('developer')">Developer</div>
            <div class="tab-btn" id="tab-super_admin" onclick="LoginFlow.switchTab('super_admin')">Super Admin</div>
            <div class="tab-btn" id="tab-school" onclick="LoginFlow.switchTab('school')">School User</div>
          </div>

          <!-- Login Form -->
          <form id="login-form" onsubmit="LoginFlow.handleLogin(event)">
            <!-- School Code (Initially Hidden) -->
            <div class="form-group hidden" id="group-school-code">
              <label>School Code *</label>
              <input type="text" class="input-control" id="login-school-code" placeholder="e.g. HIGH-SCH-01">
            </div>

            <!-- Username -->
            <div class="form-group">
              <label id="label-username">Username or Email *</label>
              <input type="text" class="input-control" id="login-username" placeholder="e.g. admin_user" required>
            </div>

            <!-- Password -->
            <div class="form-group">
              <label>Password *</label>
              <input type="password" class="input-control" id="login-password" placeholder="••••••••" required>
            </div>

            <button type="submit" class="btn btn-primary w-full" style="margin-top: 1.5rem;" id="login-submit-btn">
              <span>Sign In</span>
              <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>
            </button>
          </form>
        </div>
      </div>
    `;

    this.updateTabUI();
    if (window.lucide) window.lucide.createIcons();
  },

  switchTab(tab) {
    this.currentTab = tab;
    this.updateTabUI();
  },

  updateTabUI() {
    const devTab = document.getElementById('tab-developer');
    const adminTab = document.getElementById('tab-super_admin');
    const schoolTab = document.getElementById('tab-school');
    const codeGroup = document.getElementById('group-school-code');
    const subtitle = document.getElementById('login-subtitle');
    const userLabel = document.getElementById('label-username');
    const userInput = document.getElementById('login-username');

    // Reset tabs
    devTab.classList.remove('active');
    adminTab.classList.remove('active');
    schoolTab.classList.remove('active');

    if (this.currentTab === 'developer') {
      devTab.classList.add('active');
      codeGroup.classList.add('hidden');
      subtitle.textContent = 'Developer Login';
      userLabel.textContent = 'Username or Email *';
      userInput.placeholder = 'e.g. root_dev';
    } else if (this.currentTab === 'super_admin') {
      adminTab.classList.add('active');
      codeGroup.classList.add('hidden');
      subtitle.textContent = 'Super Admin Login';
      userLabel.textContent = 'Username or Email *';
      userInput.placeholder = 'e.g. super_admin';
    } else if (this.currentTab === 'school') {
      schoolTab.classList.add('active');
      codeGroup.classList.remove('hidden');
      subtitle.textContent = 'School Access';
      userLabel.textContent = 'User ID / Username *';
      userInput.placeholder = 'e.g. principal_sarah';
    }

    if (window.lucide) window.lucide.createIcons();
  },

  async handleLogin(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('login-submit-btn');
    const schoolCodeInput = document.getElementById('login-school-code');
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const schoolCode = schoolCodeInput ? schoolCodeInput.value.trim() : '';

    if (!username || !password) {
      App.showToast('Please fill out all credentials.', 'error');
      return;
    }

    if (this.currentTab === 'school' && !schoolCode) {
      App.showToast('School code is required for School Login.', 'error');
      return;
    }

    // Set loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Signing in...</span>`;

    let url = '';
    let bodyObj = { username, password };

    if (this.currentTab === 'developer') {
      url = '/api/auth/developer/login';
    } else if (this.currentTab === 'super_admin') {
      url = '/api/auth/super-admin/login';
    } else if (this.currentTab === 'school') {
      url = '/api/auth/school/login';
      bodyObj.schoolCode = schoolCode;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyObj)
      });

      const data = await response.json();

      if (!response.ok) {
        App.showToast(data.message || 'Login failed. Invalid credentials.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Sign In</span><i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>`;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      App.showToast('Login successful. Redirecting...', 'success');
      
      // Complete login process in App
      App.login(data.token, data.user);

    } catch (error) {
      console.error('Login request failed:', error);
      App.showToast('Server connection error. Please try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Sign In</span><i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>`;
      if (window.lucide) window.lucide.createIcons();
    }
  }
};

window.LoginFlow = LoginFlow;
