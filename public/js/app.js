// Global Application Controller & SPA Router

const App = {
  state: {
    user: null,
    token: null,
    needsSetup: true,
    currentTheme: 'dark',
    currentRoute: '/'
  },

  async init() {
    this.loadTheme();
    this.setupGlobalEventListeners();
    await this.checkSetupStatus();
    this.initTabSession();
  },

  // Toast Notification System
  showToast(message, type = 'info') {
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    if (!toast) return;

    toastMessage.textContent = message;
    toast.className = `toast active ${type}`;

    // Set matching icons
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';

    toastIcon.setAttribute('data-lucide', iconName);
    if (window.lucide) {
      window.lucide.createIcons();
    }

    setTimeout(() => {
      toast.classList.remove('active');
    }, 4000);
  },

  // Theme Handling
  loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.state.currentTheme = savedTheme;
  },

  toggleTheme() {
    const newTheme = this.state.currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    this.state.currentTheme = newTheme;
    
    // Update theme toggle icons if they exist in view
    const icon = document.querySelector('.theme-toggle-btn i');
    if (icon) {
      icon.setAttribute('data-lucide', newTheme === 'dark' ? 'sun' : 'moon');
      if (window.lucide) window.lucide.createIcons();
    }
  },

  // Setup Check on Startup
  async checkSetupStatus() {
    try {
      const res = await fetch('/api/setup/status');
      const data = await res.json();
      this.state.needsSetup = data.needsSetup;

      if (this.state.needsSetup) {
        this.navigate('/setup');
      } else {
        // Retrieve token
        const token = localStorage.getItem('token');
        const userJson = localStorage.getItem('user');

        if (token && userJson) {
          this.state.token = token;
          this.state.user = JSON.parse(userJson);
          
          // Route based on role
          if (this.state.user.role === 'DEVELOPER') {
            this.navigate('/developer');
          } else if (this.state.user.role === 'SUPER_ADMIN') {
            this.navigate('/admin');
          } else if (this.state.user.role === 'SCHOOL_USER') {
            this.navigate('/school');
          } else {
            this.navigate('/');
          }
        } else {
          this.navigate('/');
        }
      }
    } catch (error) {
      console.error('Failed to connect to server:', error);
      this.showToast('Could not connect to the backend server. Please verify connection.', 'error');
    }
  },

  // Global API call helper that includes authorization header
  async apiCall(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.state.token) {
      headers['Authorization'] = `Bearer ${this.state.token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(endpoint, config);
      
      // Auto handle session expirations
      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json();
        if (this.state.token) {
          this.logout();
          this.showToast(errorData.message || 'Session expired. Please log in again.', 'error');
        }
        return { error: true, status: response.status, message: errorData.message };
      }

      const data = await response.json();
      if (!response.ok) {
        return { error: true, status: response.status, message: data.message || 'API request failed.' };
      }

      return data;
    } catch (error) {
      console.error(`API Call to ${endpoint} failed:`, error);
      return { error: true, message: 'Network request failed.' };
    }
  },

  // Navigation router
  navigate(route) {
    this.state.currentRoute = route;
    
    // Safety check - If needsSetup, force setup wizard and hide everything else
    if (this.state.needsSetup && route !== '/setup') {
      history.pushState(null, '', '/setup');
      this.renderSetupWizard();
      return;
    }

    history.pushState(null, '', route);
    this.routeToView(route);
  },

  routeToView(route) {
    const container = document.getElementById('view-container');
    if (!container) return;

    if (route === '/setup') {
      this.renderSetupWizard();
    } else if (route === '/') {
      this.renderLogin();
    } else if (route.startsWith('/developer')) {
      this.renderDeveloperDashboard();
    } else if (route.startsWith('/admin')) {
      this.renderSuperAdminDashboard();
    } else if (route.startsWith('/school')) {
      this.renderSchoolDashboard();
    } else {
      container.innerHTML = `<div class="text-center" style="padding: 100px 20px;">
        <h2>404 - Page Not Found</h2>
        <p style="color: var(--text-secondary); margin: 15px 0;">The requested page does not exist.</p>
        <button class="btn btn-primary" onclick="App.navigate('/')">Go to Login</button>
      </div>`;
    }
    
    // Refresh icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  // View Renders
  renderSetupWizard() {
    if (window.SetupWizard) {
      window.SetupWizard.render();
    }
  },

  renderLogin() {
    if (window.LoginFlow) {
      window.LoginFlow.render();
    }
  },

  renderDeveloperDashboard() {
    if (window.DashboardPortal) {
      window.DashboardPortal.renderDeveloper();
    }
  },

  renderSuperAdminDashboard() {
    if (window.DashboardPortal) {
      window.DashboardPortal.renderSuperAdmin();
    }
  },

  renderSchoolDashboard() {
    if (window.DashboardPortal) {
      window.DashboardPortal.renderSchool();
    }
  },

  // Auth operations
  login(token, user) {
    this.state.token = token;
    this.state.user = user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.initTabSession();

    if (user.role === 'DEVELOPER') {
      this.navigate('/developer');
    } else if (user.role === 'SUPER_ADMIN') {
      this.navigate('/admin');
    } else if (user.role === 'SCHOOL_USER') {
      this.navigate('/school');
    }
  },

  logout() {
    if (this.state.token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.state.token}` }
      }).catch(err => console.error('Logout error:', err));
    }
    this.state.token = null;
    this.state.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    const overlay = document.getElementById('tab-warning-overlay');
    if (overlay) {
      document.body.removeChild(overlay);
    }

    this.initTabSession();
    this.navigate('/');
  },

  initTabSession() {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (!token || !userJson) {
      if (this.tabChannel) {
        this.tabChannel.close();
        this.tabChannel = null;
      }
      return;
    }

    const user = JSON.parse(userJson);
    const userId = user.id;

    let tabId = sessionStorage.getItem('tabId');
    if (!tabId) {
      tabId = Math.random().toString(36).substring(2, 11);
      sessionStorage.setItem('tabId', tabId);
    }
    this.state.tabId = tabId;

    if (!this.tabChannel) {
      this.tabChannel = new BroadcastChannel(`tab-session-channel-${userId}`);
      
      this.tabChannel.onmessage = (event) => {
        const { type, senderTabId } = event.data;
        if (senderTabId === tabId) return;

        if (type === 'PING') {
          this.tabChannel.postMessage({ type: 'PONG', senderTabId: tabId });
        } else if (type === 'PONG') {
          this.showTabWarning();
        } else if (type === 'TAKE_OVER') {
          this.showTabWarning();
        }
      };
    }

    this.tabChannel.postMessage({ type: 'PING', senderTabId: tabId });
  },

  showTabWarning() {
    if (document.getElementById('tab-warning-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'tab-warning-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(11, 15, 30, 0.95)';
    overlay.style.backdropFilter = 'blur(16px)';
    overlay.style.zIndex = '99999';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '2rem';
    overlay.style.textAlign = 'center';
    overlay.style.color = 'var(--text-primary)';
    overlay.style.fontFamily = 'var(--font-sans)';

    overlay.innerHTML = `
      <div class="card-glass text-center" style="max-width: 500px; padding: 3rem; border: 1px solid var(--border);">
        <div style="width: 70px; height: 70px; border-radius: 50%; background-color: rgba(239, 68, 68, 0.15); color: var(--error); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
          <i data-lucide="alert-octagon" style="width: 38px; height: 38px;"></i>
        </div>
        <h2 style="font-size: 24px; margin-bottom: 1rem; font-family: var(--font-display);">Duplicate Tab Detected</h2>
        <p style="color: var(--text-secondary); font-size: 15px; margin-bottom: 2rem; line-height: 1.6;">
          Only one active browser tab is allowed for this portal. To resume using the application here, click the button below.
        </p>
        <button id="btn-take-over" class="btn btn-primary w-full">Use This Tab Instead</button>
      </div>
    `;

    document.body.appendChild(overlay);
    if (window.lucide) window.lucide.createIcons();

    document.getElementById('btn-take-over').addEventListener('click', () => {
      document.body.removeChild(overlay);
      if (this.tabChannel) {
        this.tabChannel.postMessage({ type: 'TAKE_OVER', senderTabId: this.state.tabId });
      }
    });
  },

  setupGlobalEventListeners() {
    // Handle back/forward navigation
    window.addEventListener('popstate', () => {
      this.routeToView(window.location.pathname);
    });
  }
};

// Initialize App on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
