import React, { useState } from 'react';

function Settings({ settings, onSave }) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [status, setStatus] = useState('');

  const defaultSettings = {
    companyName: 'COMPANY',
    plantLocation: 'Main Plant',
    dashboardTitle: 'HSE Dashboard',
    themeColor: '#E31837',
    theme: 'light',         // 'light' or 'dark'
    language: 'en',         // 'en' or 'fr'
    defaultYear: '2026',
    defaultPage: 'Dashboard'
  };

  const handleChange = (e) => {
    setLocalSettings({ ...localSettings, [e.target.name]: e.target.value });
  };

  const handleToggleTheme = (theme) => {
    setLocalSettings({ ...localSettings, theme });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(localSettings);
    setStatus('✅ Settings saved successfully!');
    setTimeout(() => setStatus(''), 3000);
  };

  const handleReset = () => {
    setLocalSettings(defaultSettings);
    setStatus('🔄 Reset to defaults. Click Save to apply.');
    setTimeout(() => setStatus(''), 3000);
  };

  return (
    <div className="settings-wrapper">
      <div className="settings-container">
        {/* HEADER */}
        <div className="settings-header">
          <h1>⚙️ Application Settings</h1>
          <p>Customize your dashboard's appearance, behavior, and branding.</p>
        </div>

        <form onSubmit={handleSubmit} className="settings-form">

          {/* --- ORGANIZATION INFO --- */}
          <div className="settings-section">
            <h3 className="section-title">🏢 Organization Info</h3>

            <div className="settings-field">
              <label>Company Name</label>
              <input type="text" name="companyName" value={localSettings.companyName} onChange={handleChange} />
              <small>Displayed in the top-left corner of the navigation bar.</small>
            </div>

            <div className="settings-field">
              <label>Plant Location</label>
              <input type="text" name="plantLocation" value={localSettings.plantLocation} onChange={handleChange} />
              <small>Shown under the main title on every page.</small>
            </div>

            <div className="settings-field">
              <label>Dashboard Title</label>
              <input type="text" name="dashboardTitle" value={localSettings.dashboardTitle} onChange={handleChange} />
              <small>The main heading of your dashboard page.</small>
            </div>
          </div>

          {/* --- APPEARANCE --- */}
          <div className="settings-section">
            <h3 className="section-title">🎨 Appearance</h3>

            <div className="settings-field">
              <label>Theme Mode</label>
              <div className="theme-toggle">
                <button
                  type="button"
                  className={`theme-btn ${localSettings.theme === 'light' ? 'active' : ''}`}
                  onClick={() => handleToggleTheme('light')}
                >
                  ☀️ Light
                </button>
                <button
                  type="button"
                  className={`theme-btn ${localSettings.theme === 'dark' ? 'active' : ''}`}
                  onClick={() => handleToggleTheme('dark')}
                >
                  🌙 Dark
                </button>
              </div>
              <small>Choose between a bright daytime theme or a dark nighttime theme.</small>
            </div>

            <div className="settings-field">
              <label>Primary Theme Color</label>
              <div className="color-input-wrapper">
                <input type="color" name="themeColor" value={localSettings.themeColor} onChange={handleChange} className="color-picker" />
                <input type="text" name="themeColor" value={localSettings.themeColor} onChange={handleChange} className="color-text" />
              </div>
              <small>Used for accents, KPI card borders, and active navigation items.</small>
            </div>
          </div>

          {/* --- LANGUAGE & PREFERENCES --- */}
          <div className="settings-section">
            <h3 className="section-title">🌍 Language & Preferences</h3>

            <div className="settings-field">
              <label>Language</label>
              <select name="language" value={localSettings.language} onChange={handleChange}>
                <option value="en">🇬🇧 English</option>
                <option value="fr">🇫🇷 Français</option>
              </select>
              <small>Interface language for the dashboard.</small>
            </div>

            <div className="settings-field">
              <label>Default Year on Startup</label>
              <select name="defaultYear" value={localSettings.defaultYear} onChange={handleChange}>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
              <small>The year that will be selected when you first open the dashboard.</small>
            </div>

            <div className="settings-field">
              <label>Default Landing Page</label>
              <select name="defaultPage" value={localSettings.defaultPage} onChange={handleChange}>
                <option value="Dashboard">📊 Dashboard</option>
                <option value="Reports">📄 Reports</option>
              </select>
              <small>Choose which page opens when you launch the app.</small>
            </div>
          </div>

          {/* --- LIVE PREVIEW --- */}
          <div className="settings-section preview-section">
            <h3 className="section-title">👁️ Live Preview</h3>
            <p className="preview-note">This is how your dashboard header will look:</p>

            <div className={`preview-nav ${localSettings.theme}`}>
              <div className="preview-nav-logo" style={{ color: localSettings.themeColor }}>
                {localSettings.companyName || 'COMPANY'}
              </div>
              <div className="preview-nav-links">
                <span className="active" style={{ color: localSettings.themeColor, borderBottomColor: localSettings.themeColor }}>
                  📊 Dashboard
                </span>
                <span>📄 Reports</span>
                <span>⚙️ Settings</span>
              </div>
            </div>

            <div className="preview-card" style={{ borderLeftColor: localSettings.themeColor }}>
              <div className="preview-title">{localSettings.dashboardTitle || 'HSE Dashboard'}</div>
              <div className="preview-subtitle">{localSettings.plantLocation || 'Main Plant'}</div>
            </div>
          </div>

          {/* --- ACTIONS --- */}
          <div className="settings-actions">
            <button type="button" className="reset-btn" onClick={handleReset}>
              🔄 Reset to Defaults
            </button>
            <button type="submit" className="save-btn" style={{ backgroundColor: localSettings.themeColor }}>
              💾 Save Settings
            </button>
          </div>

          {status && <p className="settings-status">{status}</p>}
        </form>
      </div>
    </div>
  );
}

export default Settings;