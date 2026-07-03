// Setup Wizard Component Logic

const SetupWizard = {
  currentStep: 1,
  formData: {
    // Step 1
    developerName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    securityQuestion: '',
    securityAnswer: '',
    organization: '',
    // Step 2
    superAdminName: '',
    superAdminEmail: '',
    superAdminUsername: '',
    superAdminPassword: '',
    superAdminConfirmPassword: '',
    superAdminPhone: '',
    superAdminCountry: '',
    superAdminTimezone: 'IST',
    // Step 3
    platformName: '',
    theme: 'dark',
    language: 'en',
    currency: 'USD',
    timezone: 'IST',
    smtpHost: '',
    smtpPort: ''
  },

  render() {
    const container = document.getElementById('view-container');
    if (!container) return;

    container.innerHTML = `
      <div class="setup-wizard-container">
        <div class="setup-card card-glass">
          <div class="setup-header">
            <div class="login-logo">S</div>
            <h1 style="margin-top: 10px;">Platform Initial Setup</h1>
            <p>Configure the root settings for your new SaaS system</p>
          </div>

          <!-- Progress Tracker -->
          <div class="progress-tracker">
            <div class="progress-line" id="wizard-progress-line"></div>
            <div class="step-dot active" id="step-dot-1"><span>1</span></div>
            <div class="step-dot" id="step-dot-2"><span>2</span></div>
            <div class="step-dot" id="step-dot-3"><span>3</span></div>
            <div class="step-dot" id="step-dot-4"><span>4</span></div>
          </div>

          <!-- Step Content Container -->
          <div id="step-content"></div>

          <!-- Footer Actions -->
          <div class="flex justify-between align-center" style="margin-top: 2rem; border-top: 1px solid var(--border); padding-top: 1.5rem;" id="wizard-actions">
            <button class="btn btn-secondary hidden" id="btn-wizard-prev" onclick="SetupWizard.prevStep()">Back</button>
            <div style="flex-grow: 1;"></div>
            <button class="btn btn-primary" id="btn-wizard-next" onclick="SetupWizard.nextStep()">Next Step</button>
          </div>
        </div>
      </div>
    `;

    this.renderStep();
    this.updateProgressUI();
  },

  renderStep() {
    const stepContent = document.getElementById('step-content');
    if (!stepContent) return;

    let html = '';

    switch (this.currentStep) {
      case 1:
        html = `
          <div class="wizard-step">
            <h2 style="margin-bottom: 1.5rem; font-size: 1.3rem;">Step 1: Developer Account (Platform Owner)</h2>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Developer Full Name *</label>
                <input type="text" class="input-control" id="dev-name" value="${this.formData.developerName}" placeholder="e.g. John Doe">
              </div>
              <div class="form-group">
                <label>Organization / Company Name</label>
                <input type="text" class="input-control" id="dev-org" value="${this.formData.organization}" placeholder="e.g. Antigravity Ltd">
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Email Address *</label>
                <input type="email" class="input-control" id="dev-email" value="${this.formData.email}" placeholder="developer@platform.com">
              </div>
              <div class="form-group">
                <label>Username *</label>
                <input type="text" class="input-control" id="dev-username" value="${this.formData.username}" placeholder="root_dev">
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Password *</label>
                <input type="password" class="input-control" id="dev-password" placeholder="••••••••">
              </div>
              <div class="form-group">
                <label>Confirm Password *</label>
                <input type="password" class="input-control" id="dev-confirm" placeholder="••••••••">
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Security Question *</label>
                <select class="input-control" id="dev-question">
                  <option value="" disabled ${!this.formData.securityQuestion ? 'selected' : ''}>Choose a question...</option>
                  <option value="first_pet" ${this.formData.securityQuestion === 'first_pet' ? 'selected' : ''}>What was your first pet's name?</option>
                  <option value="mother_maiden" ${this.formData.securityQuestion === 'mother_maiden' ? 'selected' : ''}>What is your mother's maiden name?</option>
                  <option value="first_school" ${this.formData.securityQuestion === 'first_school' ? 'selected' : ''}>What primary school did you attend?</option>
                  <option value="birth_city" ${this.formData.securityQuestion === 'birth_city' ? 'selected' : ''}>In what city were you born?</option>
                </select>
              </div>
              <div class="form-group">
                <label>Security Answer *</label>
                <input type="text" class="input-control" id="dev-answer" value="${this.formData.securityAnswer}" placeholder="Your answer">
              </div>
            </div>
          </div>
        `;
        break;

      case 2:
        html = `
          <div class="wizard-step">
            <h2 style="margin-bottom: 1.5rem; font-size: 1.3rem;">Step 2: Create First Super Admin</h2>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Super Admin Full Name *</label>
                <input type="text" class="input-control" id="admin-name" value="${this.formData.superAdminName}" placeholder="e.g. Sarah Jenkins">
              </div>
              <div class="form-group">
                <label>Contact Phone Number</label>
                <input type="text" class="input-control" id="admin-phone" value="${this.formData.superAdminPhone}" placeholder="+1 (555) 019-2834">
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Email Address *</label>
                <input type="email" class="input-control" id="admin-email" value="${this.formData.superAdminEmail}" placeholder="admin@platform.com">
              </div>
              <div class="form-group">
                <label>Username *</label>
                <input type="text" class="input-control" id="admin-username" value="${this.formData.superAdminUsername}" placeholder="super_admin">
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Password *</label>
                <input type="password" class="input-control" id="admin-password" placeholder="••••••••">
              </div>
              <div class="form-group">
                <label>Confirm Password *</label>
                <input type="password" class="input-control" id="admin-confirm" placeholder="••••••••">
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Country *</label>
                <input type="text" class="input-control" id="admin-country" value="${this.formData.superAdminCountry}" placeholder="e.g. United States">
              </div>
              <div class="form-group">
                <label>Timezone *</label>
                <select class="input-control" id="admin-timezone">
                  <option value="UTC" ${this.formData.superAdminTimezone === 'UTC' ? 'selected' : ''}>Coordinated Universal Time (UTC)</option>
                  <option value="America/New_York" ${this.formData.superAdminTimezone === 'America/New_York' ? 'selected' : ''}>Eastern Time (EST/EDT)</option>
                  <option value="Europe/London" ${this.formData.superAdminTimezone === 'Europe/London' ? 'selected' : ''}>London (GMT/BST)</option>
                  <option value="Asia/Kolkata" ${this.formData.superAdminTimezone === 'Asia/Kolkata' ? 'selected' : ''}>India Standard Time (IST)</option>
                  <option value="Asia/Tokyo" ${this.formData.superAdminTimezone === 'Asia/Tokyo' ? 'selected' : ''}>Japan Standard Time (JST)</option>
                  <option value="IST" ${this.formData.superAdminTimezone === 'IST' ? 'selected' : ''}>IST (Indian Standard Time)</option>
                </select>
              </div>
            </div>
          </div>
        `;
        break;

      case 3:
        html = `
          <div class="wizard-step">
            <h2 style="margin-bottom: 1.5rem; font-size: 1.3rem;">Step 3: Platform Settings</h2>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Application Name *</label>
                <input type="text" class="input-control" id="plat-name" value="${this.formData.platformName}" placeholder="e.g. EduPortal SaaS">
              </div>
              <div class="form-group">
                <label>Default Currency *</label>
                <select class="input-control" id="plat-currency">
                  <option value="USD" ${this.formData.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
                  <option value="EUR" ${this.formData.currency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
                  <option value="GBP" ${this.formData.currency === 'GBP' ? 'selected' : ''}>GBP (£)</option>
                  <option value="INR" ${this.formData.currency === 'INR' ? 'selected' : ''}>INR (₹)</option>
                </select>
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Default Theme *</label>
                <select class="input-control" id="plat-theme">
                  <option value="dark" ${this.formData.theme === 'dark' ? 'selected' : ''}>Sleek Dark Theme</option>
                  <option value="light" ${this.formData.theme === 'light' ? 'selected' : ''}>Classic Light Theme</option>
                </select>
              </div>
              <div class="form-group">
                <label>Default Language *</label>
                <select class="input-control" id="plat-lang">
                  <option value="en" ${this.formData.language === 'en' ? 'selected' : ''}>English (US)</option>
                  <option value="es" ${this.formData.language === 'es' ? 'selected' : ''}>Spanish</option>
                  <option value="fr" ${this.formData.language === 'fr' ? 'selected' : ''}>French</option>
                </select>
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>SMTP Host (optional)</label>
                <input type="text" class="input-control" id="plat-smtp-host" value="${this.formData.smtpHost}" placeholder="smtp.mailtrap.io">
              </div>
              <div class="form-group">
                <label>SMTP Port (optional)</label>
                <input type="number" class="input-control" id="plat-smtp-port" value="${this.formData.smtpPort}" placeholder="587">
              </div>
            </div>
          </div>
        `;
        break;

      case 4:
        html = `
          <div class="wizard-step text-center" style="padding: 2rem 0;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background-color: var(--success-glow); color: var(--success); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
              <i data-lucide="check" style="width: 48px; height: 48px;"></i>
            </div>
            <h2 style="margin-bottom: 1rem; font-size: 1.8rem; font-family: var(--font-display);">Initialization Complete</h2>
            <p style="color: var(--text-secondary); max-width: 450px; margin: 0 auto 2rem;">
              System has been initialized successfully. The setup wizard is now permanently disabled. Log in with your new credentials to manage the platform.
            </p>
            <div class="card-glass" style="max-width: 420px; margin: 0 auto; text-align: left; padding: 1.5rem; font-size: 13px;">
              <div style="margin-bottom: 0.5rem;"><strong style="color: var(--text-muted)">Developer Admin:</strong> ${this.formData.username}</div>
              <div><strong style="color: var(--text-muted)">Super Admin:</strong> ${this.formData.superAdminUsername}</div>
            </div>
          </div>
        `;
        break;
    }

    stepContent.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  },

  saveCurrentStepData() {
    switch (this.currentStep) {
      case 1:
        this.formData.developerName = document.getElementById('dev-name').value;
        this.formData.organization = document.getElementById('dev-org').value;
        this.formData.email = document.getElementById('dev-email').value;
        this.formData.username = document.getElementById('dev-username').value;
        this.formData.password = document.getElementById('dev-password').value;
        this.formData.confirmPassword = document.getElementById('dev-confirm').value;
        this.formData.securityQuestion = document.getElementById('dev-question').value;
        this.formData.securityAnswer = document.getElementById('dev-answer').value;
        break;

      case 2:
        this.formData.superAdminName = document.getElementById('admin-name').value;
        this.formData.superAdminPhone = document.getElementById('admin-phone').value;
        this.formData.superAdminEmail = document.getElementById('admin-email').value;
        this.formData.superAdminUsername = document.getElementById('admin-username').value;
        this.formData.superAdminPassword = document.getElementById('admin-password').value;
        this.formData.superAdminConfirmPassword = document.getElementById('admin-confirm').value;
        this.formData.superAdminCountry = document.getElementById('admin-country').value;
        this.formData.superAdminTimezone = document.getElementById('admin-timezone').value;
        break;

      case 3:
        this.formData.platformName = document.getElementById('plat-name').value;
        this.formData.currency = document.getElementById('plat-currency').value;
        this.formData.theme = document.getElementById('plat-theme').value;
        this.formData.language = document.getElementById('plat-lang').value;
        this.formData.smtpHost = document.getElementById('plat-smtp-host').value;
        this.formData.smtpPort = document.getElementById('plat-smtp-port').value;
        break;
    }
  },

  validateCurrentStep() {
    this.saveCurrentStepData();

    if (this.currentStep === 1) {
      if (!this.formData.developerName || !this.formData.email || !this.formData.username || !this.formData.password || !this.formData.securityQuestion || !this.formData.securityAnswer) {
        App.showToast('Please fill out all required fields.', 'error');
        return false;
      }
      if (this.formData.password !== this.formData.confirmPassword) {
        App.showToast('Passwords do not match.', 'error');
        return false;
      }
      if (this.formData.password.length < 6) {
        App.showToast('Password must be at least 6 characters long.', 'error');
        return false;
      }
    }

    if (this.currentStep === 2) {
      if (!this.formData.superAdminName || !this.formData.superAdminEmail || !this.formData.superAdminUsername || !this.formData.superAdminPassword || !this.formData.superAdminCountry) {
        App.showToast('Please fill out all required fields.', 'error');
        return false;
      }
      if (this.formData.superAdminPassword !== this.formData.superAdminConfirmPassword) {
        App.showToast('Super Admin passwords do not match.', 'error');
        return false;
      }
      if (this.formData.superAdminPassword.length < 6) {
        App.showToast('Super Admin password must be at least 6 characters.', 'error');
        return false;
      }
    }

    if (this.currentStep === 3) {
      if (!this.formData.platformName) {
        App.showToast('Application name is required.', 'error');
        return false;
      }
    }

    return true;
  },

  async submitSetup() {
    try {
      App.showToast('Initializing platform database...', 'info');
      const response = await fetch('/api/setup/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.formData)
      });

      const data = await response.json();

      if (!response.ok) {
        App.showToast(data.message || 'Setup submission failed.', 'error');
        return false;
      }

      App.showToast('System setup complete!', 'success');
      return true;
    } catch (error) {
      App.showToast('Connection error during initialization.', 'error');
      return false;
    }
  },

  async nextStep() {
    if (!this.validateCurrentStep()) return;

    if (this.currentStep === 3) {
      const success = await this.submitSetup();
      if (!success) return;
    }

    if (this.currentStep < 4) {
      this.currentStep++;
      this.renderStep();
      this.updateProgressUI();
    } else {
      // Completed, redirect to Login
      App.state.needsSetup = false;
      App.navigate('/');
    }
  },

  prevStep() {
    if (this.currentStep > 1 && this.currentStep < 4) {
      this.saveCurrentStepData();
      this.currentStep--;
      this.renderStep();
      this.updateProgressUI();
    }
  },

  updateProgressUI() {
    const prevBtn = document.getElementById('btn-wizard-prev');
    const nextBtn = document.getElementById('btn-wizard-next');
    const line = document.getElementById('wizard-progress-line');

    if (this.currentStep === 4) {
      prevBtn.classList.add('hidden');
      nextBtn.textContent = 'Go to Login';
      line.style.width = '100%';
    } else {
      nextBtn.textContent = this.currentStep === 3 ? 'Finish Setup' : 'Next Step';
      
      if (this.currentStep === 1) {
        prevBtn.classList.add('hidden');
        line.style.width = '0%';
      } else {
        prevBtn.classList.remove('hidden');
        line.style.width = this.currentStep === 2 ? '33%' : '66%';
      }
    }

    // Step dots status
    for (let i = 1; i <= 4; i++) {
      const dot = document.getElementById(`step-dot-${i}`);
      if (dot) {
        dot.className = 'step-dot';
        if (i < this.currentStep) {
          dot.classList.add('completed');
          dot.innerHTML = `<i data-lucide="check" style="width:18px;height:18px;"></i>`;
        } else if (i === this.currentStep) {
          dot.classList.add('active');
          dot.innerHTML = `<span>${i}</span>`;
        } else {
          dot.innerHTML = `<span>${i}</span>`;
        }
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }
};

window.SetupWizard = SetupWizard;
