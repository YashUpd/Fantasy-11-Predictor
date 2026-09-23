import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Bell, Check, Loader2, Radio } from 'lucide-react';

export default function MatchesView() {
  const [activeTab, setActiveTab] = useState('live');
  const [matches, setMatches] = useState({ live_matches: [], upcoming_matches: [] });
  const [loading, setLoading] = useState(true);
  const [reminderSet, setReminderSet] = useState({});

  useEffect(() => {
    fetch('/api/matches')
      .then(res => res.json())
      .then(data => {
        setMatches(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load match fixtures", err);
        setLoading(false);
      });
  }, []);

  const toggleReminder = (id) => {
    setReminderSet(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (loading) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent-green)', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Synchronizing Live Matches & Fixtures...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          className={`btn-secondary ${activeTab === 'live' ? 'active' : ''}`}
          style={activeTab === 'live' ? { borderColor: 'var(--accent-red)', background: 'rgba(239, 68, 68, 0.12)', color: '#fca5a5' } : {}}
          onClick={() => setActiveTab('live')}
        >
          <span className="live-indicator-dot"></span>
          Live Matches ({matches.live_matches.length})
        </button>

        <button
          className={`btn-secondary ${activeTab === 'upcoming' ? 'active' : ''}`}
          style={activeTab === 'upcoming' ? { borderColor: 'var(--accent-cyan)', background: 'rgba(56, 189, 248, 0.12)', color: 'var(--accent-cyan)' } : {}}
          onClick={() => setActiveTab('upcoming')}
        >
          <Calendar size={15} />
          Upcoming Fixtures ({matches.upcoming_matches.length})
        </button>
      </div>

      {activeTab === 'live' && (
        <div>
          {matches.live_matches.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No matches currently in progress. Check upcoming fixtures.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
              {matches.live_matches.map((m, idx) => (
                <div key={idx} className="glass-card match-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span className="live-badge">
                      <span className="live-indicator-dot"></span>
                      IN PLAY
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.date || 'Today'}</span>
                  </div>

                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>
                    {m.name}
                  </h4>

                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-green)', marginBottom: '12px', letterSpacing: '-0.2px' }}>
                    {m.status}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <MapPin size={14} />
                    <span>{m.venue}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'upcoming' && (
        <div className="glass-card">
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Fixture</th>
                  <th>Scheduled Date</th>
                  <th>Venue</th>
                  <th style={{ textAlign: 'right' }}>Alert</th>
                </tr>
              </thead>
              <tbody>
                {matches.upcoming_matches.map((m, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{m.name}</td>
                    <td style={{ color: 'var(--accent-cyan)' }}>{m.date || 'Upcoming'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{m.venue}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => toggleReminder(m.id || idx)}
                      >
                        {reminderSet[m.id || idx] ? (
                          <>
                            <Check size={14} style={{ color: 'var(--accent-green)' }} />
                            <span style={{ color: 'var(--accent-green)' }}>Subscribed</span>
                          </>
                        ) : (
                          <>
                            <Bell size={14} />
                            <span>Notify</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
