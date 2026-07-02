// Dashboard Renderer & Interface Logic

const DashboardPortal = {
  activeTab: 'dashboard',
  schools: [],
  superAdmins: [],
  auditLogs: [],
  settings: {},
  profile: {},

  // RENDER DEVELOPER PORTAL
  async renderDeveloper() {
    this.activeTab = localStorage.getItem('devActiveTab') || 'dashboard';
    const container = document.getElementById('view-container');
    if (!container) return;

    // Load initial layout
    container.innerHTML = `
      <div class="dashboard-layout">
        <!-- Sidebar -->
        <aside class="sidebar">
          <div class="sidebar-header">
            <div class="sidebar-logo">D</div>
            <div>
              <div class="sidebar-title" id="sidebar-app-title">EduPortal SaaS</div>
              <div class="user-role" style="color: var(--accent); font-weight: 600;">Platform Owner</div>
            </div>
          </div>

          <div class="sidebar-menu">
            <div class="menu-section-label">Administration</div>
            <div class="menu-item ${this.activeTab === 'dashboard' ? 'active' : ''}" onclick="DashboardPortal.switchDevTab('dashboard')">
              <i data-lucide="layout-dashboard" style="width: 18px; height: 18px;"></i>
              <span>Dashboard</span>
            </div>
            <div class="menu-item ${this.activeTab === 'schools' ? 'active' : ''}" onclick="DashboardPortal.switchDevTab('schools')">
              <i data-lucide="school" style="width: 18px; height: 18px;"></i>
              <span>Schools</span>
            </div>
            <div class="menu-item ${this.activeTab === 'super_admins' ? 'active' : ''}" onclick="DashboardPortal.switchDevTab('super_admins')">
              <i data-lucide="shield-check" style="width: 18px; height: 18px;"></i>
              <span>Super Admins</span>
            </div>
            <div class="menu-item ${this.activeTab === 'modules' ? 'active' : ''}" onclick="DashboardPortal.switchDevTab('modules')">
              <i data-lucide="layers" style="width: 18px; height: 18px;"></i>
              <span>Modules</span>
            </div>
            <div class="menu-item ${this.activeTab === 'subscriptions' ? 'active' : ''}" onclick="DashboardPortal.switchDevTab('subscriptions')">
              <i data-lucide="credit-card" style="width: 18px; height: 18px;"></i>
              <span>Subscriptions</span>
            </div>

            <div class="menu-section-label" style="margin-top: 1.5rem;">System</div>
            <div class="menu-item ${this.activeTab === 'database' ? 'active' : ''}" onclick="DashboardPortal.switchDevTab('database')">
              <i data-lucide="database" style="width: 18px; height: 18px;"></i>
              <span>Database</span>
            </div>
            <div class="menu-item ${this.activeTab === 'audit_logs' ? 'active' : ''}" onclick="DashboardPortal.switchDevTab('audit_logs')">
              <i data-lucide="file-text" style="width: 18px; height: 18px;"></i>
              <span>Audit Logs</span>
            </div>
            <div class="menu-item ${this.activeTab === 'settings' ? 'active' : ''}" onclick="DashboardPortal.switchDevTab('settings')">
              <i data-lucide="settings" style="width: 18px; height: 18px;"></i>
              <span>Settings</span>
            </div>
            <div class="menu-item ${this.activeTab === 'profile' ? 'active' : ''}" onclick="DashboardPortal.switchDevTab('profile')">
              <i data-lucide="user" style="width: 18px; height: 18px;"></i>
              <span>Profile</span>
            </div>
          </div>

          <div class="sidebar-footer">
            <div class="user-profile-badge">
              <div class="user-avatar" id="avatar-letter">D</div>
              <div class="user-info">
                <span class="user-name" id="user-display-name">Developer</span>
                <span class="user-role" id="user-display-username">root_dev</span>
              </div>
            </div>
            <div class="logout-btn" onclick="App.logout()" title="Logout">
              <i data-lucide="log-out" style="width: 18px; height: 18px;"></i>
            </div>
          </div>
        </aside>

        <!-- Main Body -->
        <div class="main-content">
          <header class="header">
            <div style="font-size: 18px; font-weight: 600;" id="page-content-title">Dashboard Overview</div>
            <div class="header-actions">
              <button class="theme-toggle-btn" onclick="App.toggleTheme()" title="Toggle Theme">
                <i data-lucide="sun" style="width: 20px; height: 20px;"></i>
              </button>
            </div>
          </header>

          <div class="content-body" id="dev-content-body">
            <!-- Dynamic page body -->
          </div>
        </div>
      </div>

      <!-- Super Admin Creator Modal -->
      <div class="modal-overlay" id="admin-modal">
        <div class="modal-box">
          <div class="modal-header">
            <h3>Add Platform Super Admin</h3>
          </div>
          <form onsubmit="DashboardPortal.handleCreateSuperAdmin(event)">
            <div class="form-grid-2">
              <div class="form-group">
                <label>Full Name *</label>
                <input type="text" class="input-control" id="modal-admin-name" required placeholder="e.g. Alice Cooper">
              </div>
              <div class="form-group">
                <label>Contact Phone</label>
                <input type="text" class="input-control" id="modal-admin-phone" placeholder="+1 (555) 987-6543">
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Email *</label>
                <input type="email" class="input-control" id="modal-admin-email" required placeholder="alice@eduportal.com">
              </div>
              <div class="form-group">
                <label>Username *</label>
                <input type="text" class="input-control" id="modal-admin-username" required placeholder="alice_admin">
              </div>
            </div>
            <div class="form-group">
              <label>Password *</label>
              <input type="password" class="input-control" id="modal-admin-password" required placeholder="••••••••">
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Country</label>
                <input type="text" class="input-control" id="modal-admin-country" placeholder="United States">
              </div>
              <div class="form-group">
                <label>Timezone</label>
                <select class="input-control" id="modal-admin-timezone">
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                </select>
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" onclick="DashboardPortal.toggleAdminModal(false)">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Admin</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Populate profile card
    this.updateDeveloperHeader();
    await this.loadDeveloperTabContent();
    if (window.lucide) window.lucide.createIcons();
  },

  updateDeveloperHeader() {
    if (App.state.user) {
      document.getElementById('user-display-name').textContent = App.state.user.name;
      document.getElementById('user-display-username').textContent = `@${App.state.user.username}`;
      document.getElementById('avatar-letter').textContent = App.state.user.name.charAt(0).toUpperCase();
    }
  },

  async switchDevTab(tab) {
    this.activeTab = tab;
    localStorage.setItem('devActiveTab', tab);
    
    // Update active tab styling
    document.querySelectorAll('.sidebar-menu .menu-item').forEach(el => el.classList.remove('active'));
    
    // Simple query find
    const menuItems = Array.from(document.querySelectorAll('.sidebar-menu .menu-item'));
    const matched = menuItems.find(item => item.innerText.toLowerCase().includes(tab.replace('_', ' ').toLowerCase()));
    if (matched) matched.classList.add('active');

    // Update Title
    const titleMap = {
      dashboard: 'Dashboard Overview',
      schools: 'SaaS School Tenants',
      super_admins: 'Platform Super Admins',
      modules: 'Platform Module Manager',
      subscriptions: 'SaaS Subscription Plans',
      database: 'Database Maintenance & Backups',
      audit_logs: 'Platform Security Audit Logs',
      settings: 'Global Platform Settings',
      profile: 'Developer Profile Settings'
    };
    document.getElementById('page-content-title').textContent = titleMap[tab] || 'Developer Portal';

    await this.loadDeveloperTabContent();
    if (window.lucide) window.lucide.createIcons();
  },

  async loadDeveloperTabContent() {
    const body = document.getElementById('dev-content-body');
    if (!body) return;

    body.innerHTML = `<div class="text-center" style="padding: 50px 0;"><div class="stat-value" style="font-size: 18px; color: var(--text-secondary)">Loading content...</div></div>`;

    switch (this.activeTab) {
      case 'dashboard':
        const stats = await App.apiCall('/api/developer/stats');
        const recentLogs = await App.apiCall('/api/developer/audit-logs');
        
        let logsHtml = '';
        if (recentLogs && recentLogs.length > 0) {
          recentLogs.slice(0, 5).forEach(log => {
            logsHtml += `
              <tr>
                <td>${new Date(log.createdAt).toLocaleString()}</td>
                <td><span class="btn-status status-active" style="text-transform:lowercase; padding: 2px 6px;">${log.actorType}</span></td>
                <td><strong>${log.actorName}</strong></td>
                <td><code>${log.action}</code></td>
                <td>${log.details}</td>
              </tr>
            `;
          });
        } else {
          logsHtml = `<tr><td colspan="5" class="text-center" style="color: var(--text-muted);">No recent logs.</td></tr>`;
        }

        body.innerHTML = `
          <!-- Stats Grid -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-details">
                <h3>Total Schools</h3>
                <div class="stat-value">${stats.schools || 0}</div>
              </div>
              <div class="stat-icon-wrapper icon-purple">
                <i data-lucide="school"></i>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-details">
                <h3>Active Schools</h3>
                <div class="stat-value">${stats.activeSchools || 0}</div>
              </div>
              <div class="stat-icon-wrapper icon-green">
                <i data-lucide="check-circle-2"></i>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-details">
                <h3>Super Admins</h3>
                <div class="stat-value">${stats.superAdmins || 0}</div>
              </div>
              <div class="stat-icon-wrapper icon-pink">
                <i data-lucide="shield-check"></i>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-details">
                <h3>Security Logs</h3>
                <div class="stat-value">${stats.auditLogs || 0}</div>
              </div>
              <div class="stat-icon-wrapper icon-yellow">
                <i data-lucide="file-warning"></i>
              </div>
            </div>
          </div>

          <!-- Platform summary & charts stub -->
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
            <div class="table-container" style="margin-bottom: 0;">
              <div class="table-header-bar">
                <span class="table-header-title">Recent Security Events</span>
                <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 11px;" onclick="DashboardPortal.switchDevTab('audit_logs')">View All</button>
              </div>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor Type</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  ${logsHtml}
                </tbody>
              </table>
            </div>

            <div class="card-glass" style="padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <h3 style="font-size: 16px; margin-bottom: 1rem;">Platform Infrastructure</h3>
                <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 0.5rem; display: flex; justify-content: space-between;">
                  <span>Database engine:</span>
                  <strong style="color: var(--text-primary);">SQLite v3</strong>
                </div>
                <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 0.5rem; display: flex; justify-content: space-between;">
                  <span>Host Environment:</span>
                  <strong style="color: var(--text-primary);">Local Node.js</strong>
                </div>
                <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 0.5rem; display: flex; justify-content: space-between;">
                  <span>System Toggles:</span>
                  <strong style="color: var(--success);">All Operational</strong>
                </div>
              </div>
              <button class="btn btn-secondary w-full" style="margin-top: 1rem;" onclick="DashboardPortal.switchDevTab('database')">
                <i data-lucide="hard-drive" style="width: 14px; height: 14px;"></i>
                <span>Infrastructure Maintenance</span>
              </button>
            </div>
          </div>
        `;
        break;

      case 'schools':
        const schools = await App.apiCall('/api/developer/schools');
        this.schools = schools;
        
        let schoolRows = '';
        if (schools && schools.length > 0) {
          schools.forEach(school => {
            const isActive = school.status === 'ACTIVE';
            schoolRows += `
              <tr>
                <td><strong>${school.schoolName}</strong></td>
                <td><code>${school.schoolCode}</code></td>
                <td>${school.email}</td>
                <td>${school.city}, ${school.country}</td>
                <td>${school.creator ? school.creator.name : 'Unknown'}</td>
                <td>
                  <span class="btn-status ${isActive ? 'status-active' : 'status-inactive'}">
                    ${school.status}
                  </span>
                </td>
                <td>
                  <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 11px;" onclick="DashboardPortal.toggleSchoolStatus('${school.id}', '${school.status}')">
                    ${isActive ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            `;
          });
        } else {
          schoolRows = `<tr><td colspan="7" class="text-center" style="color: var(--text-muted); padding: 2rem;">No school tenants registered on the platform.</td></tr>`;
        }

        body.innerHTML = `
          <div class="table-container">
            <div class="table-header-bar">
              <span class="table-header-title">Platform School Tenants</span>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>School Name</th>
                  <th>School Code</th>
                  <th>Email</th>
                  <th>Location</th>
                  <th>Created By (Super Admin)</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${schoolRows}
              </tbody>
            </table>
          </div>
        `;
        break;

      case 'super_admins':
        const admins = await App.apiCall('/api/developer/super-admins');
        this.superAdmins = admins;

        let adminRows = '';
        if (admins && admins.length > 0) {
          admins.forEach(admin => {
            adminRows += `
              <tr>
                <td><strong>${admin.name}</strong></td>
                <td>@${admin.username}</td>
                <td>${admin.email}</td>
                <td>${admin.phone || 'N/A'}</td>
                <td>${admin.country || 'N/A'}</td>
                <td>
                  <span class="btn-status ${admin.active ? 'status-active' : 'status-inactive'}">
                    ${admin.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td>
                  <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 11px;" onclick="DashboardPortal.toggleAdminStatus('${admin.id}', ${admin.active})">
                    ${admin.active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            `;
          });
        } else {
          adminRows = `<tr><td colspan="7" class="text-center" style="color: var(--text-muted); padding: 2rem;">No Super Admins registered.</td></tr>`;
        }

        body.innerHTML = `
          <div class="table-container">
            <div class="table-header-bar">
              <span class="table-header-title">Registered Super Admins</span>
              <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;" onclick="DashboardPortal.toggleAdminModal(true)">
                <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
                <span>Add Super Admin</span>
              </button>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Country</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${adminRows}
              </tbody>
            </table>
          </div>
        `;
        break;

      case 'modules':
        body.innerHTML = `
          <div class="maintenance-card card-glass" style="margin-bottom: 2rem;">
            <h3>SaaS Platform Features & Module Flags</h3>
            <p>Toggle features globally across all subscription plans.</p>
            
            <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1.5rem;">
              <div class="flex justify-between align-center" style="border-bottom: 1px solid var(--border); padding-bottom: 0.75rem;">
                <div>
                  <strong>Student Attendance Tracker</strong>
                  <div style="font-size: 11px; color: var(--text-muted);">RFID/Bio Attendance and logging system.</div>
                </div>
                <span class="btn-status status-active">ENABLED</span>
              </div>
              <div class="flex justify-between align-center" style="border-bottom: 1px solid var(--border); padding-bottom: 0.75rem;">
                <div>
                  <strong>Online Fee Collection</strong>
                  <div style="font-size: 11px; color: var(--text-muted);">Credit card / Bank Transfer fee payments gateway.</div>
                </div>
                <span class="btn-status status-active">ENABLED</span>
              </div>
              <div class="flex justify-between align-center" style="border-bottom: 1px solid var(--border); padding-bottom: 0.75rem;">
                <div>
                  <strong>LMS & Virtual Classrooms</strong>
                  <div style="font-size: 11px; color: var(--text-muted);">Online lessons, homework submissions, and grading.</div>
                </div>
                <span class="btn-status status-active">ENABLED</span>
              </div>
              <div class="flex justify-between align-center" style="border-bottom: 1px solid var(--border); padding-bottom: 0.75rem;">
                <div>
                  <strong>SMS / Email Alerts</strong>
                  <div style="font-size: 11px; color: var(--text-muted);">Custom broadcasts to parents and students.</div>
                </div>
                <span class="btn-status status-inactive">DISABLED (MAINTENANCE)</span>
              </div>
            </div>
          </div>
        `;
        break;

      case 'subscriptions':
        body.innerHTML = `
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-details">
                <h3>Basic Tier</h3>
                <p style="font-size:11px; color:var(--text-secondary); margin-bottom: 0.5rem;">Up to 500 students</p>
                <div class="stat-value">$49<span style="font-size:13px; font-weight:normal;">/mo</span></div>
              </div>
              <span class="btn-status status-active">ACTIVE</span>
            </div>
            <div class="stat-card">
              <div class="stat-details">
                <h3>Growth Tier</h3>
                <p style="font-size:11px; color:var(--text-secondary); margin-bottom: 0.5rem;">Up to 2,000 students</p>
                <div class="stat-value">$129<span style="font-size:13px; font-weight:normal;">/mo</span></div>
              </div>
              <span class="btn-status status-active">ACTIVE</span>
            </div>
            <div class="stat-card">
              <div class="stat-details">
                <h3>Enterprise Premium</h3>
                <p style="font-size:11px; color:var(--text-secondary); margin-bottom: 0.5rem;">Unlimited students</p>
                <div class="stat-value">$349<span style="font-size:13px; font-weight:normal;">/mo</span></div>
              </div>
              <span class="btn-status status-active">ACTIVE</span>
            </div>
          </div>
        `;
        break;

      case 'database':
        body.innerHTML = `
          <div class="maintenance-grid">
            <div class="maintenance-card">
              <i data-lucide="download-cloud" style="width: 32px; height: 32px; color: var(--primary); margin-bottom: 1rem;"></i>
              <h3>Backup Database</h3>
              <p>Download a compressed SQL snapshot of the platform database. This backup includes platform settings, schools, and audit events.</p>
              <button class="btn btn-primary" onclick="DashboardPortal.triggerBackup()">
                <i data-lucide="play" style="width: 14px; height: 14px;"></i>
                <span>Run Backup Now</span>
              </button>
            </div>
            <div class="maintenance-card">
              <i data-lucide="upload-cloud" style="width: 32px; height: 32px; color: var(--accent); margin-bottom: 1rem;"></i>
              <h3>Restore System Schema</h3>
              <p>Restore the database schema using a previous sql snapshot. Warning: This action will replace current tables completely.</p>
              <div class="form-group" style="margin-bottom: 1rem;">
                <input type="text" class="input-control" id="restore-filename" placeholder="e.g. backup_168800000.sql">
              </div>
              <button class="btn btn-secondary" onclick="DashboardPortal.triggerRestore()">
                <i data-lucide="rotate-ccw" style="width: 14px; height: 14px;"></i>
                <span>Restore Snapshot</span>
              </button>
            </div>
          </div>
        `;
        break;

      case 'audit_logs':
        const logs = await App.apiCall('/api/developer/audit-logs');
        let fullRows = '';
        if (logs && logs.length > 0) {
          logs.forEach(log => {
            fullRows += `
              <tr>
                <td>${new Date(log.createdAt).toLocaleString()}</td>
                <td><span class="btn-status status-active" style="text-transform:lowercase; padding: 2px 6px;">${log.actorType}</span></td>
                <td><strong>${log.actorName}</strong></td>
                <td><code>${log.action}</code></td>
                <td>${log.details}</td>
                <td><code style="font-size:11px;">${log.ipAddress || '127.0.0.1'}</code></td>
              </tr>
            `;
          });
        } else {
          fullRows = `<tr><td colspan="6" class="text-center" style="color: var(--text-muted); padding: 2rem;">No system audit logs found.</td></tr>`;
        }

        body.innerHTML = `
          <div class="table-container">
            <div class="table-header-bar">
              <span class="table-header-title">Platform Security & Event Trail</span>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor Type</th>
                  <th>Actor Name</th>
                  <th>Action String</th>
                  <th>Detailed Log Message</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                ${fullRows}
              </tbody>
            </table>
          </div>
        `;
        break;

      case 'settings':
        const settings = await App.apiCall('/api/developer/settings');
        this.settings = settings;

        body.innerHTML = `
          <div class="card-glass" style="max-width: 600px;">
            <form onsubmit="DashboardPortal.handleSaveSettings(event)">
              <div class="form-group">
                <label>Platform Name *</label>
                <input type="text" class="input-control" id="sett-name" value="${settings.platformName || ''}" required>
              </div>
              <div class="form-grid-2">
                <div class="form-group">
                  <label>Default Platform Theme *</label>
                  <select class="input-control" id="sett-theme">
                    <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Sleek Dark Theme</option>
                    <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Classic Light Theme</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>System Base Language *</label>
                  <select class="input-control" id="sett-lang">
                    <option value="en" ${settings.language === 'en' ? 'selected' : ''}>English</option>
                    <option value="es" ${settings.language === 'es' ? 'selected' : ''}>Spanish</option>
                    <option value="fr" ${settings.language === 'fr' ? 'selected' : ''}>French</option>
                  </select>
                </div>
              </div>
              <div class="form-grid-2">
                <div class="form-group">
                  <label>System Default Currency *</label>
                  <select class="input-control" id="sett-currency">
                    <option value="USD" ${settings.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
                    <option value="EUR" ${settings.currency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
                    <option value="INR" ${settings.currency === 'INR' ? 'selected' : ''}>INR (₹)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>System Time Zone *</label>
                  <select class="input-control" id="sett-timezone">
                    <option value="UTC" ${settings.timezone === 'UTC' ? 'selected' : ''}>UTC</option>
                    <option value="America/New_York" ${settings.timezone === 'America/New_York' ? 'selected' : ''}>America/New_York</option>
                    <option value="Europe/London" ${settings.timezone === 'Europe/London' ? 'selected' : ''}>Europe/London</option>
                    <option value="Asia/Kolkata" ${settings.timezone === 'Asia/Kolkata' ? 'selected' : ''}>Asia/Kolkata</option>
                  </select>
                </div>
              </div>
              <div class="form-grid-2">
                <div class="form-group">
                  <label>SMTP Host</label>
                  <input type="text" class="input-control" id="sett-smtp-host" value="${settings.smtpHost || ''}" placeholder="e.g. smtp.mailtrap.io">
                </div>
                <div class="form-group">
                  <label>SMTP Port</label>
                  <input type="number" class="input-control" id="sett-smtp-port" value="${settings.smtpPort || ''}" placeholder="e.g. 587">
                </div>
              </div>
              <button type="submit" class="btn btn-primary" style="margin-top: 1rem;">Save Platform Configuration</button>
            </form>
          </div>
        `;
        break;

      case 'profile':
        const prof = await App.apiCall('/api/developer/profile');
        this.profile = prof;

        body.innerHTML = `
          <div class="card-glass" style="max-width: 600px;">
            <form onsubmit="DashboardPortal.handleSaveProfile(event)">
              <div class="form-grid-2">
                <div class="form-group">
                  <label>Developer Full Name *</label>
                  <input type="text" class="input-control" id="prof-name" value="${prof.name || ''}" required>
                </div>
                <div class="form-group">
                  <label>Developer Username *</label>
                  <input type="text" class="input-control" id="prof-username" value="${prof.username || ''}" required>
                </div>
              </div>
              <div class="form-grid-2">
                <div class="form-group">
                  <label>Email Address *</label>
                  <input type="email" class="input-control" id="prof-email" value="${prof.email || ''}" required>
                </div>
                <div class="form-group">
                  <label>Organization / SaaS Company</label>
                  <input type="text" class="input-control" id="prof-org" value="${prof.organization || ''}">
                </div>
              </div>
              
              <div style="border-top: 1px solid var(--border); margin-top: 1.5rem; padding-top: 1.5rem;">
                <h4 style="margin-bottom:1rem; font-size:14px; color:var(--text-secondary);">Change Account Password</h4>
                <div class="form-group">
                  <label>Current Password</label>
                  <input type="password" class="input-control" id="prof-curr-pass" placeholder="Required for password updates">
                </div>
                <div class="form-group">
                  <label>New Password</label>
                  <input type="password" class="input-control" id="prof-new-pass" placeholder="At least 6 characters">
                </div>
              </div>
              <button type="submit" class="btn btn-primary" style="margin-top: 1rem;">Update Developer Profile</button>
            </form>
          </div>
        `;
        break;
    }
  },

  // Developer Event Actions
  toggleAdminModal(show) {
    const modal = document.getElementById('admin-modal');
    if (!modal) return;
    if (show) modal.classList.add('active');
    else modal.classList.remove('active');
  },

  async handleCreateSuperAdmin(event) {
    event.preventDefault();
    const name = document.getElementById('modal-admin-name').value;
    const phone = document.getElementById('modal-admin-phone').value;
    const email = document.getElementById('modal-admin-email').value;
    const username = document.getElementById('modal-admin-username').value;
    const password = document.getElementById('modal-admin-password').value;
    const country = document.getElementById('modal-admin-country').value;
    const timezone = document.getElementById('modal-admin-timezone').value;

    const res = await App.apiCall('/api/developer/super-admins', {
      method: 'POST',
      body: JSON.stringify({ name, phone, email, username, password, country, timezone })
    });

    if (res.error) {
      App.showToast(res.message, 'error');
    } else {
      App.showToast('Super Admin profile created!', 'success');
      this.toggleAdminModal(false);
      await this.loadDeveloperTabContent();
    }
  },

  async toggleAdminStatus(id, currentActive) {
    const res = await App.apiCall(`/api/developer/super-admins/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ active: !currentActive })
    });

    if (res.error) {
      App.showToast(res.message, 'error');
    } else {
      App.showToast(res.message, 'success');
      await this.loadDeveloperTabContent();
    }
  },

  async toggleSchoolStatus(id, currentStatus) {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const res = await App.apiCall(`/api/developer/schools/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: nextStatus })
    });

    if (res.error) {
      App.showToast(res.message, 'error');
    } else {
      App.showToast(res.message, 'success');
      await this.loadDeveloperTabContent();
    }
  },

  async handleSaveSettings(event) {
    event.preventDefault();
    const platformName = document.getElementById('sett-name').value;
    const theme = document.getElementById('sett-theme').value;
    const language = document.getElementById('sett-lang').value;
    const currency = document.getElementById('sett-currency').value;
    const timezone = document.getElementById('sett-timezone').value;
    const smtpHost = document.getElementById('sett-smtp-host').value;
    const smtpPort = document.getElementById('sett-smtp-port').value;

    const res = await App.apiCall('/api/developer/settings', {
      method: 'PUT',
      body: JSON.stringify({ platformName, theme, language, currency, timezone, smtpHost, smtpPort })
    });

    if (res.error) {
      App.showToast(res.message, 'error');
    } else {
      App.showToast('Platform settings updated successfully!', 'success');
      
      // Update sidebar title in layout
      const appTitle = document.getElementById('sidebar-app-title');
      if (appTitle) appTitle.textContent = platformName;

      await this.loadDeveloperTabContent();
    }
  },

  async handleSaveProfile(event) {
    event.preventDefault();
    const name = document.getElementById('prof-name').value;
    const username = document.getElementById('prof-username').value;
    const email = document.getElementById('prof-email').value;
    const organization = document.getElementById('prof-org').value;
    const currentPassword = document.getElementById('prof-curr-pass').value;
    const newPassword = document.getElementById('prof-new-pass').value;

    const bodyObj = { name, username, email, organization };
    if (newPassword) {
      bodyObj.currentPassword = currentPassword;
      bodyObj.newPassword = newPassword;
    }

    const res = await App.apiCall('/api/developer/profile', {
      method: 'PUT',
      body: JSON.stringify(bodyObj)
    });

    if (res.error) {
      App.showToast(res.message, 'error');
    } else {
      App.showToast('Developer profile updated successfully!', 'success');
      
      // Update global session values
      App.state.user.name = res.user.name;
      App.state.user.username = res.user.username;
      localStorage.setItem('user', JSON.stringify(App.state.user));

      // Refresh displays
      this.updateDeveloperHeader();
      await this.loadDeveloperTabContent();
    }
  },

  async triggerBackup() {
    App.showToast('Running platform backup...', 'info');
    const res = await App.apiCall('/api/developer/database/backup', { method: 'POST' });
    if (res.error) App.showToast(res.message, 'error');
    else App.showToast(`Backup snapshot created successfully: ${res.file}`, 'success');
  },

  async triggerRestore() {
    const filename = document.getElementById('restore-filename').value.trim();
    if (!filename) {
      App.showToast('Please type a snapshot filename to restore.', 'error');
      return;
    }

    App.showToast('Restoring platform schema...', 'info');
    const res = await App.apiCall('/api/developer/database/restore', {
      method: 'POST',
      body: JSON.stringify({ filename })
    });

    if (res.error) App.showToast(res.message, 'error');
    else App.showToast(res.message, 'success');
  },


  // ==========================================
  // RENDER SUPER ADMIN PORTAL
  // ==========================================
  async renderSuperAdmin() {
    this.activeTab = localStorage.getItem('adminActiveTab') || 'schools';
    const container = document.getElementById('view-container');
    if (!container) return;

    container.innerHTML = `
      <div class="dashboard-layout">
        <!-- Sidebar -->
        <aside class="sidebar">
          <div class="sidebar-header">
            <div class="sidebar-logo">A</div>
            <div>
              <div class="sidebar-title">EduPortal Admin</div>
              <div class="user-role" style="color: var(--primary); font-weight:600;">Super Admin</div>
            </div>
          </div>

          <div class="sidebar-menu">
            <div class="menu-section-label">Management</div>
            <div class="menu-item ${this.activeTab === 'schools' ? 'active' : ''}" onclick="DashboardPortal.switchAdminTab('schools')">
              <i data-lucide="school" style="width: 18px; height: 18px;"></i>
              <span>Schools</span>
            </div>
            <div class="menu-item ${this.activeTab === 'users' ? 'active' : ''}" onclick="DashboardPortal.switchAdminTab('users')">
              <i data-lucide="users" style="width: 18px; height: 18px;"></i>
              <span>Users</span>
            </div>
            <div class="menu-item ${this.activeTab === 'roles' ? 'active' : ''}" onclick="DashboardPortal.switchAdminTab('roles')">
              <i data-lucide="fingerprint" style="width: 18px; height: 18px;"></i>
              <span>Roles</span>
            </div>
            <div class="menu-item ${this.activeTab === 'permissions' ? 'active' : ''}" onclick="DashboardPortal.switchAdminTab('permissions')">
              <i data-lucide="unlock" style="width: 18px; height: 18px;"></i>
              <span>Permissions</span>
            </div>

            <div class="menu-section-label" style="margin-top:1.5rem;">SaaS Tenant Options</div>
            <div class="menu-item ${this.activeTab === 'features' ? 'active' : ''}" onclick="DashboardPortal.switchAdminTab('features')">
              <i data-lucide="star" style="width: 18px; height: 18px;"></i>
              <span>Features</span>
            </div>
            <div class="menu-item ${this.activeTab === 'subscriptions' ? 'active' : ''}" onclick="DashboardPortal.switchAdminTab('subscriptions')">
              <i data-lucide="credit-card" style="width: 18px; height: 18px;"></i>
              <span>Subscriptions</span>
            </div>
            <div class="menu-item ${this.activeTab === 'reports' ? 'active' : ''}" onclick="DashboardPortal.switchAdminTab('reports')">
              <i data-lucide="line-chart" style="width: 18px; height: 18px;"></i>
              <span>Reports</span>
            </div>
            <div class="menu-item ${this.activeTab === 'audit_logs' ? 'active' : ''}" onclick="DashboardPortal.switchAdminTab('audit_logs')">
              <i data-lucide="scroll" style="width: 18px; height: 18px;"></i>
              <span>Audit Logs</span>
            </div>
          </div>

          <div class="sidebar-footer">
            <div class="user-profile-badge">
              <div class="user-avatar" id="admin-avatar-letter">A</div>
              <div class="user-info">
                <span class="user-name" id="admin-display-name">Admin User</span>
                <span class="user-role" id="admin-display-username">@super_admin</span>
              </div>
            </div>
            <div class="logout-btn" onclick="App.logout()" title="Logout">
              <i data-lucide="log-out" style="width: 18px; height: 18px;"></i>
            </div>
          </div>
        </aside>

        <!-- Main Body -->
        <div class="main-content">
          <header class="header">
            <div style="font-size: 18px; font-weight: 600;" id="admin-page-title">Manage School Tenants</div>
            <div class="header-actions">
              <button class="theme-toggle-btn" onclick="App.toggleTheme()">
                <i data-lucide="sun" style="width: 20px; height: 20px;"></i>
              </button>
            </div>
          </header>

          <div class="content-body" id="admin-content-body">
            <!-- Dynamic Admin Content -->
          </div>
        </div>
      </div>

      <!-- School Creator Modal -->
      <div class="modal-overlay" id="school-modal">
        <div class="modal-box" style="max-width: 580px; max-height: 90vh; overflow-y: auto;">
          <div class="modal-header">
            <h3>Register New School Tenant</h3>
          </div>
          <form onsubmit="DashboardPortal.handleCreateSchool(event)">
            <div class="form-grid-2">
              <div class="form-group">
                <label>School Name *</label>
                <input type="text" class="input-control" id="modal-school-name" required placeholder="e.g. Oakridge High School">
              </div>
              <div class="form-group">
                <label>Unique School Code *</label>
                <input type="text" class="input-control" id="modal-school-code" required placeholder="e.g. OAK-01">
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Contact Email *</label>
                <input type="email" class="input-control" id="modal-school-email" required placeholder="info@oakridge.edu">
              </div>
              <div class="form-group">
                <label>Contact Phone *</label>
                <input type="text" class="input-control" id="modal-school-phone" required placeholder="+1 (555) 901-2345">
              </div>
            </div>
            <div class="form-group">
              <label>Street Address *</label>
              <input type="text" class="input-control" id="modal-school-address" required placeholder="102 Academy Lane">
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>City *</label>
                <input type="text" class="input-control" id="modal-school-city" required placeholder="Austin">
              </div>
              <div class="form-group">
                <label>Country *</label>
                <input type="text" class="input-control" id="modal-school-country" required placeholder="United States">
              </div>
            </div>
            <div class="form-group">
              <label>Time Zone *</label>
              <select class="input-control" id="modal-school-timezone">
                <option value="America/New_York">America/New_York</option>
                <option value="UTC">UTC</option>
                <option value="Asia/Kolkata">Asia/Kolkata</option>
              </select>
            </div>

            <!-- Default School Administrator Details -->
            <div style="border-top: 1px solid var(--border); margin-top: 1.5rem; padding-top: 1rem;">
              <h4 style="margin-bottom: 0.75rem; font-size: 13px; color: var(--accent); font-weight:600;">School Administrator Credentials</h4>
              <div class="form-grid-2">
                <div class="form-group">
                  <label>Admin Full Name *</label>
                  <input type="text" class="input-control" id="modal-school-admin-name" required placeholder="e.g. Sarah Jenkins">
                </div>
                <div class="form-group">
                  <label>Admin Username *</label>
                  <input type="text" class="input-control" id="modal-school-admin-username" required placeholder="sarah_admin">
                </div>
              </div>
              <div class="form-grid-2">
                <div class="form-group">
                  <label>Admin Email *</label>
                  <input type="email" class="input-control" id="modal-school-admin-email" required placeholder="admin@oakridge.edu">
                </div>
                <div class="form-group">
                  <label>Admin Password *</label>
                  <input type="password" class="input-control" id="modal-school-admin-password" required placeholder="••••••••">
                </div>
              </div>
            </div>

            <!-- Subscription & Modules -->
            <div style="border-top: 1px solid var(--border); margin-top: 1.25rem; padding-top: 1rem;">
              <h4 style="margin-bottom: 0.75rem; font-size: 13px; color: var(--accent); font-weight:600;">Plan & Module Features</h4>
              <div class="form-grid-2">
                <div class="form-group">
                  <label>Subscription Plan Tier *</label>
                  <select class="input-control" id="modal-school-tier">
                    <option value="BASIC">Basic Tier ($49/mo)</option>
                    <option value="GROWTH">Growth Tier ($129/mo)</option>
                    <option value="ENTERPRISE">Enterprise Premium ($349/mo)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Enabled SaaS Modules</label>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; margin-top: 6px;">
                    <label><input type="checkbox" id="feat-attendance" checked> Attendance</label>
                    <label><input type="checkbox" id="feat-fees" checked> Fees Gateway</label>
                    <label><input type="checkbox" id="feat-exams" checked> Exams</label>
                    <label><input type="checkbox" id="feat-library" checked> Library</label>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" onclick="DashboardPortal.toggleSchoolModal(false)">Cancel</button>
              <button type="submit" class="btn btn-primary">Register School</button>
            </div>
          </form>
        </div>
      </div>

      <!-- School Config Edit Modal -->
      <div class="modal-overlay" id="school-config-modal">
        <div class="modal-box">
          <div class="modal-header">
            <h3>Configure School Settings</h3>
          </div>
          <form onsubmit="DashboardPortal.handleSaveSchoolConfig(event)">
            <input type="hidden" id="modal-config-school-id">
            <div class="form-group">
              <label>Subscription Plan Tier *</label>
              <select class="input-control" id="modal-config-school-tier">
                <option value="BASIC">Basic Tier ($49/mo)</option>
                <option value="GROWTH">Growth Tier ($129/mo)</option>
                <option value="ENTERPRISE">Enterprise Premium ($349/mo)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Modules Access</label>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top:8px;">
                <label><input type="checkbox" id="config-feat-attendance"> Attendance</label>
                <label><input type="checkbox" id="config-feat-fees"> Fees Gateway</label>
                <label><input type="checkbox" id="config-feat-exams"> Exams</label>
                <label><input type="checkbox" id="config-feat-library"> Library</label>
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" onclick="DashboardPortal.toggleSchoolConfigModal(false)">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>

      <!-- School User Creator Modal -->
      <div class="modal-overlay" id="school-user-modal">
        <div class="modal-box">
          <div class="modal-header">
            <h3>Add School Employee / User</h3>
          </div>
          <form onsubmit="DashboardPortal.handleCreateSchoolUser(event)">
            <div class="form-group">
              <label>Select School *</label>
              <select class="input-control" id="modal-user-school-id" required>
                <!-- populated dynamically -->
              </select>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Full Name *</label>
                <input type="text" class="input-control" id="modal-user-name" required placeholder="e.g. John Miller">
              </div>
              <div class="form-group">
                <label>User Role *</label>
                <select class="input-control" id="modal-user-role" required>
                  <option value="PRINCIPAL">Principal</option>
                  <option value="VICE_PRINCIPAL">Vice Principal</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="STUDENT">Student</option>
                  <option value="PARENT">Parent</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="LIBRARIAN">Librarian</option>
                  <option value="RECEPTIONIST">Receptionist</option>
                </select>
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Email Address *</label>
                <input type="email" class="input-control" id="modal-user-email" required placeholder="john@school.edu">
              </div>
              <div class="form-group">
                <label>Username *</label>
                <input type="text" class="input-control" id="modal-user-username" required placeholder="john_m">
              </div>
            </div>
            <div class="form-group">
              <label>Password *</label>
              <input type="password" class="input-control" id="modal-user-password" required placeholder="••••••••">
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" onclick="DashboardPortal.toggleSchoolUserModal(false)">Cancel</button>
              <button type="submit" class="btn btn-primary">Create User</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.updateSuperAdminHeader();
    await this.loadAdminTabContent();
    if (window.lucide) window.lucide.createIcons();
  },

  updateSuperAdminHeader() {
    if (App.state.user) {
      document.getElementById('admin-display-name').textContent = App.state.user.name;
      document.getElementById('admin-display-username').textContent = `@${App.state.user.username}`;
      document.getElementById('admin-avatar-letter').textContent = App.state.user.name.charAt(0).toUpperCase();
    }
  },

  async switchAdminTab(tab) {
    this.activeTab = tab;
    localStorage.setItem('adminActiveTab', tab);

    document.querySelectorAll('.sidebar-menu .menu-item').forEach(el => el.classList.remove('active'));
    const menuItems = Array.from(document.querySelectorAll('.sidebar-menu .menu-item'));
    const matched = menuItems.find(item => item.innerText.toLowerCase().includes(tab.toLowerCase()));
    if (matched) matched.classList.add('active');

    const titleMap = {
      schools: 'Manage School Tenants',
      users: 'Platform Users Manager',
      roles: 'Access Roles Control',
      permissions: 'Module Permissions',
      features: 'Assign Subscription Features',
      subscriptions: 'Tenant Subscriptions',
      reports: 'Platform Reports Generator',
      audit_logs: 'Super Admin Audit logs'
    };
    document.getElementById('admin-page-title').textContent = titleMap[tab] || 'Super Admin Portal';

    await this.loadAdminTabContent();
    if (window.lucide) window.lucide.createIcons();
  },

  async loadAdminTabContent() {
    const body = document.getElementById('admin-content-body');
    if (!body) return;

    body.innerHTML = `<div class="text-center" style="padding: 50px 0;"><div class="stat-value" style="font-size: 18px; color: var(--text-secondary)">Loading content...</div></div>`;

    switch (this.activeTab) {
      case 'schools':
        const schools = await App.apiCall('/api/admin/schools');
        this.schools = schools;

        let schoolRows = '';
        if (schools && schools.length > 0) {
          schools.forEach(school => {
            const isActive = school.status === 'ACTIVE';
            schoolRows += `
              <tr>
                <td><strong>${school.schoolName}</strong></td>
                <td><code>${school.schoolCode}</code></td>
                <td><span class="btn-status status-active" style="padding: 2px 8px;">${school.subscriptionTier}</span></td>
                <td><small style="color:var(--text-secondary);">${school.features}</small></td>
                <td>${school.city}, ${school.country}</td>
                <td>
                  <span class="btn-status ${isActive ? 'status-active' : 'status-inactive'}">
                    ${school.status}
                  </span>
                </td>
                <td>
                  <div class="flex gap-1">
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="DashboardPortal.openSchoolConfigModal('${school.id}')">
                      Config
                    </button>
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="DashboardPortal.toggleAdminSchoolStatus('${school.id}', '${school.status}')">
                      ${isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            `;
          });
        } else {
          schoolRows = `<tr><td colspan="7" class="text-center" style="color: var(--text-muted); padding: 2rem;">You have not registered any school tenants yet.</td></tr>`;
        }

        body.innerHTML = `
          <div class="table-container">
            <div class="table-header-bar">
              <span class="table-header-title">Registered Schools</span>
              <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;" onclick="DashboardPortal.toggleSchoolModal(true)">
                <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
                <span>Register School</span>
              </button>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>School Name</th>
                  <th>School Code</th>
                  <th>Tier</th>
                  <th>Enabled Modules</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${schoolRows}
              </tbody>
            </table>
          </div>
        `;
        break;

      case 'users':
        const users = await App.apiCall('/api/admin/users');
        
        // Also fetch schools list for dropdown prefill
        const schoolsList = await App.apiCall('/api/admin/schools');
        this.schools = schoolsList;

        let userRows = '';
        if (users && users.length > 0) {
          users.forEach(user => {
            userRows += `
              <tr>
                <td><strong>${user.name}</strong></td>
                <td>@${user.username}</td>
                <td>${user.school ? `${user.school.schoolName} (<code>${user.school.schoolCode}</code>)` : 'Unknown'}</td>
                <td><span class="btn-status status-active" style="text-transform: capitalize; padding: 2px 6px;">${user.role.toLowerCase().replace('_', ' ')}</span></td>
                <td>
                  <span class="btn-status ${user.active ? 'status-active' : 'status-inactive'}">
                    ${user.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td>
                  <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 11px;" onclick="DashboardPortal.toggleSchoolUserStatus('${user.id}', ${user.active})">
                    ${user.active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            `;
          });
        } else {
          userRows = `<tr><td colspan="6" class="text-center" style="color: var(--text-muted); padding: 2rem;">No school users found. Register a school to create the default admin, or add employees.</td></tr>`;
        }

        body.innerHTML = `
          <div class="table-container">
            <div class="table-header-bar">
              <span class="table-header-title">SaaS Tenant Users</span>
              <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;" onclick="DashboardPortal.openSchoolUserModal()" ${!schoolsList || schoolsList.length === 0 ? 'disabled' : ''}>
                <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
                <span>Add School User</span>
              </button>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>School Tenant</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${userRows}
              </tbody>
            </table>
          </div>
        `;
        break;

      case 'roles':
        body.innerHTML = `
          <div class="maintenance-card card-glass">
            <h3>SaaS User Roles Template</h3>
            <p>Access controls are automatically provisioned. Standard roles supported:</p>
            <ul style="margin-left: 20px; color: var(--text-secondary); display: grid; gap: 6px; margin-top: 10px;">
              <li><strong>School Admin:</strong> Manages school records, configurations.</li>
              <li><strong>Principal / Vice Principal:</strong> Academic control, dashboard reviews.</li>
              <li><strong>Teacher:</strong> Marks student attendance, exam scores.</li>
              <li><strong>Student / Parent:</strong> View grades, pay fees, track libraries.</li>
              <li><strong>Support Roles:</strong> Accountant, Librarian, Receptionist.</li>
            </ul>
          </div>
        `;
        break;

      case 'permissions':
        body.innerHTML = `
          <div class="maintenance-card card-glass">
            <h3>Module Level Permissions</h3>
            <p>Permissions are linked to system roles and automatically isolated per school tenant.</p>
          </div>
        `;
        break;

      case 'features':
        body.innerHTML = `
          <div class="maintenance-card card-glass">
            <h3>Global SaaS Modules assigned to your Schools</h3>
            <p>Modules available on your subscription tiers.</p>
          </div>
        `;
        break;

      case 'subscriptions':
        body.innerHTML = `
          <div class="maintenance-card card-glass">
            <h3>Subscriptions & Billing</h3>
            <p>Configure subscription plans for your schools.</p>
          </div>
        `;
        break;

      case 'reports':
        body.innerHTML = `
          <div class="maintenance-card card-glass">
            <h3>Analytical Reports Dashboard</h3>
            <p>Export attendance reports, exam scores, and fee statements.</p>
          </div>
        `;
        break;

      case 'audit_logs':
        const logs = await App.apiCall('/api/admin/audit-logs');
        let rows = '';
        if (logs && logs.length > 0) {
          logs.forEach(log => {
            rows += `
              <tr>
                <td>${new Date(log.createdAt).toLocaleString()}</td>
                <td><code>${log.action}</code></td>
                <td>${log.details}</td>
                <td><code style="font-size:11px;">${log.ipAddress || '127.0.0.1'}</code></td>
              </tr>
            `;
          });
        } else {
          rows = `<tr><td colspan="4" class="text-center" style="color: var(--text-muted); padding: 2rem;">No audit logs registered.</td></tr>`;
        }

        body.innerHTML = `
          <div class="table-container">
            <div class="table-header-bar">
              <span class="table-header-title">Action Event Logs</span>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Details</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        `;
        break;
    }
  },

  // Super Admin Event Actions
  toggleSchoolModal(show) {
    const modal = document.getElementById('school-modal');
    if (!modal) return;
    if (show) modal.classList.add('active');
    else modal.classList.remove('active');
  },

  async handleCreateSchool(event) {
    event.preventDefault();
    const schoolName = document.getElementById('modal-school-name').value;
    const schoolCode = document.getElementById('modal-school-code').value;
    const email = document.getElementById('modal-school-email').value;
    const phone = document.getElementById('modal-school-phone').value;
    const address = document.getElementById('modal-school-address').value;
    const city = document.getElementById('modal-school-city').value;
    const country = document.getElementById('modal-school-country').value;
    const timezone = document.getElementById('modal-school-timezone').value;

    const adminName = document.getElementById('modal-school-admin-name').value;
    const adminUsername = document.getElementById('modal-school-admin-username').value;
    const adminEmail = document.getElementById('modal-school-admin-email').value;
    const adminPassword = document.getElementById('modal-school-admin-password').value;
    const subscriptionTier = document.getElementById('modal-school-tier').value;

    const features = [];
    if (document.getElementById('feat-attendance').checked) features.push('attendance');
    if (document.getElementById('feat-fees').checked) features.push('fees');
    if (document.getElementById('feat-exams').checked) features.push('exams');
    if (document.getElementById('feat-library').checked) features.push('library');

    const res = await App.apiCall('/api/admin/schools', {
      method: 'POST',
      body: JSON.stringify({ 
        schoolName, schoolCode, email, phone, address, city, country, timezone,
        adminName, adminUsername, adminEmail, adminPassword, subscriptionTier, features
      })
    });

    if (res.error) {
      App.showToast(res.message, 'error');
    } else {
      App.showToast('School tenant & administrator successfully registered!', 'success');
      this.toggleSchoolModal(false);
      await this.loadAdminTabContent();
    }
  },

  async toggleAdminSchoolStatus(id, currentStatus) {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const res = await App.apiCall(`/api/admin/schools/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: nextStatus })
    });

    if (res.error) {
      App.showToast(res.message, 'error');
    } else {
      App.showToast(`School successfully ${nextStatus === 'ACTIVE' ? 'activated' : 'deactivated'}.`, 'success');
      await this.loadAdminTabContent();
    }
  },

  openSchoolConfigModal(schoolId) {
    const school = this.schools.find(s => s.id === schoolId);
    if (!school) return;

    document.getElementById('modal-config-school-id').value = school.id;
    document.getElementById('modal-config-school-tier').value = school.subscriptionTier;

    const feats = school.features.split(',');
    document.getElementById('config-feat-attendance').checked = feats.includes('attendance');
    document.getElementById('config-feat-fees').checked = feats.includes('fees');
    document.getElementById('config-feat-exams').checked = feats.includes('exams');
    document.getElementById('config-feat-library').checked = feats.includes('library');

    this.toggleSchoolConfigModal(true);
  },

  toggleSchoolConfigModal(show) {
    const modal = document.getElementById('school-config-modal');
    if (!modal) return;
    if (show) modal.classList.add('active');
    else modal.classList.remove('active');
  },

  async handleSaveSchoolConfig(event) {
    event.preventDefault();
    const schoolId = document.getElementById('modal-config-school-id').value;
    const subscriptionTier = document.getElementById('modal-config-school-tier').value;

    const features = [];
    if (document.getElementById('config-feat-attendance').checked) features.push('attendance');
    if (document.getElementById('config-feat-fees').checked) features.push('fees');
    if (document.getElementById('config-feat-exams').checked) features.push('exams');
    if (document.getElementById('config-feat-library').checked) features.push('library');

    const res = await App.apiCall(`/api/admin/schools/${schoolId}/config`, {
      method: 'PUT',
      body: JSON.stringify({ subscriptionTier, features })
    });

    if (res.error) {
      App.showToast(res.message, 'error');
    } else {
      App.showToast('School subscription and modules configured!', 'success');
      this.toggleSchoolConfigModal(false);
      await this.loadAdminTabContent();
    }
  },

  openSchoolUserModal() {
    const select = document.getElementById('modal-user-school-id');
    if (!select) return;

    select.innerHTML = this.schools.map(s => `<option value="${s.id}">${s.schoolName} (${s.schoolCode})</option>`).join('');
    this.toggleSchoolUserModal(true);
  },

  toggleSchoolUserModal(show) {
    const modal = document.getElementById('school-user-modal');
    if (!modal) return;
    if (show) modal.classList.add('active');
    else modal.classList.remove('active');
  },

  async handleCreateSchoolUser(event) {
    event.preventDefault();
    const schoolId = document.getElementById('modal-user-school-id').value;
    const name = document.getElementById('modal-user-name').value;
    const role = document.getElementById('modal-user-role').value;
    const email = document.getElementById('modal-user-email').value;
    const username = document.getElementById('modal-user-username').value;
    const password = document.getElementById('modal-user-password').value;

    const res = await App.apiCall('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ schoolId, name, email, username, password, role })
    });

    if (res.error) {
      App.showToast(res.message, 'error');
    } else {
      App.showToast(`School user "${name}" registered successfully!`, 'success');
      this.toggleSchoolUserModal(false);
      await this.loadAdminTabContent();
    }
  },

  async toggleSchoolUserStatus(id, currentActive) {
    const res = await App.apiCall(`/api/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ active: !currentActive })
    });

    if (res.error) {
      App.showToast(res.message, 'error');
    } else {
      App.showToast(`School user active state toggled!`, 'success');
      await this.loadAdminTabContent();
    }
  },


  // ==========================================
  // RENDER DYNAMIC SCHOOL USER PORTAL
  // ==========================================
  async renderSchool() {
    const container = document.getElementById('view-container');
    if (!container) return;

    const user = App.state.user;
    if (!user) return;

    const role = user.schoolUserRole || 'SCHOOL_ADMIN';

    // DYNAMIC MENUS BASED ON PERMISSIONS
    const roleMenus = {
      SCHOOL_ADMIN: ['Dashboard', 'Students', 'Teachers', 'Attendance', 'Fees', 'Exams', 'Library', 'Audit Logs'],
      PRINCIPAL: ['Dashboard', 'Students', 'Teachers', 'Attendance', 'Exams'],
      TEACHER: ['Dashboard', 'Students', 'Attendance', 'Exams'],
      STUDENT: ['Dashboard', 'Exams', 'Fees', 'Library'],
      PARENT: ['Dashboard', 'Fees', 'Exams'],
      ACCOUNTANT: ['Dashboard', 'Fees'],
      LIBRARIAN: ['Dashboard', 'Library'],
      RECEPTIONIST: ['Dashboard']
    };

    const menus = roleMenus[role] || ['Dashboard'];
    this.activeTab = localStorage.getItem('schoolActiveTab') || 'Dashboard';
    if (!menus.includes(this.activeTab)) {
      this.activeTab = menus[0];
    }

    let menuHtml = '';
    menus.forEach(menu => {
      let icon = 'folder';
      if (menu.includes('Dashboard')) icon = 'layout-dashboard';
      else if (menu.includes('Student')) icon = 'users';
      else if (menu.includes('Teacher')) icon = 'user-check';
      else if (menu.includes('Attendance')) icon = 'calendar';
      else if (menu.includes('Fees')) icon = 'banknote';
      else if (menu.includes('Exams')) icon = 'award';
      else if (menu.includes('Library')) icon = 'book-open';
      else if (menu.includes('Audit')) icon = 'file-text';

      menuHtml += `
        <div class="menu-item ${this.activeTab === menu ? 'active' : ''}" onclick="DashboardPortal.switchSchoolTab('${menu}')">
          <i data-lucide="${icon}" style="width: 18px; height: 18px;"></i>
          <span>${menu}</span>
        </div>
      `;
    });

    container.innerHTML = `
      <div class="dashboard-layout">
        <!-- Sidebar -->
        <aside class="sidebar">
          <div class="sidebar-header">
            <div class="sidebar-logo">S</div>
            <div>
              <div class="sidebar-title">${user.schoolName || 'School Panel'}</div>
              <div class="user-role" style="color: var(--accent); font-weight:600;">School Portal</div>
            </div>
          </div>

          <div class="sidebar-menu">
            <div class="menu-section-label">Academic Menus</div>
            ${menuHtml}
          </div>

          <div class="sidebar-footer">
            <div class="user-profile-badge">
              <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
              <div class="user-info">
                <span class="user-name">${user.name}</span>
                <span class="user-role">${role.replace('_', ' ')}</span>
              </div>
            </div>
            <div class="logout-btn" onclick="App.logout()" title="Logout">
              <i data-lucide="log-out" style="width: 18px; height: 18px;"></i>
            </div>
          </div>
        </aside>

        <!-- Main Body -->
        <div class="main-content">
          <header class="header">
            <div style="font-size: 18px; font-weight: 600;" id="school-page-title">${this.activeTab}</div>
            <div class="header-actions">
              <button class="theme-toggle-btn" onclick="App.toggleTheme()">
                <i data-lucide="sun" style="width: 20px; height: 20px;"></i>
              </button>
            </div>
          </header>

          <div class="content-body" id="school-content-body">
            <!-- Dynamic School Body -->
          </div>
        </div>
      </div>

      <!-- Student Creator Modal -->
      <div class="modal-overlay" id="student-modal">
        <div class="modal-box" style="max-width: 580px; max-height: 90vh; overflow-y: auto;">
          <div class="modal-header">
            <h3>Add New Student</h3>
          </div>
          <form onsubmit="DashboardPortal.handleCreateStudent(event)">
            <div class="form-group">
              <label>Full Name *</label>
              <input type="text" class="input-control" id="modal-stud-name" required placeholder="e.g. Bobby Axelrod">
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Roll Number *</label>
                <input type="text" class="input-control" id="modal-stud-roll" required placeholder="e.g. ROLL-101">
              </div>
              <div class="form-group">
                <label>Grade Level *</label>
                <input type="text" class="input-control" id="modal-stud-grade" required placeholder="e.g. Grade 10">
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Section *</label>
                <input type="text" class="input-control" id="modal-stud-section" required placeholder="e.g. Section A">
              </div>
              <div class="form-group">
                <label>Parent/Guardian Name</label>
                <input type="text" class="input-control" id="modal-stud-parent" placeholder="e.g. Charles Axelrod">
              </div>
            </div>
            <div class="form-group">
              <label>Parent Contact Phone</label>
              <input type="text" class="input-control" id="modal-stud-parent-phone" placeholder="+1 (555) 765-4321">
            </div>
            <div style="border-top: 1px solid var(--border); margin-top: 1rem; padding-top: 1rem;">
              <h4 style="margin-bottom:0.75rem; font-size:12px; color:var(--accent); font-weight:600;">Student Account Access</h4>
              <div class="form-grid-2">
                <div class="form-group">
                  <label>Username *</label>
                  <input type="text" class="input-control" id="modal-stud-username" required placeholder="bobby_a">
                </div>
                <div class="form-group">
                  <label>Email *</label>
                  <input type="email" class="input-control" id="modal-stud-email" required placeholder="bobby@school.edu">
                </div>
              </div>
              <div class="form-group">
                <label>Password *</label>
                <input type="password" class="input-control" id="modal-stud-password" required placeholder="••••••••">
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" onclick="DashboardPortal.toggleStudentModal(false)">Cancel</button>
              <button type="submit" class="btn btn-primary">Add Student</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Teacher Creator Modal -->
      <div class="modal-overlay" id="teacher-modal">
        <div class="modal-box" style="max-width: 580px; max-height: 90vh; overflow-y: auto;">
          <div class="modal-header">
            <h3>Add New Teacher</h3>
          </div>
          <form onsubmit="DashboardPortal.handleCreateTeacher(event)">
            <div class="form-group">
              <label>Full Name *</label>
              <input type="text" class="input-control" id="modal-teach-name" required placeholder="e.g. Prof. Charles Xavier">
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Employee ID *</label>
                <input type="text" class="input-control" id="modal-teach-empid" required placeholder="e.g. EMP-202">
              </div>
              <div class="form-group">
                <label>Primary Subject *</label>
                <input type="text" class="input-control" id="modal-teach-subject" required placeholder="e.g. Physics">
              </div>
            </div>
            <div class="form-group">
              <label>Qualification / Degree</label>
              <input type="text" class="input-control" id="modal-teach-qual" placeholder="e.g. Ph.D. in Astrophysics">
            </div>
            <div style="border-top: 1px solid var(--border); margin-top: 1rem; padding-top: 1rem;">
              <h4 style="margin-bottom:0.75rem; font-size:12px; color:var(--accent); font-weight:600;">Teacher Account Access</h4>
              <div class="form-grid-2">
                <div class="form-group">
                  <label>Username *</label>
                  <input type="text" class="input-control" id="modal-teach-username" required placeholder="charles_x">
                </div>
                <div class="form-group">
                  <label>Email *</label>
                  <input type="email" class="input-control" id="modal-teach-email" required placeholder="charles@school.edu">
                </div>
              </div>
              <div class="form-group">
                <label>Password *</label>
                <input type="password" class="input-control" id="modal-teach-password" required placeholder="••••••••">
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" onclick="DashboardPortal.toggleTeacherModal(false)">Cancel</button>
              <button type="submit" class="btn btn-primary">Add Teacher</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Invoice Creator Modal -->
      <div class="modal-overlay" id="invoice-modal">
        <div class="modal-box">
          <div class="modal-header">
            <h3>Issue Student Fee Invoice</h3>
          </div>
          <form onsubmit="DashboardPortal.handleCreateInvoice(event)">
            <div class="form-group">
              <label>Select Student *</label>
              <select class="input-control" id="modal-inv-stud" required></select>
            </div>
            <div class="form-group">
              <label>Billing Amount ($) *</label>
              <input type="number" step="0.01" class="input-control" id="modal-inv-amount" required placeholder="e.g. 450.00">
            </div>
            <div class="form-group">
              <label>Due Date *</label>
              <input type="date" class="input-control" id="modal-inv-duedate" required>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" onclick="DashboardPortal.toggleInvoiceModal(false)">Cancel</button>
              <button type="submit" class="btn btn-primary">Issue Invoice</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Exam Creator Modal -->
      <div class="modal-overlay" id="exam-modal">
        <div class="modal-box">
          <div class="modal-header">
            <h3>Schedule Assessment / Exam</h3>
          </div>
          <form onsubmit="DashboardPortal.handleCreateExam(event)">
            <div class="form-group">
              <label>Exam Name *</label>
              <input type="text" class="input-control" id="modal-exam-name" required placeholder="e.g. Midterm Examination">
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Subject *</label>
                <input type="text" class="input-control" id="modal-exam-subject" required placeholder="e.g. Algebra">
              </div>
              <div class="form-group">
                <label>Max Score (Marks) *</label>
                <input type="number" class="input-control" id="modal-exam-max" required placeholder="100">
              </div>
            </div>
            <div class="form-group">
              <label>Exam Date *</label>
              <input type="date" class="input-control" id="modal-exam-date" required>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" onclick="DashboardPortal.toggleExamModal(false)">Cancel</button>
              <button type="submit" class="btn btn-primary">Schedule Exam</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Marks Posting Modal -->
      <div class="modal-overlay" id="marks-modal">
        <div class="modal-box">
          <div class="modal-header">
            <h3 id="marks-modal-title">Post Student Score</h3>
          </div>
          <form onsubmit="DashboardPortal.handlePostScore(event)">
            <input type="hidden" id="modal-score-exam-id">
            <div class="form-group">
              <label>Select Student *</label>
              <select class="input-control" id="modal-score-stud" required></select>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Marks Obtained *</label>
                <input type="number" step="0.1" class="input-control" id="modal-score-marks" required placeholder="e.g. 85.5">
              </div>
              <div class="form-group">
                <label>Grade Indicator</label>
                <input type="text" class="input-control" id="modal-score-grade" placeholder="e.g. A+">
              </div>
            </div>
            <div class="form-group">
              <label>Remarks / Feedback</label>
              <input type="text" class="input-control" id="modal-score-remarks" placeholder="Excellent performance">
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" onclick="DashboardPortal.toggleMarksModal(false)">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Score</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Book Catalog Modal -->
      <div class="modal-overlay" id="book-modal">
        <div class="modal-box">
          <div class="modal-header">
            <h3>Add Book to Library Catalog</h3>
          </div>
          <form onsubmit="DashboardPortal.handleCreateBook(event)">
            <div class="form-group">
              <label>Book Title *</label>
              <input type="text" class="input-control" id="modal-book-title" required placeholder="e.g. Introduction to Algorithms">
            </div>
            <div class="form-group">
              <label>Author Name *</label>
              <input type="text" class="input-control" id="modal-book-author" required placeholder="e.g. Thomas H. Cormen">
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>ISBN Number</label>
                <input type="text" class="input-control" id="modal-book-isbn" placeholder="978-0262033848">
              </div>
              <div class="form-group">
                <label>Total Copy Count *</label>
                <input type="number" class="input-control" id="modal-book-qty" required placeholder="5">
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" onclick="DashboardPortal.toggleBookModal(false)">Cancel</button>
              <button type="submit" class="btn btn-primary">Catalog Book</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Checkout Library Modal -->
      <div class="modal-overlay" id="checkout-modal">
        <div class="modal-box">
          <div class="modal-header">
            <h3>Issue Library Book</h3>
          </div>
          <form onsubmit="DashboardPortal.handleIssueBook(event)">
            <input type="hidden" id="modal-issue-book-id">
            <div class="form-group">
              <label>Book Selected</label>
              <input type="text" class="input-control" id="modal-issue-book-title" disabled>
            </div>
            <div class="form-group">
              <label>Select Student Borrower *</label>
              <select class="input-control" id="modal-issue-stud" required></select>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" onclick="DashboardPortal.toggleCheckoutModal(false)">Cancel</button>
              <button type="submit" class="btn btn-primary">Check Out</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Pay Online Simulator Modal -->
      <div class="modal-overlay" id="pay-online-modal">
        <div class="modal-box">
          <div class="modal-header">
            <h3>Pay Invoice Online (Stripe Sandbox)</h3>
          </div>
          <form onsubmit="DashboardPortal.handlePayOnline(event)">
            <input type="hidden" id="modal-pay-invoice-id">
            <div class="form-group">
              <label>Amount Due</label>
              <input type="text" class="input-control" id="modal-pay-amount" disabled>
            </div>
            <div class="form-group">
              <label>Cardholder Name *</label>
              <input type="text" class="input-control" id="modal-pay-cardname" required placeholder="e.g. Harry Potter">
            </div>
            <div class="form-group">
              <label>Card Number *</label>
              <input type="text" class="input-control" required placeholder="4242 4242 4242 4242" value="4242 4242 4242 4242">
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Expiration *</label>
                <input type="text" class="input-control" required placeholder="MM/YY" value="12/29">
              </div>
              <div class="form-group">
                <label>CVC *</label>
                <input type="text" class="input-control" required placeholder="123" value="123">
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" onclick="DashboardPortal.togglePayOnlineModal(false)">Cancel</button>
              <button type="submit" class="btn btn-primary">Process Payment</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.loadSchoolTabContent();
    if (window.lucide) window.lucide.createIcons();
  },

  switchSchoolTab(tab) {
    this.activeTab = tab;
    localStorage.setItem('schoolActiveTab', tab);
    this.renderSchool();
  },

  async loadSchoolTabContent() {
    const body = document.getElementById('school-content-body');
    if (!body) return;

    const user = App.state.user;
    const userRole = user.schoolUserRole || 'SCHOOL_ADMIN';
    const isWriteAllowed = ['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'].includes(userRole);

    body.innerHTML = `<div class="text-center" style="padding: 50px 0;"><div class="stat-value" style="font-size: 18px; color: var(--text-secondary)">Loading modules...</div></div>`;

    switch (this.activeTab) {
      case 'Dashboard':
        const stds = await App.apiCall('/api/school/students');
        const tchs = await App.apiCall('/api/school/teachers');
        const bks = await App.apiCall('/api/school/books');
        const fees = await App.apiCall('/api/school/fees');
        const unpaidCount = Array.isArray(fees) ? fees.filter(f => f.status === 'UNPAID').length : 0;

        body.innerHTML = `
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-details">
                <h3>Total Students</h3>
                <div class="stat-value">${Array.isArray(stds) ? stds.length : 0}</div>
              </div>
              <div class="stat-icon-wrapper icon-purple">
                <i data-lucide="users"></i>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-details">
                <h3>Total Teachers</h3>
                <div class="stat-value">${Array.isArray(tchs) ? tchs.length : 0}</div>
              </div>
              <div class="stat-icon-wrapper icon-pink">
                <i data-lucide="user-check"></i>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-details">
                <h3>Books Catalogued</h3>
                <div class="stat-value">${Array.isArray(bks) ? bks.length : 0}</div>
              </div>
              <div class="stat-icon-wrapper icon-green">
                <i data-lucide="book-open"></i>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-details">
                <h3>Unpaid Invoices</h3>
                <div class="stat-value">${unpaidCount}</div>
              </div>
              <div class="stat-icon-wrapper icon-yellow">
                <i data-lucide="credit-card"></i>
              </div>
            </div>
          </div>

          <div class="card-glass">
            <h3>Welcome to ${user.schoolName}</h3>
            <p style="margin-top: 8px; color: var(--text-secondary);">Manage students, teachers, mark attendance, catalog library books, score exams, and collect student fees from this portal.</p>
            <div style="margin-top: 1.5rem; display: flex; gap: 10px;">
              ${['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'].includes(userRole) ? `
                <button class="btn btn-primary" onclick="DashboardPortal.switchSchoolTab('Students')">Register Student</button>
              ` : ''}
              <button class="btn btn-secondary" onclick="DashboardPortal.switchSchoolTab('Library')">View Library Catalogue</button>
            </div>
          </div>
        `;
        break;

      case 'Students':
        const students = await App.apiCall('/api/school/students');
        let studRows = '';

        if (Array.isArray(students) && students.length > 0) {
          students.forEach(s => {
            const prof = s.studentProfile || {};
            studRows += `
              <tr>
                <td><strong>${s.name}</strong></td>
                <td>@${s.username}</td>
                <td><code>${prof.rollNumber || 'N/A'}</code></td>
                <td>${prof.grade || 'N/A'} - ${prof.section || 'N/A'}</td>
                <td>${prof.parentName || 'N/A'} (${prof.parentPhone || 'N/A'})</td>
                <td>
                  <span class="btn-status status-active">${s.active ? 'ACTIVE' : 'INACTIVE'}</span>
                </td>
              </tr>
            `;
          });
        } else {
          studRows = `<tr><td colspan="6" class="text-center" style="color: var(--text-muted); padding: 2rem;">No students registered under this tenant.</td></tr>`;
        }

        body.innerHTML = `
          <div class="table-container">
            <div class="table-header-bar">
              <span class="table-header-title">Registered Students</span>
              <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;" onclick="DashboardPortal.toggleStudentModal(true)" ${!['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'].includes(userRole) ? 'disabled' : ''}>
                <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
                <span>Add Student</span>
              </button>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Roll Number</th>
                  <th>Class (Grade & Section)</th>
                  <th>Parent Info</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${studRows}
              </tbody>
            </table>
          </div>
        `;
        break;

      case 'Teachers':
        const teachers = await App.apiCall('/api/school/teachers');
        let teachRows = '';

        if (Array.isArray(teachers) && teachers.length > 0) {
          teachers.forEach(t => {
            const prof = t.teacherProfile || {};
            teachRows += `
              <tr>
                <td><strong>${t.name}</strong></td>
                <td>@${t.username}</td>
                <td><code>${prof.employeeId || 'N/A'}</code></td>
                <td><span class="btn-status status-active" style="padding: 2px 8px;">${prof.subject || 'N/A'}</span></td>
                <td>${prof.qualification || 'N/A'}</td>
                <td>
                  <span class="btn-status status-active">${t.active ? 'ACTIVE' : 'INACTIVE'}</span>
                </td>
              </tr>
            `;
          });
        } else {
          teachRows = `<tr><td colspan="6" class="text-center" style="color: var(--text-muted); padding: 2rem;">No teachers registered under this tenant.</td></tr>`;
        }

        body.innerHTML = `
          <div class="table-container">
            <div class="table-header-bar">
              <span class="table-header-title">Faculty Members</span>
              <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;" onclick="DashboardPortal.toggleTeacherModal(true)" ${userRole !== 'SCHOOL_ADMIN' ? 'disabled' : ''}>
                <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
                <span>Add Teacher</span>
              </button>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Employee ID</th>
                  <th>Subject</th>
                  <th>Qualification</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${teachRows}
              </tbody>
            </table>
          </div>
        `;
        break;

      case 'Attendance':
        const attLogs = await App.apiCall('/api/school/attendance');
        const studList = await App.apiCall('/api/school/students');
        
        let attRows = '';
        if (Array.isArray(attLogs) && attLogs.length > 0) {
          attLogs.forEach(log => {
            const labelMap = {
              PRESENT: 'status-active',
              ABSENT: 'status-inactive',
              LATE: 'status-inactive',
              EXCUSED: 'status-active'
            };
            if (['STUDENT', 'PARENT'].includes(userRole)) {
              attRows += `
                <tr>
                  <td>${log.date}</td>
                  <td>
                    <span class="btn-status ${labelMap[log.status] || ''}">${log.status}</span>
                  </td>
                  <td>${log.remarks || ''}</td>
                </tr>
              `;
            } else {
              attRows += `
                <tr>
                  <td>${log.date}</td>
                  <td><strong>${log.student ? log.student.name : 'Unknown'}</strong></td>
                  <td>@${log.student ? log.student.username : ''}</td>
                  <td>
                    <span class="btn-status ${labelMap[log.status] || ''}">${log.status}</span>
                  </td>
                  <td>${log.remarks || ''}</td>
                </tr>
              `;
            }
          });
        } else {
          attRows = `<tr><td colspan="${['STUDENT', 'PARENT'].includes(userRole) ? 3 : 5}" class="text-center" style="color: var(--text-muted); padding: 2rem;">No attendance records found.</td></tr>`;
        }

        if (['STUDENT', 'PARENT'].includes(userRole)) {
          body.innerHTML = `
            <div class="table-container">
              <div class="table-header-bar">
                <span class="table-header-title">My Attendance Record</span>
              </div>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  ${attRows}
                </tbody>
              </table>
            </div>
          `;
        } else {
          let selectOptions = '';
          if (Array.isArray(studList)) {
            selectOptions = studList.map(s => `<option value="${s.id}">${s.name} (@${s.username})</option>`).join('');
          }

          body.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem;">
              <!-- Mark Attendance Form -->
              <div class="card-glass" style="padding: 1.5rem; max-height: 480px;">
                <h3 style="margin-bottom: 1.25rem;">Mark Attendance</h3>
                <form onsubmit="DashboardPortal.handleMarkAttendance(event)">
                  <div class="form-group">
                    <label>Select Student *</label>
                    <select class="input-control" id="att-student-id" required ${!selectOptions ? 'disabled' : ''}>
                      ${selectOptions || '<option value="">No students available</option>'}
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Date *</label>
                    <input type="date" class="input-control" id="att-date" value="${new Date().toISOString().split('T')[0]}" required>
                  </div>
                  <div class="form-group">
                    <label>Attendance Status *</label>
                    <select class="input-control" id="att-status" required>
                      <option value="PRESENT">Present</option>
                      <option value="ABSENT">Absent</option>
                      <option value="LATE">Late</option>
                      <option value="EXCUSED">Excused</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Remarks</label>
                    <input type="text" class="input-control" id="att-remarks" placeholder="Optional notes">
                  </div>
                  <button type="submit" class="btn btn-primary w-full" ${!isWriteAllowed || !selectOptions ? 'disabled' : ''}>Save Attendance</button>
                </form>
              </div>

              <!-- Logs list -->
              <div class="table-container" style="margin-bottom: 0;">
                <div class="table-header-bar">
                  <span class="table-header-title">Attendance Logs</span>
                </div>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Student Name</th>
                      <th>Username</th>
                      <th>Status</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${attRows}
                  </tbody>
                </table>
              </div>
            </div>
          `;
        }
        break;

      case 'Fees':
        const invoices = await App.apiCall('/api/school/fees');
        let feeRows = '';

        if (Array.isArray(invoices) && invoices.length > 0) {
          invoices.forEach(inv => {
            const isPaid = inv.status === 'PAID';
            if (userRole === 'STUDENT') {
              const actionBtn = isPaid ? `
                <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="DashboardPortal.downloadReceipt('${inv.id}', '${user.name}', ${inv.amount}, '${inv.paymentDate}')">
                  Download Receipt
                </button>
              ` : `
                <button class="btn btn-primary" style="padding: 4px 8px; font-size: 11px;" onclick="DashboardPortal.openPayOnlineModal('${inv.id}', ${inv.amount})">
                  Pay Online
                </button>
              `;

              feeRows += `
                <tr>
                  <td><code>#${inv.id.substring(0, 8)}</code></td>
                  <td>$${inv.amount.toFixed(2)}</td>
                  <td>${inv.dueDate}</td>
                  <td>
                    <span class="btn-status ${isPaid ? 'status-active' : 'status-inactive'}">${inv.status}</span>
                  </td>
                  <td>${inv.paymentDate || 'N/A'} ${inv.paymentMethod ? `(${inv.paymentMethod})` : ''}</td>
                  <td>${actionBtn}</td>
                </tr>
              `;
            } else {
              feeRows += `
                <tr>
                  <td><code>#${inv.id.substring(0, 8)}</code></td>
                  <td><strong>${inv.student ? inv.student.name : 'Unknown'}</strong></td>
                  <td>$${inv.amount.toFixed(2)}</td>
                  <td>${inv.dueDate}</td>
                  <td>
                    <span class="btn-status ${isPaid ? 'status-active' : 'status-inactive'}">${inv.status}</span>
                  </td>
                  <td>${inv.paymentDate || 'N/A'} ${inv.paymentMethod ? `(${inv.paymentMethod})` : ''}</td>
                  <td>
                    <button class="btn btn-primary" style="padding: 4px 8px; font-size: 11px;" onclick="DashboardPortal.payInvoice('${inv.id}')" ${isPaid ? 'disabled' : ''}>
                      Record Payment
                    </button>
                  </td>
                </tr>
              `;
            }
          });
        } else {
          feeRows = `<tr><td colspan="${userRole === 'STUDENT' ? 6 : 7}" class="text-center" style="color: var(--text-muted); padding: 2rem;">No fee invoices issued.</td></tr>`;
        }

        const feeHeaderBtn = ['SCHOOL_ADMIN', 'ACCOUNTANT'].includes(userRole) ? `
          <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;" onclick="DashboardPortal.openInvoiceModal()">
            <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
            <span>Issue Invoice</span>
          </button>
        ` : '';

        const feeTableHeader = userRole === 'STUDENT' ? `
          <tr>
            <th>Invoice ID</th>
            <th>Amount</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Payment Details</th>
            <th>Action</th>
          </tr>
        ` : `
          <tr>
            <th>Invoice ID</th>
            <th>Student Borrower</th>
            <th>Amount</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Payment Details</th>
            <th>Action</th>
          </tr>
        `;

        body.innerHTML = `
          <div class="table-container">
            <div class="table-header-bar">
              <span class="table-header-title">Billing Invoices</span>
              ${feeHeaderBtn}
            </div>
            <table class="data-table">
              <thead>
                ${feeTableHeader}
              </thead>
              <tbody>
                ${feeRows}
              </tbody>
            </table>
          </div>
        `;
        break;

      case 'Exams':
        const exams = await App.apiCall('/api/school/exams');
        let examRows = '';

        if (Array.isArray(exams) && exams.length > 0) {
          exams.forEach(e => {
            if (userRole === 'STUDENT') {
              const myResult = (e.results && e.results[0]) || {};
              const scoreText = myResult.marksObtained !== undefined ? `${myResult.marksObtained} / ${e.maxMarks}` : 'N/A';
              examRows += `
                <tr>
                  <td><strong>${e.examName}</strong></td>
                  <td>${e.subject}</td>
                  <td>${e.examDate}</td>
                  <td><span class="btn-status status-active">${scoreText}</span></td>
                  <td>${myResult.grade || 'N/A'}</td>
                  <td>${myResult.remarks || 'N/A'}</td>
                </tr>
              `;
            } else {
              examRows += `
                <tr>
                  <td><strong>${e.examName}</strong></td>
                  <td>${e.subject}</td>
                  <td>Max score: ${e.maxMarks}</td>
                  <td>${e.examDate}</td>
                  <td>
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="DashboardPortal.openMarksModal('${e.id}', '${e.examName}', ${e.maxMarks})">
                      Post Grades
                    </button>
                  </td>
                </tr>
              `;
            }
          });
        } else {
          examRows = `<tr><td colspan="${userRole === 'STUDENT' ? 6 : 5}" class="text-center" style="color: var(--text-muted); padding: 2rem;">No exams scheduled.</td></tr>`;
        }

        const examHeaderBtn = ['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'].includes(userRole) ? `
          <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;" onclick="DashboardPortal.toggleExamModal(true)">
            <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
            <span>Schedule Exam</span>
          </button>
        ` : '';

        const examTableHeader = userRole === 'STUDENT' ? `
          <tr>
            <th>Exam Title</th>
            <th>Subject</th>
            <th>Exam Date</th>
            <th>My Score</th>
            <th>Grade</th>
            <th>Remarks</th>
          </tr>
        ` : `
          <tr>
            <th>Exam Title</th>
            <th>Subject</th>
            <th>Max Marks</th>
            <th>Exam Date</th>
            <th>Action</th>
          </tr>
        `;

        body.innerHTML = `
          <div class="table-container">
            <div class="table-header-bar">
              <span class="table-header-title">Scheduled Assessments</span>
              ${examHeaderBtn}
            </div>
            <table class="data-table">
              <thead>
                ${examTableHeader}
              </thead>
              <tbody>
                ${examRows}
              </tbody>
            </table>
          </div>
        `;
        break;

      case 'Library':
        const books = await App.apiCall('/api/school/books');
        const checkouts = await App.apiCall('/api/school/books/issues');

        let bookRows = '';
        if (Array.isArray(books) && books.length > 0) {
          books.forEach(b => {
            if (userRole === 'STUDENT') {
              bookRows += `
                <tr>
                  <td><strong>${b.title}</strong></td>
                  <td>${b.author}</td>
                  <td>${b.isbn || 'N/A'}</td>
                  <td>${b.available} / ${b.quantity} copies available</td>
                </tr>
              `;
            } else {
              bookRows += `
                <tr>
                  <td><strong>${b.title}</strong></td>
                  <td>${b.author}</td>
                  <td>${b.isbn || 'N/A'}</td>
                  <td>${b.available} / ${b.quantity} copies available</td>
                  <td>
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="DashboardPortal.openCheckoutModal('${b.id}', '${b.title}')" ${b.available <= 0 ? 'disabled' : ''}>
                      Check Out
                    </button>
                  </td>
                </tr>
              `;
            }
          });
        } else {
          bookRows = `<tr><td colspan="${userRole === 'STUDENT' ? 4 : 5}" class="text-center" style="color: var(--text-muted); padding: 2rem;">No books catalogued in the library.</td></tr>`;
        }

        let checkoutRows = '';
        if (Array.isArray(checkouts) && checkouts.length > 0) {
          checkouts.forEach(c => {
            const isReturned = c.status === 'RETURNED';
            if (userRole === 'STUDENT') {
              checkoutRows += `
                <tr>
                  <td><strong>${c.book ? c.book.title : 'Unknown'}</strong></td>
                  <td>${c.issueDate}</td>
                  <td>
                    <span class="btn-status ${isReturned ? 'status-active' : 'status-inactive'}">${c.status}</span>
                  </td>
                  <td>${c.returnDate || 'N/A'}</td>
                </tr>
              `;
            } else {
              checkoutRows += `
                <tr>
                  <td><strong>${c.book ? c.book.title : 'Unknown'}</strong></td>
                  <td>${c.student ? c.student.name : 'Unknown'}</td>
                  <td>${c.issueDate}</td>
                  <td>
                    <span class="btn-status ${isReturned ? 'status-active' : 'status-inactive'}">${c.status}</span>
                  </td>
                  <td>${c.returnDate || 'N/A'}</td>
                  <td>
                    <button class="btn btn-primary" style="padding: 4px 8px; font-size: 11px;" onclick="DashboardPortal.returnBook('${c.id}')" ${isReturned ? 'disabled' : ''}>
                      Return
                    </button>
                  </td>
                </tr>
              `;
            }
          });
        } else {
          checkoutRows = `<tr><td colspan="${userRole === 'STUDENT' ? 4 : 6}" class="text-center" style="color: var(--text-muted); padding: 1.5rem;">No active checkout logs.</td></tr>`;
        }

        const libHeaderBtn = ['SCHOOL_ADMIN', 'LIBRARIAN'].includes(userRole) ? `
          <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;" onclick="DashboardPortal.toggleBookModal(true)">
            <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
            <span>Add Book</span>
          </button>
        ` : '';

        const catalogHeader = userRole === 'STUDENT' ? `
          <tr>
            <th>Book Title</th>
            <th>Author</th>
            <th>ISBN</th>
            <th>Availability</th>
          </tr>
        ` : `
          <tr>
            <th>Book Title</th>
            <th>Author</th>
            <th>ISBN</th>
            <th>Availability</th>
            <th>Action</th>
          </tr>
        `;

        const checkoutHeader = userRole === 'STUDENT' ? `
          <tr>
            <th>Book Title</th>
            <th>Issue Date</th>
            <th>Status</th>
            <th>Return Date</th>
          </tr>
        ` : `
          <tr>
            <th>Book Title</th>
            <th>Borrower</th>
            <th>Issue Date</th>
            <th>Status</th>
            <th>Return Date</th>
            <th>Action</th>
          </tr>
        `;

        body.innerHTML = `
          <!-- Catalog -->
          <div class="table-container">
            <div class="table-header-bar">
              <span class="table-header-title">Library Catalogue</span>
              ${libHeaderBtn}
            </div>
            <table class="data-table">
              <thead>
                ${catalogHeader}
              </thead>
              <tbody>
                ${bookRows}
              </tbody>
            </table>
          </div>

          <!-- Checkout Logs -->
          <div class="table-container">
            <div class="table-header-bar">
              <span class="table-header-title">Active Checkout Logs</span>
            </div>
            <table class="data-table">
              <thead>
                ${checkoutHeader}
              </thead>
              <tbody>
                ${checkoutRows}
              </tbody>
            </table>
          </div>
        `;
        break;

      case 'Audit Logs':
        const logs = await App.apiCall('/api/admin/audit-logs'); // Reuse the admin logs query or custom
        let rows = '';
        if (logs && logs.length > 0) {
          logs.forEach(log => {
            rows += `
              <tr>
                <td>${new Date(log.createdAt).toLocaleString()}</td>
                <td><code>${log.action}</code></td>
                <td>${log.details}</td>
                <td><code style="font-size:11px;">${log.ipAddress || '127.0.0.1'}</code></td>
              </tr>
            `;
          });
        } else {
          rows = `<tr><td colspan="4" class="text-center" style="color: var(--text-muted); padding: 2rem;">No audit logs registered.</td></tr>`;
        }

        body.innerHTML = `
          <div class="table-container">
            <div class="table-header-bar">
              <span class="table-header-title">Action Event Logs</span>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Details</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        `;
        break;
    }
  },

  // ==========================================
  // SCHOOL PORTAL EVENT ACTIONS
  // ==========================================

  // Modals Toggles
  toggleStudentModal(show) {
    const modal = document.getElementById('student-modal');
    if (!modal) return;
    if (show) modal.classList.add('active');
    else modal.classList.remove('active');
  },

  toggleTeacherModal(show) {
    const modal = document.getElementById('teacher-modal');
    if (!modal) return;
    if (show) modal.classList.add('active');
    else modal.classList.remove('active');
  },

  toggleInvoiceModal(show) {
    const modal = document.getElementById('invoice-modal');
    if (!modal) return;
    if (show) modal.classList.add('active');
    else modal.classList.remove('active');
  },

  toggleExamModal(show) {
    const modal = document.getElementById('exam-modal');
    if (!modal) return;
    if (show) modal.classList.add('active');
    else modal.classList.remove('active');
  },

  toggleMarksModal(show) {
    const modal = document.getElementById('marks-modal');
    if (!modal) return;
    if (show) modal.classList.add('active');
    else modal.classList.remove('active');
  },

  toggleBookModal(show) {
    const modal = document.getElementById('book-modal');
    if (!modal) return;
    if (show) modal.classList.add('active');
    else modal.classList.remove('active');
  },

  toggleCheckoutModal(show) {
    const modal = document.getElementById('checkout-modal');
    if (!modal) return;
    if (show) modal.classList.add('active');
    else modal.classList.remove('active');
  },

  // Event handlers for submissions
  async handleCreateStudent(event) {
    event.preventDefault();
    const name = document.getElementById('modal-stud-name').value;
    const rollNumber = document.getElementById('modal-stud-roll').value;
    const grade = document.getElementById('modal-stud-grade').value;
    const section = document.getElementById('modal-stud-section').value;
    const parentName = document.getElementById('modal-stud-parent').value;
    const parentPhone = document.getElementById('modal-stud-parent-phone').value;
    const username = document.getElementById('modal-stud-username').value;
    const email = document.getElementById('modal-stud-email').value;
    const password = document.getElementById('modal-stud-password').value;

    const res = await App.apiCall('/api/school/students', {
      method: 'POST',
      body: JSON.stringify({ name, rollNumber, grade, section, parentName, parentPhone, username, email, password })
    });

    if (res.error) {
      App.showToast(res.message, 'error');
    } else {
      App.showToast('Student registered successfully!', 'success');
      this.toggleStudentModal(false);
      await this.loadSchoolTabContent();
    }
  },

  async handleCreateTeacher(event) {
    event.preventDefault();
    const name = document.getElementById('modal-teach-name').value;
    const employeeId = document.getElementById('modal-teach-empid').value;
    const subject = document.getElementById('modal-teach-subject').value;
    const qualification = document.getElementById('modal-teach-qual').value;
    const username = document.getElementById('modal-teach-username').value;
    const email = document.getElementById('modal-teach-email').value;
    const password = document.getElementById('modal-teach-password').value;

    const res = await App.apiCall('/api/school/teachers', {
      method: 'POST',
      body: JSON.stringify({ name, employeeId, subject, qualification, username, email, password })
    });

    if (res.error) {
      App.showToast(res.message, 'error');
    } else {
      App.showToast('Teacher registered successfully!', 'success');
      this.toggleTeacherModal(false);
      await this.loadSchoolTabContent();
    }
  },

  async handleMarkAttendance(event) {
    event.preventDefault();
    const studentId = document.getElementById('att-student-id').value;
    const date = document.getElementById('att-date').value;
    const status = document.getElementById('att-status').value;
    const remarks = document.getElementById('att-remarks').value;

    const res = await App.apiCall('/api/school/attendance', {
      method: 'POST',
      body: JSON.stringify({ studentId, date, status, remarks })
    });

    if (res.error) {
      App.showToast(res.message, 'error');
    } else {
      App.showToast('Attendance recorded!', 'success');
      await this.loadSchoolTabContent();
    }
  },

  async openInvoiceModal() {
    const studs = await App.apiCall('/api/school/students');
    const select = document.getElementById('modal-inv-stud');
    if (!select) return;

    select.innerHTML = Array.isArray(studs) ? studs.map(s => `<option value="${s.id}">${s.name} (@${s.username})</option>`).join('') : '<option value="">No students registered</option>';
    this.toggleInvoiceModal(true);
  },

  async handleCreateInvoice(event) {
    event.preventDefault();
    const studentId = document.getElementById('modal-inv-stud').value;
    const amount = document.getElementById('modal-inv-amount').value;
    const dueDate = document.getElementById('modal-inv-duedate').value;

    const res = await App.apiCall('/api/school/fees', {
      method: 'POST',
      body: JSON.stringify({ studentId, amount, dueDate })
    });

    if (res.error) {
      App.showToast(res.message, 'error');
    } else {
      App.showToast('Billing invoice issued!', 'success');
      this.toggleInvoiceModal(false);
      await this.loadSchoolTabContent();
    }
  },

  async payInvoice(id) {
    App.showToast('Recording invoice payment...', 'info');
    const res = await App.apiCall(`/api/school/fees/${id}/pay`, {
      method: 'PUT',
      body: JSON.stringify({ paymentMethod: 'CASH' })
    });

    if (res.error) {
      App.showToast(res.message, 'error');
    } else {
      App.showToast('Invoice marked as PAID.', 'success');
      await this.loadSchoolTabContent();
    }
  },

  async handleCreateExam(event) {
    event.preventDefault();
    const examName = document.getElementById('modal-exam-name').value;
    const subject = document.getElementById('modal-exam-subject').value;
    const maxMarks = document.getElementById('modal-exam-max').value;
    const examDate = document.getElementById('modal-exam-date').value;

    const res = await App.apiCall('/api/school/exams', {
      method: 'POST',
      body: JSON.stringify({ examName, subject, maxMarks, examDate })
    });

    if (res.error) {
      App.showToast(res.message, 'error');
    } else {
      App.showToast('Assessment scheduled successfully!', 'success');
      this.toggleExamModal(false);
      await this.loadSchoolTabContent();
    }
  },

  async loadExamResultsList(examId, maxMarks) {
    const tableBody = document.getElementById('modal-results-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="4" class="text-center" style="font-size:11px; padding:0.5rem;">Loading grades...</td></tr>`;

    const results = await App.apiCall(`/api/school/exams/${examId}/results`);
    let rowsHtml = '';
    if (Array.isArray(results) && results.length > 0) {
      results.forEach(r => {
        rowsHtml += `
          <tr>
            <td><strong>${r.student ? r.student.name : 'Unknown'}</strong></td>
            <td>${r.marksObtained} / ${maxMarks}</td>
            <td>${r.grade || 'N/A'}</td>
            <td>${r.remarks || ''}</td>
          </tr>
        `;
      });
    } else {
      rowsHtml = `<tr><td colspan="4" class="text-center" style="color:var(--text-muted); font-size:11px; padding:1rem;">No grades recorded yet.</td></tr>`;
    }
    tableBody.innerHTML = rowsHtml;
  },

  async openMarksModal(examId, name, maxMarks) {
    const studs = await App.apiCall('/api/school/students');
    const select = document.getElementById('modal-score-stud');
    if (!select) return;

    document.getElementById('modal-score-exam-id').value = examId;
    document.getElementById('modal-score-exam-id').setAttribute('data-max-marks', maxMarks);
    document.getElementById('marks-modal-title').textContent = `Grade - ${name} (Max score: ${maxMarks})`;
    document.getElementById('modal-score-marks').max = maxMarks;

    select.innerHTML = Array.isArray(studs) ? studs.map(s => `<option value="${s.id}">${s.name} (@${s.username})</option>`).join('') : '<option value="">No students registered</option>';
    this.toggleMarksModal(true);
    await this.loadExamResultsList(examId, maxMarks);
  },

  async handlePostScore(event) {
    event.preventDefault();
    const examId = document.getElementById('modal-score-exam-id').value;
    const studentId = document.getElementById('modal-score-stud').value;
    const marksObtained = document.getElementById('modal-score-marks').value;
    const grade = document.getElementById('modal-score-grade').value;
    const remarks = document.getElementById('modal-score-remarks').value;
    const maxMarks = document.getElementById('modal-score-exam-id').getAttribute('data-max-marks') || 100;

    const res = await App.apiCall(`/api/school/exams/${examId}/results`, {
      method: 'POST',
      body: JSON.stringify({ studentId, marksObtained, grade, remarks })
    });

    if (res.error) {
      App.showToast(res.message, 'error');
    } else {
      App.showToast('Student grade posted successfully!', 'success');
      document.getElementById('modal-score-marks').value = '';
      document.getElementById('modal-score-grade').value = '';
      document.getElementById('modal-score-remarks').value = '';
      await this.loadExamResultsList(examId, maxMarks);
      await this.loadSchoolTabContent();
    }
  },

  async handleCreateBook(event) {
    event.preventDefault();
    const title = document.getElementById('modal-book-title').value;
    const author = document.getElementById('modal-book-author').value;
    const isbn = document.getElementById('modal-book-isbn').value;
    const quantity = document.getElementById('modal-book-qty').value;

    const res = await App.apiCall('/api/school/books', {
      method: 'POST',
      body: JSON.stringify({ title, author, isbn, quantity })
    });

    if (res.error) {
      App.showToast(res.message, 'error');
    } else {
      App.showToast('Book added to library catalog!', 'success');
      this.toggleBookModal(false);
      await this.loadSchoolTabContent();
    }
  },

  async openCheckoutModal(bookId, title) {
    const studs = await App.apiCall('/api/school/students');
    const select = document.getElementById('modal-issue-stud');
    if (!select) return;

    document.getElementById('modal-issue-book-id').value = bookId;
    document.getElementById('modal-issue-book-title').value = title;

    select.innerHTML = Array.isArray(studs) ? studs.map(s => `<option value="${s.id}">${s.name} (@${s.username})</option>`).join('') : '<option value="">No students registered</option>';
    this.toggleCheckoutModal(true);
  },

  async handleIssueBook(event) {
    event.preventDefault();
    const bookId = document.getElementById('modal-issue-book-id').value;
    const studentId = document.getElementById('modal-issue-stud').value;
    const issueDate = new Date().toISOString().split('T')[0];

    const res = await App.apiCall(`/api/school/books/${bookId}/issue`, {
      method: 'POST',
      body: JSON.stringify({ studentId, issueDate })
    });

    if (res.error) {
      App.showToast(res.message, 'error');
    } else {
      App.showToast('Book checked out!', 'success');
      this.toggleCheckoutModal(false);
      await this.loadSchoolTabContent();
    }
  },

  async returnBook(id) {
    App.showToast('Returning book to library...', 'info');
    const res = await App.apiCall(`/api/school/books/issue/${id}/return`, {
      method: 'PUT'
    });

    if (res.error) {
      App.showToast(res.message, 'error');
    } else {
      App.showToast('Book successfully returned to catalog.', 'success');
      await this.loadSchoolTabContent();
    }
  },

  openPayOnlineModal(invoiceId, amount) {
    document.getElementById('modal-pay-invoice-id').value = invoiceId;
    document.getElementById('modal-pay-amount').value = `$${amount.toFixed(2)}`;
    document.getElementById('modal-pay-cardname').value = App.state.user.name;
    this.togglePayOnlineModal(true);
  },

  togglePayOnlineModal(show) {
    const modal = document.getElementById('pay-online-modal');
    if (!modal) return;
    if (show) modal.classList.add('active');
    else modal.classList.remove('active');
  },

  async handlePayOnline(event) {
    event.preventDefault();
    const id = document.getElementById('modal-pay-invoice-id').value;

    App.showToast('Processing online sandbox payment...', 'info');

    const res = await App.apiCall(`/api/school/fees/${id}/pay`, {
      method: 'PUT',
      body: JSON.stringify({ paymentMethod: 'ONLINE_PORTAL' })
    });

    if (res.error) {
      App.showToast(res.message, 'error');
    } else {
      App.showToast('Payment successful! Receipt is now available.', 'success');
      this.togglePayOnlineModal(false);
      await this.loadSchoolTabContent();
    }
  },

  downloadReceipt(invoiceId, studentName, amount, date) {
    const formattedDate = date && date !== 'N/A' && date !== 'null' ? date : new Date().toISOString().split('T')[0];
    const receiptContent = `
=========================================
          RECEIPT OF PAYMENT
=========================================
Invoice ID: ${invoiceId}
School: ${App.state.user.schoolName}
Student: ${studentName}
Amount Paid: $${amount.toFixed(2)}
Status: PAID
Payment Date: ${formattedDate}
Payment Method: ONLINE_PORTAL

Thank you for your payment!
=========================================
    `;
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt-${invoiceId.substring(0,8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    App.showToast('Receipt downloaded successfully!', 'success');
  }
};

window.DashboardPortal = DashboardPortal;
