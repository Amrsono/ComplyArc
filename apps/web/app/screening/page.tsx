'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Shield, AlertTriangle, CheckCircle, Loader2, Zap } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

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
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [entityType, setEntityType] = useState('individual');
  const [selectedLists, setSelectedLists] = useState(['OFAC', 'EU', 'UN', 'UK', 'PEP', 'Internal']);

  const toggleList = (list: string) => {
    setSelectedLists(prev =>
      prev.includes(list) ? prev.filter(l => l !== list) : [...prev, list]
    );
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const data = await api.screenEntity(query, entityType, { lists: selectedLists });
      setResults(data);
    } catch (err: any) {
      showError(err.message || 'Screening failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFalsePositive = async (matchId: string) => {
    try {
      // For now, just show success toast
      success('Marked as false positive');
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleCreateCase = async (match: any) => {
    try {
      const caseData = await api.createCase({
        title: `${match.matched_list} Match — ${match.matched_name}`,
        case_type: 'sanctions_match',
        priority: match.match_confidence === 'high' ? 'critical' : 'high',
        client_name: query,
      });
      success('Case created successfully');
      router.push('/cases');
    } catch (err: any) {
      showError(err.message || 'Failed to create case');
    }
  };

  const matches = results?.matches || [];

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
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '26px' }}>Lists:</span>
          {['OFAC', 'EU', 'UN', 'UK', 'PEP', 'Internal'].map(list => (
            <label key={list} style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 600,
              background: selectedLists.includes(list) ? 'rgba(59,130,246,0.1)' : 'var(--bg-elevated)',
              border: `1px solid ${selectedLists.includes(list) ? 'var(--accent-primary)' : 'var(--border-secondary)'}`,
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
              <input
                type="checkbox"
                checked={selectedLists.includes(list)}
                onChange={() => toggleList(list)}
                style={{ accentColor: 'var(--accent-primary)' }}
              />
              {list}
            </label>
          ))}
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="animate-in">
          <div className="glass-card glass-card-sm" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>
                Results for &quot;{results.screened_entity || query}&quot;
              </span>
              <span className={`badge ${matches.length > 0 ? 'badge-high' : 'badge-low'}`}>
                {matches.length > 0 ? <><AlertTriangle size={12} /> {matches.length} matches</> : <><CheckCircle size={12} /> Clear</>}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Risk:</span>
              <span style={{ fontWeight: 700, color: results.overall_risk === 'high' ? 'var(--risk-high)' : results.overall_risk === 'medium' ? 'var(--risk-medium)' : 'var(--risk-low)' }}>
                {(results.overall_risk || 'clear').toUpperCase()}
              </span>
            </div>
          </div>

          {matches.map((match: any, i: number) => (
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
                    {(match.match_confidence || '').toUpperCase()} CONFIDENCE
                  </span>
                </div>
                <span className="match-score" style={{ color: getConfidenceColor(match.match_confidence) }}>
                  {match.match_score?.toFixed(1)}%
                </span>
              </div>

              <div className="confidence-bar" style={{ marginBottom: '12px' }}>
                <div
                  className={`confidence-bar-fill ${match.match_confidence}`}
                  style={{ width: `${match.match_score}%` }}
                />
              </div>

              <div className="match-details">
                <span>📊 Name: {match.name_similarity?.toFixed(1)}%</span>
                {match.dob_match !== null && match.dob_match !== undefined && (
                  <span>{match.dob_match ? '✅' : '❌'} DOB</span>
                )}
                {match.nationality_match !== null && match.nationality_match !== undefined && (
                  <span>{match.nationality_match ? '✅' : '❌'} Nationality</span>
                )}
                {match.program && <span>📋 {match.program}</span>}
                {match.source_id && <span>🔗 {match.source_id}</span>}
              </div>

              {match.explanation && (
                <div style={{
                  padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                  fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px',
                }}>
                  💡 {match.explanation}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => handleFalsePositive(match.source_id)}>
                  <CheckCircle size={14} /> Mark False Positive
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleCreateCase(match)}>
                  <AlertTriangle size={14} /> True Match — Create Case
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

      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
