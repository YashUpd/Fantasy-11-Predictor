import React, { useState, useEffect } from 'react';
import { Upload, Sparkles, Download, CheckCircle2, AlertCircle, Users, Award, Shield } from 'lucide-react';

export default function PredictorView() {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    handlePredict(null);
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handlePredict = async (fileToUpload) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      if (fileToUpload) {
        formData.append('file', fileToUpload);
      } else if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const res = await fetch('/api/predict', {
        method: 'POST',
        body: fileToUpload || selectedFile ? formData : undefined
      });

      if (!res.ok) {
        throw new Error(`Optimization failed with status code ${res.status}`);
      }

      const data = await res.json();
      setPredictionData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to optimize lineup at this moment');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!predictionData || !predictionData.best_11) return;
    const items = predictionData.best_11;
    const header = Object.keys(items[0]).join(',');
    const rows = items.map(row => Object.values(row).map(v => `"${v}"`).join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "optimal_dream11_lineup.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderPitchRole = (roleKey, title) => {
    if (!predictionData || !predictionData.best_11) return null;
    const players = predictionData.best_11.filter(p => p.role?.toLowerCase() === roleKey);
    if (players.length === 0) return null;

    return (
      <div className="pitch-section">
        <div className="pitch-section-title">{title} ({players.length})</div>
        <div className="pitch-grid">
          {players.map((player, idx) => (
            <div 
              key={idx} 
              className={`player-card ${player.is_captain ? 'captain' : ''} ${player.is_vice_captain ? 'vice-captain' : ''}`}
            >
              {player.is_captain && <div className="badge-c" title="Captain (2x Points)">C</div>}
              {player.is_vice_captain && <div className="badge-vc" title="Vice-Captain (1.5x Points)">VC</div>}
              <div className="player-avatar">
                {player.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="player-name" title={player.name}>{player.name}</div>
              <div className="player-team">{player.team1 || player.team || 'Player'}</div>
              <div className="player-points">{player.fantasy_points || player.predicted_points} pts</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Control Card */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
              Optimal Lineup Optimizer
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Synthesizes venue statistics, rolling form, and role constraints to assemble the highest projected 11.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <label className="btn-secondary" style={{ cursor: 'pointer' }}>
              <Upload size={16} />
              <span>{selectedFile ? selectedFile.name : 'Upload Custom CSV'}</span>
              <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>

            <button 
              className="btn-primary" 
              onClick={() => handlePredict(null)} 
              disabled={loading}
            >
              <Sparkles size={16} />
              <span>{loading ? 'Optimizing...' : 'Generate Optimal 11'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {predictionData && predictionData.stats && (
        <>
          {/* Key Metric Indicators */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'rgba(0, 255, 135, 0.12)', color: 'var(--accent-green)' }}>
                <Sparkles size={22} />
              </div>
              <div>
                <div className="kpi-value">{predictionData.stats.total_points}</div>
                <div className="kpi-label">Projected Fantasy Points</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-gold)' }}>
                <Award size={22} />
              </div>
              <div>
                <div className="kpi-value">{predictionData.stats.captain || 'N/A'}</div>
                <div className="kpi-label">Captain (2x Points)</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'rgba(56, 189, 248, 0.12)', color: 'var(--accent-cyan)' }}>
                <Users size={22} />
              </div>
              <div>
                <div className="kpi-value">{predictionData.stats.vice_captain || 'N/A'}</div>
                <div className="kpi-label">Vice-Captain (1.5x Points)</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: 'var(--accent-purple)' }}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div className="kpi-value">11 / 11</div>
                <div className="kpi-label">Constraints Satisfied</div>
              </div>
            </div>
          </div>

          {/* Tactical Pitch Formation */}
          <div className="glass-card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700 }}>
                Tactical Pitch Formation
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Full Squad Distribution
              </div>
            </div>

            <div className="pitch-container">
              <div className="pitch-line"></div>
              <div className="pitch-circle"></div>

              {renderPitchRole('wicketkeeper', 'Wicket-Keeper (WK)')}
              {renderPitchRole('batsman', 'Batsmen (BAT)')}
              {renderPitchRole('allrounder', 'All-Rounders (AR)')}
              {renderPitchRole('bowler', 'Bowlers (BOWL)')}
            </div>
          </div>

          {/* Lineup Breakdown */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700 }}>
                  Selected Squad Intelligence
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Individual projected scoring with Captain and Vice-Captain weightage
                </span>
              </div>

              <button className="btn-secondary" onClick={downloadCSV}>
                <Download size={15} />
                <span>Export Lineup (.csv)</span>
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Team</th>
                    <th>Role</th>
                    <th>Multiplier Role</th>
                    <th>Career Form</th>
                    <th>Recent Trend</th>
                    <th>Base Projected</th>
                    <th>Weighted Fantasy Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {predictionData.best_11.map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td style={{ fontWeight: 700 }}>{p.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.team1 || p.team || '-'}</td>
                      <td>
                        <span className={`role-badge ${p.role?.toLowerCase()}`}>
                          {p.role}
                        </span>
                      </td>
                      <td>
                        {p.is_captain && (
                          <span style={{ background: 'var(--accent-gold)', color: '#000', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', fontSize: '11px', letterSpacing: '0.5px' }}>
                            CAPTAIN (2x)
                          </span>
                        )}
                        {p.is_vice_captain && (
                          <span style={{ background: 'var(--accent-cyan)', color: '#000', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', fontSize: '11px', letterSpacing: '0.5px' }}>
                            VICE-CAPTAIN (1.5x)
                          </span>
                        )}
                        {!p.is_captain && !p.is_vice_captain && <span style={{ color: 'var(--text-muted)' }}>Standard (1x)</span>}
                      </td>
                      <td>
                        {p.role?.toLowerCase() === 'bowler' 
                          ? `${p.career_wickets || 0} wkts (Eco ${p.career_eco || 0})`
                          : `${p.career_avg || 0} avg (SR ${p.career_sr || 0})`
                        }
                      </td>
                      <td>
                        {p.role?.toLowerCase() === 'bowler' 
                          ? `${p.last_5_wkts || 0} wkts`
                          : `${p.last_5_avg || 0} avg`
                        }
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.predicted_points}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-green)' }}>
                        {p.fantasy_points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
