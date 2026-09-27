import React from 'react';
import { 
  X, Moon, Sun, Monitor, Shield, Sliders, Database, Check, RefreshCw, Zap
} from 'lucide-react';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  theme, 
  onToggleTheme, 
  settings, 
  onUpdateSettings 
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="settings-modal glass-card" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="settings-header-icon">
              <Sliders size={20} style={{ color: 'var(--accent-green)' }} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Application Settings
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Configure theme appearance, ML algorithm weighting, and rulesets
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Section 1: Appearance / Theme */}
          <div className="settings-section">
            <div className="settings-section-title">
              <span>Appearance & Color Theme</span>
            </div>
            <div className="theme-toggle-grid">
              <div 
                className={`theme-card ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => onToggleTheme('dark')}
              >
                <div className="theme-card-icon dark-icon">
                  <Moon size={22} />
                </div>
                <div className="theme-card-info">
                  <div className="theme-card-title">Dark Mode</div>
                  <div className="theme-card-desc">Deep slate neon aesthetics optimized for low light</div>
                </div>
                {theme === 'dark' && (
                  <span className="theme-check-badge">
                    <Check size={14} />
                  </span>
                )}
              </div>

              <div 
                className={`theme-card ${theme === 'light' ? 'active' : ''}`}
                onClick={() => onToggleTheme('light')}
              >
                <div className="theme-card-icon light-icon">
                  <Sun size={22} />
                </div>
                <div className="theme-card-info">
                  <div className="theme-card-title">Light Mode</div>
                  <div className="theme-card-desc">Crisp, high-contrast daylight aesthetic with emerald accents</div>
                </div>
                {theme === 'light' && (
                  <span className="theme-check-badge">
                    <Check size={14} />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Fantasy Rules Preset */}
          <div className="settings-section">
            <div className="settings-section-title">
              <span>Fantasy Contest Ruleset</span>
            </div>
            <div className="settings-options-list">
              <label className="settings-radio-label">
                <input 
                  type="radio" 
                  name="ruleset" 
                  checked={settings.ruleset === 'dream11'}
                  onChange={() => onUpdateSettings({ ...settings, ruleset: 'dream11' })}
                />
                <div style={{ marginLeft: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                    Dream11 Standard Rules (Recommended)
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    1–4 WK, 3–6 BAT, 1–4 AR, 3–6 BOWL, max 7 players per team, 100 credit ceiling
                  </div>
                </div>
              </label>

              <label className="settings-radio-label">
                <input 
                  type="radio" 
                  name="ruleset" 
                  checked={settings.ruleset === 'my11circle'}
                  onChange={() => onUpdateSettings({ ...settings, ruleset: 'my11circle' })}
                />
                <div style={{ marginLeft: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                    My11Circle Flexible Preset
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    1–8 BAT/BOWL flexibility, max 8 players per team
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: AI Prediction Engine Weighting */}
          <div className="settings-section">
            <div className="settings-section-title">
              <span>ML Engine Optimization Bias</span>
            </div>
            <div className="settings-options-list">
              <label className="settings-radio-label">
                <input 
                  type="radio" 
                  name="mlBias" 
                  checked={settings.mlBias === 'balanced'}
                  onChange={() => onUpdateSettings({ ...settings, mlBias: 'balanced' })}
                />
                <div style={{ marginLeft: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                    Balanced Ensemble (Default)
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    50% Recent Form Momentum + 50% Long-term Career Baselines
                  </div>
                </div>
              </label>

              <label className="settings-radio-label">
                <input 
                  type="radio" 
                  name="mlBias" 
                  checked={settings.mlBias === 'form'}
                  onChange={() => onUpdateSettings({ ...settings, mlBias: 'form' })}
                />
                <div style={{ marginLeft: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                    Aggressive Form Bias
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    75% Last-5-Matches performance + 25% Career stats (Great for in-form streaks)
                  </div>
                </div>
              </label>

              <label className="settings-radio-label">
                <input 
                  type="radio" 
                  name="mlBias" 
                  checked={settings.mlBias === 'safe'}
                  onChange={() => onUpdateSettings({ ...settings, mlBias: 'safe' })}
                />
                <div style={{ marginLeft: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                    High-Floor Consistent Bias
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    70% Historical Stability + 30% Recent Form (Optimal for Head-to-Head leagues)
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Section 4: CricAPI Data Shield & Health */}
          <div className="settings-section" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
            <div className="settings-section-title">
              <span>Data Engine & API Shield</span>
            </div>
            <div className="data-shield-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={15} style={{ color: 'var(--accent-green)' }} />
                  <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>
                    CricAPI Resilient Shield
                  </span>
                </div>
                <span className="shield-active-pill">
                  <span className="live-indicator-dot" style={{ width: '6px', height: '6px' }}></span>
                  Active & Cached
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                Automatic rate-limit backoff and local squad caching are active. Free-tier quota exhaustion is shielded seamlessly with verified international rosters.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button 
            className="btn-secondary" 
            style={{ fontSize: '12px', padding: '8px 14px' }}
            onClick={() => {
              onUpdateSettings({
                ruleset: 'dream11',
                mlBias: 'balanced',
                autoRefresh: true
              });
              onToggleTheme('light');
            }}
          >
            <RefreshCw size={13} />
            <span>Reset Defaults</span>
          </button>

          <button 
            className="btn-primary" 
            style={{ fontSize: '12px', padding: '8px 18px' }}
            onClick={onClose}
          >
            <Check size={14} />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
}
