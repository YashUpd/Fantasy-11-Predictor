import React, { useState, useEffect } from 'react';
import { Flame, Target, TrendingUp, Zap, Loader2, Award } from 'lucide-react';

export default function AnalyticsView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load analytics", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent-green)', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Compiling Player Intelligence & Performance Metrics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>No statistics records available currently.</p>
      </div>
    );
  }

  const maxRuns = data.top_runs?.[0]?.runs || 8000;
  const maxWkts = data.top_wickets?.[0]?.wicket || 200;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Top Run Scorers */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.12)', color: 'var(--accent-cyan)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
              <Flame size={20} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 700 }}>
                All-Time Batting Leaders
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total aggregate runs</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.top_runs?.slice(0, 8).map((item, idx) => {
              const pct = (item.runs / maxRuns) * 100;
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{idx + 1}. {item.batsman}</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{Math.round(item.runs).toLocaleString()} runs</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #00ff87)', borderRadius: '3px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Wicket Takers */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
              <Target size={20} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 700 }}>
                All-Time Bowling Leaders
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total dismissals claimed</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.top_wickets?.slice(0, 8).map((item, idx) => {
              const pct = (item.wicket / maxWkts) * 100;
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{idx + 1}. {item.bowler}</span>
                    <span style={{ fontWeight: 700, color: '#f87171' }}>{item.wicket} wickets</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #f87171, #f59e0b)', borderRadius: '3px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Most 6s */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Zap size={18} style={{ color: 'var(--accent-gold)' }} />
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700 }}>Boundary Maximums (6s)</h4>
          </div>
          <table className="custom-table">
            <tbody>
              {data.top_6s?.slice(0, 5).map((p, idx) => (
                <tr key={idx}>
                  <td>{p.batsman}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-gold)' }}>{p['6s']}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Strike Rates */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <TrendingUp size={18} style={{ color: 'var(--accent-green)' }} />
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700 }}>Strike Rate Index (Min 15 Inngs)</h4>
          </div>
          <table className="custom-table">
            <tbody>
              {data.top_strike_rate?.slice(0, 5).map((p, idx) => (
                <tr key={idx}>
                  <td>{p.batsman}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-green)' }}>{p.strike_rate?.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Best Economy */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Target size={18} style={{ color: 'var(--accent-purple)' }} />
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700 }}>Economy Efficiency (Min 20 Overs)</h4>
          </div>
          <table className="custom-table">
            <tbody>
              {data.best_economy?.slice(0, 5).map((p, idx) => (
                <tr key={idx}>
                  <td>{p.bowler}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-purple)' }}>{p.economy?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
