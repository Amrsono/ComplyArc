'use client';

import { useState } from 'react';
import { Search, Shield, AlertTriangle, CheckCircle, ChevronDown, Loader2, Zap } from 'lucide-react';

/* ─── Demo Screening Results ──────────────────── */
const demoResults = [
  {
    matched_name: 'JOHN A. SMITH',
    matched_list: 'OFAC',
    match_score: 87.5,
    match_confidence: 'high',
    name_similarity: 92.3,
    dob_match: true,
    nationality_match: false,
    program: 'SDGT',
    explanation: 'Name similarity: 92.3% | DOB: Match ✓ | Nationality: No match ✗ | Source: OFAC | Program: SDGT',
    source_id: 'SDN-12345',
    listed_date: '2019-06-15',
  },
  {
    matched_name: 'JONATHAN SMITH',
    matched_list: 'EU',
    match_score: 62.4,
    match_confidence: 'low',
    name_similarity: 68.1,
    dob_match: null,
    nationality_match: null,
    program: 'EU Council Regulation 269/2014',
    explanation: 'Name similarity: 68.1% | DOB: Not available | Nationality: Not available | Source: EU',
    source_id: 'EU-98765',
    listed_date: '2022-03-01',
  },
  {
    matched_name: 'JOHN SMITH',
    matched_list: 'PEP',
    match_score: 71.8,
    match_confidence: 'medium',
    name_similarity: 85.0,
    dob_match: false,
    nationality_match: true,
    program: 'Political Figure — UK Parliament',
    explanation: 'Name similarity: 85.0% | DOB: No match ✗ | Nationality: Match ✓ | Source: PEP',
    source_id: 'PEP-44321',
    listed_date: null,
  },
];

function getConfidenceColor(confidence: string) {
  switch (confidence) {
    case 'high': return 'var(--risk-high)';
    case 'medium': return 'var(--risk-medium)';
    case 'low': return 'var(--risk-low)';
    default: return 'var(--text-tertiary)';
  }
}

function getListBadgeStyle(list: string) {
  const colors: Record<string, string> = {
    OFAC: '#ef4444', EU: '#3b82f6', UN: '#8b5cf6', UK: '#06b6d4', PEP: '#f59e0b',
  };
  const bg = colors[list] || '#6b7280';
  return { background: `${bg}22`, color: bg, border: `1px solid ${bg}44` };
}

export default function ScreeningPage() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<typeof demoResults | null>(null);
  const [entityType, setEntityType] = useState('individual');

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      setResults(demoResults);
      setIsSearching(false);
    }, 1200);
  };

  return (
    <div>
      <div className="page-header animate-in">
        <h2>Entity Screening</h2>
        <p>Screen entities against OFAC, EU, UN, UK sanctions lists and PEP databases</p>
      </div>

      {/* Search Card */}
      <div className="glass-card animate-in animate-in-delay-1" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ flex: 2, minWidth: '300px' }}>
            <label>Entity Name</label>
            <div className="search-wrapper">
              <Search className="search-icon" size={18} />
              <input
                className="search-input"
                placeholder="Enter name to screen (e.g., John Smith, ABC Trading LLC)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                id="screening-search-input"
              />
            </div>
          </div>

          <div className="input-group" style={{ minWidth: '160px' }}>
            <label>Entity Type</label>
            <select
              className="input"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              id="screening-entity-type"
            >
              <option value="individual">Individual</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>

          <button
            className="btn btn-primary btn-lg"
            onClick={handleSearch}
            disabled={isSearching}
            id="screening-search-btn"
            style={{ minWidth: '160px', height: '46px' }}
          >
            {isSearching ? (
              <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Screening...</>
            ) : (
              <><Shield size={18} /> Screen Entity</>
            )}
          </button>
        </div>

        {/* Lists selector */}
        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '26px' }}>
            Lists:
          </span>
          {['OFAC', 'EU', 'UN', 'UK', 'PEP', 'Internal'].map(list => (
            <label key={list} style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 600,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-secondary)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent-primary)' }} />
              {list}
            </label>
          ))}
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="animate-in">
          {/* Summary Bar */}
          <div className="glass-card glass-card-sm" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>
                Results for &quot;{query || 'John Smith'}&quot;
              </span>
              <span className="badge badge-high">
                <AlertTriangle size={12} /> {results.length} matches found
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Highest Match:</span>
              <span style={{ fontWeight: 700, color: 'var(--risk-high)', fontSize: '18px' }}>
                {results[0].match_score}%
              </span>
            </div>
          </div>

          {/* Match Cards */}
          {results.map((match, i) => (
            <div className="match-card" key={i}>
              <div className="match-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="match-name">{match.matched_name}</span>
                  <span className="badge" style={getListBadgeStyle(match.matched_list)}>
                    {match.matched_list}
                  </span>
                  <span className="badge" style={{
                    background: `${getConfidenceColor(match.match_confidence)}18`,
                    color: getConfidenceColor(match.match_confidence),
                    border: `1px solid ${getConfidenceColor(match.match_confidence)}33`,
                  }}>
                    {match.match_confidence.toUpperCase()} CONFIDENCE
                  </span>
                </div>
                <span className="match-score" style={{ color: getConfidenceColor(match.match_confidence) }}>
                  {match.match_score}%
                </span>
              </div>

              {/* Confidence Bar */}
              <div className="confidence-bar" style={{ marginBottom: '12px' }}>
                <div
                  className={`confidence-bar-fill ${match.match_confidence}`}
                  style={{ width: `${match.match_score}%` }}
                />
              </div>

              {/* Details */}
              <div className="match-details">
                <span>📊 Name: {match.name_similarity}%</span>
                {match.dob_match !== null && (
                  <span>{match.dob_match ? '✅' : '❌'} DOB</span>
                )}
                {match.nationality_match !== null && (
                  <span>{match.nationality_match ? '✅' : '❌'} Nationality</span>
                )}
                {match.program && <span>📋 {match.program}</span>}
                {match.source_id && <span>🔗 {match.source_id}</span>}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button className="btn btn-secondary btn-sm">
                  <CheckCircle size={14} /> Mark False Positive
                </button>
                <button className="btn btn-danger btn-sm">
                  <AlertTriangle size={14} /> True Match — Create Case
                </button>
                <button className="btn btn-secondary btn-sm">
                  <Zap size={14} /> AI Explain
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!results && !isSearching && (
        <div className="glass-card animate-in animate-in-delay-2" style={{
          textAlign: 'center', padding: '64px 24px',
        }}>
          <Search size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            Start Screening
          </h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
            Enter an entity name above to screen against OFAC, EU, UN, UK sanctions lists and PEP databases.
            Results include confidence scores and match explanations.
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
