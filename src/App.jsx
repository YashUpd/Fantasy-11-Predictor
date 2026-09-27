import React, { useState, useEffect } from 'react';
import PredictorView from './components/PredictorView';
import MatchesView from './components/MatchesView';
import AnalyticsView from './components/AnalyticsView';
import SettingsModal from './components/SettingsModal';
import { 
  Sparkles, Radio, BarChart3, ShieldCheck, Sun, Moon, Settings 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('predictor');
  const [selectedMatchId, setSelectedMatchId] = useState('live-1');
  const [showSettings, setShowSettings] = useState(false);

  // Theme state: 'light' (default) or 'dark'
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('dream11_theme');
    if (saved) return saved;
    return 'light';
  });

  // App settings state
  const [settings, setSettings] = useState({
    ruleset: 'dream11',
    mlBias: 'balanced',
    autoRefresh: true
  });

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('dream11_theme', theme);
  }, [theme]);

  const handleSelectMatch = (matchId) => {
    setSelectedMatchId(matchId);
    setActiveTab('predictor');
  };

  const toggleTheme = (newTheme) => {
    if (newTheme) {
      setTheme(newTheme);
    } else {
      setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    }
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-icon">
            🏏
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="brand-title">Dream11 Squad Architect</h1>
              <span className="badge-tag pro">PRO</span>
            </div>
            <div className="brand-subtitle">
              <span>Algorithmic Team Intelligence & Lineup Optimization</span>
            </div>
          </div>
        </div>

        {/* Right Header Section: Nav & Settings Controls */}
        <div className="header-controls">
          {/* Navigation Tabs */}
          <nav className="nav-tabs">
            <button 
              className={`nav-tab-btn ${activeTab === 'predictor' ? 'active' : ''}`}
              onClick={() => setActiveTab('predictor')}
            >
              <Sparkles size={16} />
              <span>Squad Optimizer</span>
            </button>

            <button 
              className={`nav-tab-btn ${activeTab === 'matches' ? 'active' : ''}`}
              onClick={() => setActiveTab('matches')}
            >
              <Radio size={16} />
              <span>Live Fixtures</span>
            </button>

            <button 
              className={`nav-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 size={16} />
              <span>Player Intelligence</span>
            </button>
          </nav>

          {/* Quick Theme Toggle & Settings Modal Button */}
          <div className="utility-buttons">
            <button 
              className="btn-theme-quick" 
              onClick={() => toggleTheme()}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle dark/light theme"
            >
              {theme === 'dark' ? (
                <Sun size={18} style={{ color: 'var(--accent-gold)' }} />
              ) : (
                <Moon size={18} style={{ color: 'var(--accent-purple)' }} />
              )}
            </button>

            <button 
              className="btn-settings-trigger" 
              onClick={() => setShowSettings(true)}
              title="Application Settings"
              aria-label="Open application settings"
            >
              <Settings size={18} />
              <span className="settings-btn-label">Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main>
        {activeTab === 'predictor' && (
          <PredictorView 
            selectedMatchId={selectedMatchId}
            onSelectMatch={setSelectedMatchId}
            settings={settings}
          />
        )}
        {activeTab === 'matches' && (
          <MatchesView onSelectMatch={handleSelectMatch} />
        )}
        {activeTab === 'analytics' && <AnalyticsView />}
      </main>

      {/* Professional Footer */}
      <footer className="app-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} style={{ color: 'var(--accent-green)' }} />
          <span>
            {settings.ruleset === 'dream11' 
              ? 'Dream11 Official Rules Engine (Max 7 per team, 100 credits ceiling, balanced roles)' 
              : 'Flexible Contest Engine Active'}
          </span>
        </div>
        <div className="system-status">
          <span className="status-dot"></span>
          <span>Engine Operational • {theme.toUpperCase()} MODE</span>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
        settings={settings}
        onUpdateSettings={setSettings}
      />
    </div>
  );
}
