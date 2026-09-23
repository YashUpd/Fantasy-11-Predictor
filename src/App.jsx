import React, { useState } from 'react';
import PredictorView from './components/PredictorView';
import MatchesView from './components/MatchesView';
import AnalyticsView from './components/AnalyticsView';
import { Sparkles, Radio, BarChart3, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('predictor');

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
      </header>

      {/* Main Content View */}
      <main>
        {activeTab === 'predictor' && <PredictorView />}
        {activeTab === 'matches' && <MatchesView />}
        {activeTab === 'analytics' && <AnalyticsView />}
      </main>

      {/* Professional Footer */}
      <footer className="app-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} style={{ color: 'var(--accent-green)' }} />
          <span>Dream11 Official Rules Engine (Max 7 per team, balanced role constraints)</span>
        </div>
        <div className="system-status">
          <span className="status-dot"></span>
          <span>Engine Operational</span>
        </div>
      </footer>
    </div>
  );
}
