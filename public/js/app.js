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

    if (user.role === 'DEVELOPER') {
      this.navigate('/developer');
    } else if (user.role === 'SUPER_ADMIN') {
      this.navigate('/admin');
    } else if (user.role === 'SCHOOL_USER') {
      this.navigate('/school');
    }
  },

  logout() {
    this.state.token = null;
    this.state.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.navigate('/');
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
