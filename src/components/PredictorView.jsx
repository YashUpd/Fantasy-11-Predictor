import React, { useState, useEffect } from 'react';
import { 
  Upload, Sparkles, Download, CheckCircle2, AlertCircle, Users, Award, 
  Shield, Pin, Ban, Search, Filter, PlusCircle, RotateCcw, 
  Calendar, MapPin, Loader2, Star, Crown, ChevronRight, Check, Radio
} from 'lucide-react';

export default function PredictorView({ selectedMatchId, onSelectMatch }) {
  const [matches, setMatches] = useState({ live_matches: [], upcoming_matches: [] });
  const [activeMatchId, setActiveMatchId] = useState(selectedMatchId || 'live-1');
  const [squadLoading, setSquadLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState(null);

  // Match and player pool state
  const [squadData, setSquadData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [predictionData, setPredictionData] = useState(null);

  // Human-in-the-loop fact-checking state
  const [lockedPlayerNames, setLockedPlayerNames] = useState(new Set());
  const [excludedPlayerNames, setExcludedPlayerNames] = useState(new Set());
  const [preferredCaptain, setPreferredCaptain] = useState(null);
  const [preferredViceCaptain, setPreferredViceCaptain] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [playingOnly, setPlayingOnly] = useState(false);

  // Tab view: 'factcheck' vs 'formation'
  const [activeSubView, setActiveSubView] = useState('factcheck');

  // Custom player add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customTeam, setCustomTeam] = useState('');
  const [customRole, setCustomRole] = useState('batsman');

  // Custom CSV upload fallback
  const [useCustomCSV, setUseCustomCSV] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Sync prop changes
  useEffect(() => {
    if (selectedMatchId && selectedMatchId !== activeMatchId) {
      setActiveMatchId(selectedMatchId);
    }
  }, [selectedMatchId]);

  // Load matches list on mount
  useEffect(() => {
    fetch('/api/matches')
      .then(res => res.json())
      .then(data => {
        setMatches(data);
      })
      .catch(err => console.error("Error loading matches:", err));
  }, []);

  // Load squad whenever activeMatchId changes
  useEffect(() => {
    if (useCustomCSV || !activeMatchId) return;

    setSquadLoading(true);
    setError(null);
    setPredictionData(null);
    setLockedPlayerNames(new Set());
    setExcludedPlayerNames(new Set());
    setPreferredCaptain(null);
    setPreferredViceCaptain(null);

    fetch(`/api/matches/${activeMatchId}/squad`)
      .then(res => {
        if (!res.ok) throw new Error("Could not fetch match squad.");
        return res.json();
      })
      .then(data => {
        setSquadData(data);
        const pList = data.players || [];
        setPlayers(pList);
        setSquadLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Failed to load match squad. You can also upload a custom CSV.");
        setSquadLoading(false);
      });
  }, [activeMatchId, useCustomCSV]);

  // Toggle Lock (Must-Include)
  const toggleLock = (player) => {
    const name = player.name;
    setLockedPlayerNames(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
        // If locked, cannot be excluded
        setExcludedPlayerNames(ePrev => {
          const eNext = new Set(ePrev);
          eNext.delete(name);
          return eNext;
        });
      }
      return next;
    });
  };

  // Toggle Exclude (Must-Exclude / Bench)
  const toggleExclude = (player) => {
    const name = player.name;
    setExcludedPlayerNames(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
        // If excluded, cannot be locked or captain
        setLockedPlayerNames(lPrev => {
          const lNext = new Set(lPrev);
          lNext.delete(name);
          return lNext;
        });
        if (preferredCaptain === name) setPreferredCaptain(null);
        if (preferredViceCaptain === name) setPreferredViceCaptain(null);
      }
      return next;
    });
  };

  // Toggle Playing XI status for a player
  const togglePlayingStatus = (playerName) => {
    setPlayers(prev => prev.map(p => {
      if (p.name === playerName) {
        return { ...p, is_playing: !p.is_playing };
      }
      return p;
    }));
  };

  // Assign Captain preference
  const toggleCaptain = (playerName) => {
    if (preferredCaptain === playerName) {
      setPreferredCaptain(null);
    } else {
      setPreferredCaptain(playerName);
      if (preferredViceCaptain === playerName) setPreferredViceCaptain(null);
      // Automatically lock captain
      setLockedPlayerNames(prev => new Set(prev).add(playerName));
      setExcludedPlayerNames(prev => {
        const next = new Set(prev);
        next.delete(playerName);
        return next;
      });
    }
  };

  // Assign Vice-Captain preference
  const toggleViceCaptain = (playerName) => {
    if (preferredViceCaptain === playerName) {
      setPreferredViceCaptain(null);
    } else {
      setPreferredViceCaptain(playerName);
      if (preferredCaptain === playerName) setPreferredCaptain(null);
      // Automatically lock vice-captain
      setLockedPlayerNames(prev => new Set(prev).add(playerName));
      setExcludedPlayerNames(prev => {
        const next = new Set(prev);
        next.delete(playerName);
        return next;
      });
    }
  };

  // Add custom unlisted player
  const handleAddCustomPlayer = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newP = {
      name: customName.trim(),
      team: customTeam || (squadData?.teams?.[0] || 'Team 1'),
      role: customRole,
      is_playing: true,
      career_avg: customRole === 'bowler' ? 0 : 28.5,
      career_sr: customRole === 'bowler' ? 0 : 132.0,
      last_5_avg: customRole === 'bowler' ? 0 : 27.0,
      last_5_sr: customRole === 'bowler' ? 0 : 130.0,
      venue_avg: customRole === 'bowler' ? 0 : 28.0,
      career_wickets: customRole === 'batsman' ? 0 : 1.3,
      career_eco: customRole === 'batsman' ? 0 : 7.9,
      last_5_wkts: customRole === 'batsman' ? 0 : 1.4,
      venue_wickets: customRole === 'batsman' ? 0 : 1.3,
    };

    setPlayers(prev => [newP, ...prev]);
    setLockedPlayerNames(prev => new Set(prev).add(newP.name));
    setCustomName('');
    setShowAddModal(false);
  };

  // Reset all human-in-the-loop locks and excludes
  const handleResetFilters = () => {
    setLockedPlayerNames(new Set());
    setExcludedPlayerNames(new Set());
    setPreferredCaptain(null);
    setPreferredViceCaptain(null);
    setSearchQuery('');
    setTeamFilter('all');
    setRoleFilter('all');
    setPlayingOnly(false);
  };

  // Run AI Optimization Pipeline
  const handleRunOptimization = async () => {
    setOptimizing(true);
    setError(null);
    try {
      if (useCustomCSV && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const res = await fetch('/api/predict', {
          method: 'POST',
          body: formData
        });
        if (!res.ok) throw new Error(`Optimization failed: ${res.statusText}`);
        const data = await res.json();
        setPredictionData(data);
        setActiveSubView('formation');
      } else {
        // Send human fact-checked pool and preferences
        const payload = {
          players: players,
          locked_players: Array.from(lockedPlayerNames),
          excluded_players: Array.from(excludedPlayerNames),
          preferred_captain: preferredCaptain,
          preferred_vice_captain: preferredViceCaptain
        };

        const res = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`Optimization failed: ${res.statusText}`);
        const data = await res.json();
        setPredictionData(data);
        setActiveSubView('formation');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to generate optimal lineup.');
    } finally {
      setOptimizing(false);
    }
  };

  // Download CSV
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

  // Filtered players for review
  const filteredPlayers = players.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam = teamFilter === 'all' || p.team === teamFilter;
    const matchesRole = roleFilter === 'all' || p.role?.toLowerCase() === roleFilter;
    const matchesPlaying = !playingOnly || p.is_playing;
    return matchesSearch && matchesTeam && matchesRole && matchesPlaying;
  });

  const allAvailableMatches = [...matches.live_matches, ...matches.upcoming_matches];
  const currentMatchInfo = allAvailableMatches.find(m => m.id === activeMatchId);

  // Render Tactical Pitch Role Band
  const renderPitchRole = (roleKey, title) => {
    if (!predictionData || !predictionData.best_11) return null;
    const rolePlayers = predictionData.best_11.filter(p => p.role?.toLowerCase() === roleKey);
    if (rolePlayers.length === 0) return null;

    return (
      <div className="pitch-section">
        <div className="pitch-section-title">{title} ({rolePlayers.length})</div>
        <div className="pitch-grid">
          {rolePlayers.map((player, idx) => (
            <div 
              key={idx} 
              className={`player-card ${player.is_captain ? 'captain' : ''} ${player.is_vice_captain ? 'vice-captain' : ''}`}
            >
              {player.is_captain && <div className="badge-c" title="Captain (2x Points)">C</div>}
              {player.is_vice_captain && <div className="badge-vc" title="Vice-Captain (1.5x Points)">VC</div>}
              {player.is_locked && (
                <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'var(--accent-gold)', color: '#000', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }} title="User Locked Choice">
                  📌
                </div>
              )}
              <div className="player-avatar">
                {player.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="player-name" title={player.name}>{player.name}</div>
              <div className="player-team">{player.team || player.team1 || 'Player'}</div>
              <div className="player-points">{player.fantasy_points || player.predicted_points} pts</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* 1. Live Match Selector Bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={16} style={{ color: 'var(--accent-green)' }} />
            <span>Select Match for Live Intelligence & Fact-Checking:</span>
          </h3>

          <button 
            className={`btn-secondary ${useCustomCSV ? 'active' : ''}`}
            style={{ fontSize: '12px', padding: '6px 12px' }}
            onClick={() => setUseCustomCSV(!useCustomCSV)}
          >
            <Upload size={14} />
            <span>{useCustomCSV ? 'Use Live API Matches' : 'Upload Custom CSV'}</span>
          </button>
        </div>

        {!useCustomCSV ? (
          <div className="match-selector-grid">
            {allAvailableMatches.map((m) => {
              const isActive = m.id === activeMatchId;
              const isLive = m.status?.includes('/') || m.raw_status?.includes('Live') || m.id.startsWith('live');
              return (
                <div 
                  key={m.id}
                  className={`match-select-card ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setActiveMatchId(m.id);
                    if (onSelectMatch) onSelectMatch(m.id);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    {isLive ? (
                      <span className="live-badge" style={{ fontSize: '9px', padding: '2px 6px' }}>
                        <span className="live-indicator-dot" style={{ width: '5px', height: '5px' }}></span>
                        LIVE
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 600 }}>FIXTURE</span>
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.date}</span>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px', lineHeight: '1.3' }}>
                    {m.name}
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 600, marginBottom: '6px' }}>
                    {m.status}
                  </div>

                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={11} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.venue}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
            <label className="btn-primary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
              <Upload size={16} />
              <span>{selectedFile ? selectedFile.name : 'Choose Player CSV File'}</span>
              <input 
                type="file" 
                accept=".csv" 
                onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} 
                style={{ display: 'none' }} 
              />
            </label>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Upload any custom match player CSV with role and statistics columns.
            </p>
          </div>
        )}
      </div>

      {error && (
        <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Top View Switcher (Fact-Check Pool vs AI Formation) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn-secondary ${activeSubView === 'factcheck' ? 'active' : ''}`}
            style={activeSubView === 'factcheck' ? { borderColor: 'var(--accent-green)', background: 'rgba(0, 255, 135, 0.12)', color: 'var(--accent-green)' } : {}}
            onClick={() => setActiveSubView('factcheck')}
          >
            <Users size={15} />
            <span>Human Fact-Checking Pool ({players.length})</span>
          </button>

          <button
            className={`btn-secondary ${activeSubView === 'formation' ? 'active' : ''}`}
            style={activeSubView === 'formation' ? { borderColor: 'var(--accent-cyan)', background: 'rgba(56, 189, 248, 0.12)', color: 'var(--accent-cyan)' } : {}}
            onClick={() => setActiveSubView('formation')}
            disabled={!predictionData}
          >
            <Sparkles size={15} />
            <span>Optimal 11 Formation</span>
          </button>
        </div>

        <button 
          className="btn-primary" 
          onClick={handleRunOptimization} 
          disabled={optimizing || squadLoading}
          style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 700 }}
        >
          {optimizing ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              <span>Optimizing AI 11...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Generate AI Optimal 11</span>
            </>
          )}
        </button>
      </div>

      {squadLoading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent-green)', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Extracting Verified Match Squad & Live Lineups...</p>
        </div>
      ) : activeSubView === 'factcheck' ? (
        /* 3. Human-in-the-Loop Fact-Checking Hub */
        <div className="factcheck-container">
          {/* Fact-Check Toolbar */}
          <div className="factcheck-toolbar">
            <div className="factcheck-pills">
              <span className="pill-stat active-pool">
                <span>Total Pool: {players.length}</span>
              </span>
              <span className="pill-stat locked">
                <Pin size={12} />
                <span>Locked: {lockedPlayerNames.size}</span>
              </span>
              <span className="pill-stat excluded">
                <Ban size={12} />
                <span>Excluded: {excludedPlayerNames.size}</span>
              </span>
              {preferredCaptain && (
                <span className="pill-stat" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-gold)' }}>
                  <Crown size={12} />
                  <span>C: {preferredCaptain}</span>
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button 
                className="btn-secondary" 
                style={{ fontSize: '11px', padding: '5px 10px' }}
                onClick={() => setShowAddModal(true)}
              >
                <PlusCircle size={13} />
                <span>Add Toss Debutant</span>
              </button>

              <button 
                className="btn-secondary" 
                style={{ fontSize: '11px', padding: '5px 10px' }}
                onClick={handleResetFilters}
              >
                <RotateCcw size={13} />
                <span>Reset Selections</span>
              </button>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="glass-card" style={{ padding: '14px 18px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Filter players by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px 8px 36px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Team Filter */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  className={`btn-secondary ${teamFilter === 'all' ? 'active' : ''}`}
                  style={{ fontSize: '11px', padding: '6px 10px' }}
                  onClick={() => setTeamFilter('all')}
                >
                  Both Teams
                </button>
                {squadData?.teams?.map((t, idx) => (
                  <button
                    key={idx}
                    className={`btn-secondary ${teamFilter === t ? 'active' : ''}`}
                    style={{ fontSize: '11px', padding: '6px 10px' }}
                    onClick={() => setTeamFilter(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Role Filter */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['all', 'wicketkeeper', 'batsman', 'allrounder', 'bowler'].map((r) => (
                  <button
                    key={r}
                    className={`btn-secondary ${roleFilter === r ? 'active' : ''}`}
                    style={{ fontSize: '11px', padding: '6px 10px', textTransform: 'uppercase' }}
                    onClick={() => setRoleFilter(r)}
                  >
                    {r === 'all' ? 'All Roles' : r === 'wicketkeeper' ? 'WK' : r === 'allrounder' ? 'AR' : r === 'bowler' ? 'BOWL' : 'BAT'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Player Cards Pool Grid */}
          <div className="player-pool-grid">
            {filteredPlayers.map((player, idx) => {
              const isLocked = lockedPlayerNames.has(player.name);
              const isExcluded = excludedPlayerNames.has(player.name);
              const isCap = preferredCaptain === player.name;
              const isVC = preferredViceCaptain === player.name;

              return (
                <div 
                  key={idx} 
                  className={`pool-player-card ${isLocked ? 'is-locked' : ''} ${isExcluded ? 'is-excluded' : ''}`}
                >
                  {isLocked && <span className="badge-locked-tag">📌 LOCKED</span>}
                  {isExcluded && <span className="badge-excluded-tag">🚫 EXCLUDED</span>}

                  <div className="pool-card-header">
                    <div className="pool-avatar">
                      {player.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="pool-info">
                      <div className="pool-name" title={player.name}>
                        {player.name}
                      </div>
                      <div className="pool-meta">
                        <span style={{ color: 'var(--text-secondary)' }}>{player.team}</span>
                        <span>•</span>
                        <span className={`role-badge ${player.role?.toLowerCase()}`} style={{ padding: '1px 6px', fontSize: '9px' }}>
                          {player.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Career & Form Performance Stats */}
                  <div className="pool-stats-row">
                    <div>
                      {player.role?.toLowerCase() === 'bowler' ? (
                        <span>Wkts: <b>{player.career_wickets || 0}</b> | Eco: <b>{player.career_eco || 0}</b></span>
                      ) : (
                        <span>Avg: <b>{player.career_avg || 0}</b> | SR: <b>{player.career_sr || 0}</b></span>
                      )}
                    </div>
                    <div 
                      onClick={() => togglePlayingStatus(player.name)}
                      style={{ cursor: 'pointer', fontSize: '10px', color: player.is_playing ? 'var(--accent-green)' : 'var(--text-muted)' }}
                      title="Click to toggle Playing XI status"
                    >
                      {player.is_playing ? '● Playing XI' : '○ Benched'}
                    </div>
                  </div>

                  {/* Fact-checking Action Controls */}
                  <div className="pool-actions">
                    <button 
                      className={`btn-lock ${isLocked ? 'active' : ''}`}
                      onClick={() => toggleLock(player)}
                      title="Lock into Dream11 Squad"
                    >
                      <Pin size={12} />
                      <span>{isLocked ? 'Locked' : 'Must Have'}</span>
                    </button>

                    <button 
                      className={`btn-exclude ${isExcluded ? 'active' : ''}`}
                      onClick={() => toggleExclude(player)}
                      title="Exclude from squad (benched / injured)"
                    >
                      <Ban size={12} />
                      <span>{isExcluded ? 'Excluded' : 'Exclude'}</span>
                    </button>

                    <button
                      className="btn-secondary"
                      style={{ padding: '6px 8px', fontSize: '11px', color: isCap ? 'var(--accent-gold)' : undefined, borderColor: isCap ? 'var(--accent-gold)' : undefined }}
                      onClick={() => toggleCaptain(player.name)}
                      title="Preferred Captain (2x)"
                    >
                      <Crown size={12} />
                      <span>{isCap ? 'C' : 'Cap'}</span>
                    </button>

                    <button
                      className="btn-secondary"
                      style={{ padding: '6px 8px', fontSize: '11px', color: isVC ? 'var(--accent-cyan)' : undefined, borderColor: isVC ? 'var(--accent-cyan)' : undefined }}
                      onClick={() => toggleViceCaptain(player.name)}
                      title="Preferred Vice-Captain (1.5x)"
                    >
                      <Star size={12} />
                      <span>{isVC ? 'VC' : 'VC'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPlayers.length === 0 && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '40px', marginTop: '16px' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No players found matching your search and filter criteria.</p>
            </div>
          )}
        </div>
      ) : (
        /* 4. Optimized Dream11 Team (Tactical Pitch & Lineup) */
        predictionData && (
          <div>
            {/* KPI Summary Cards */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon" style={{ background: 'rgba(0, 255, 135, 0.12)', color: 'var(--accent-green)' }}>
                  <Sparkles size={22} />
                </div>
                <div>
                  <div className="kpi-value">{predictionData.stats?.total_points}</div>
                  <div className="kpi-label">Projected Fantasy Points</div>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-gold)' }}>
                  <Crown size={22} />
                </div>
                <div>
                  <div className="kpi-value">{predictionData.stats?.captain || 'N/A'}</div>
                  <div className="kpi-label">Captain (2x Points)</div>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon" style={{ background: 'rgba(56, 189, 248, 0.12)', color: 'var(--accent-cyan)' }}>
                  <Star size={22} />
                </div>
                <div>
                  <div className="kpi-value">{predictionData.stats?.vice_captain || 'N/A'}</div>
                  <div className="kpi-label">Vice-Captain (1.5x Points)</div>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: 'var(--accent-purple)' }}>
                  <Pin size={22} />
                </div>
                <div>
                  <div className="kpi-value">{predictionData.stats?.locked_count || 0} Honored</div>
                  <div className="kpi-label">Human Locks Included</div>
                </div>
              </div>
            </div>

            {/* Tactical Pitch Formation */}
            <div className="glass-card" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700 }}>
                  Tactical Pitch Formation
                </h3>
                <button 
                  className="btn-secondary" 
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  onClick={() => setActiveSubView('factcheck')}
                >
                  <Users size={14} />
                  <span>Adjust Fact-Checked Squad</span>
                </button>
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

            {/* Detailed Selected Lineup Intelligence Table */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700 }}>
                    Selected Squad Intelligence
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Dream11 rules enforced (Max 7 per team, balanced role constraints, user locks honored)
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-secondary" onClick={() => setActiveSubView('factcheck')}>
                    <span>Edit Fact-Check</span>
                  </button>
                  <button className="btn-primary" onClick={downloadCSV}>
                    <Download size={15} />
                    <span>Export Lineup (.csv)</span>
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Player</th>
                      <th>Team</th>
                      <th>Role</th>
                      <th>Multiplier / Status</th>
                      <th>Career Metrics</th>
                      <th>Recent Form</th>
                      <th>Base Projected</th>
                      <th>Weighted Fantasy Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictionData.best_11.map((p, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 700 }}>{p.name}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{p.team || p.team1 || '-'}</td>
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
                          {p.is_locked && (
                            <span style={{ marginLeft: '4px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-gold)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>
                              📌 USER LOCK
                            </span>
                          )}
                          {!p.is_captain && !p.is_vice_captain && !p.is_locked && (
                            <span style={{ color: 'var(--text-muted)' }}>Standard (1x)</span>
                          )}
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
          </div>
        )
      )}

      {/* Modal: Add Toss Debutant */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, marginBottom: '14px' }}>
              Add Toss Replacement / Debutant
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Include an uncapped or last-minute starter announced at the toss into the fact-checked player pool.
            </p>

            <form onSubmit={handleAddCustomPlayer}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Player Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Yashasvi Jaiswal"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Team</label>
                <select 
                  value={customTeam}
                  onChange={(e) => setCustomTeam(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}
                >
                  {squadData?.teams?.map((t, idx) => (
                    <option key={idx} value={t}>{t}</option>
                  ))}
                  <option value="Team A">Team A</option>
                  <option value="Team B">Team B</option>
                </select>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Role</label>
                <select 
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}
                >
                  <option value="batsman">Batsman (BAT)</option>
                  <option value="wicketkeeper">Wicket-Keeper (WK)</option>
                  <option value="allrounder">All-Rounder (AR)</option>
                  <option value="bowler">Bowler (BOWL)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add & Lock Player
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
