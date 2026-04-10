'use client';

import { Search, AlertTriangle, Zap, Newspaper, ExternalLink } from 'lucide-react';
import { useState } from 'react';

const demoResults = [
  {
    title: 'Investigation reveals potential financial irregularities in UAE trade sector',
    source: 'Financial Times', url: '#', date: '2024-06-15',
    category: 'fraud', severity: 'high', relevance: 78, confidence: 72,
    summary: 'Article discusses potential financial fraud involving multiple trade finance entities operating in the UAE free zones. Authorities examining transactions spanning multiple jurisdictions.',
    risk_impact: 'Potential fraud association may increase client risk score by +1.0',
  },
  {
    title: 'Regulatory bodies increase scrutiny of corporate service providers',
    source: 'Reuters', url: '#', date: '2024-05-20',
    category: 'corruption', severity: 'medium', relevance: 62, confidence: 58,
    summary: 'Multiple regulatory bodies have increased their scrutiny of business operations following whistleblower complaints about inadequate due diligence procedures.',
    risk_impact: 'Regulatory attention suggests elevated compliance risk. Score impact: +0.5',
  },
  {
    title: 'New sanctions compliance requirements for financial institutions',
    source: 'Bloomberg', url: '#', date: '2024-04-10',
    category: 'sanctions_evasion', severity: 'low', relevance: 45, confidence: 40,
    summary: 'Industry-wide regulatory update about new sanctions compliance requirements. Not directly related to specific entity but may affect sector.',
    risk_impact: 'Minimal direct compliance impact. Score impact: +0.1',
  },
];

export default function AdverseMediaPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<typeof demoResults | null>(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearching(true);
    setTimeout(() => { setResults(demoResults); setSearching(false); }, 1500);
  };

  return (
    <div>
      <div className="page-header animate-in">
        <h2>Adverse Media Intelligence</h2>
        <p>AI-powered news analysis with risk classification and entity extraction</p>
      </div>

      {/* Search */}
      <div className="glass-card animate-in animate-in-delay-1" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="search-wrapper" style={{ flex: 1 }}>
            <Search className="search-icon" size={18} />
            <input
              className="search-input"
              placeholder="Search adverse media for entity (e.g., ABC Trading LLC)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="btn btn-primary" onClick={handleSearch} disabled={searching} style={{ minWidth: '180px' }}>
            {searching ? '⟳ Analyzing...' : <><Zap size={16} /> AI Media Scan</>}
          </button>
        </div>
      </div>

      {results && (
        <div className="animate-in">
          {/* Summary */}
          <div className="glass-card glass-card-sm" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>AI Analysis Complete</span>
              <span style={{ color: 'var(--text-secondary)', marginLeft: '12px', fontSize: '13px' }}>
                {results.length} articles analyzed · {results.filter(r => r.severity === 'high').length} high-severity findings
              </span>
            </div>
            <div className="badge badge-high"><AlertTriangle size={12} /> Elevated Risk</div>
          </div>

          {/* AI Summary */}
          <div className="glass-card" style={{ marginBottom: '20px', borderLeft: '3px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Zap size={16} color="var(--accent-primary)" />
              <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--accent-primary)' }}>AI Risk Summary</span>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              Entity linked to <strong style={{ color: 'var(--text-primary)' }}>2 independent fraud-related allegations</strong> across 
              financial press (2024). Coverage from credible sources (Financial Times, Reuters) suggests 
              <strong style={{ color: 'var(--risk-medium)' }}> medium-to-high compliance risk</strong>. 
              Recommended action: Enhanced due diligence review and consideration for risk score adjustment of +0.5 to +1.0 points.
            </p>
          </div>

          {/* Results */}
          {results.map((r, i) => (
            <div key={i} className="glass-card" style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Newspaper size={18} color="var(--text-secondary)" />
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{r.title}</span>
                </div>
                <span className={`badge badge-${r.severity}`}>{r.category.replace('_', ' ')}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '10px' }}>
                {r.source} · {r.date} · <a href={r.url} style={{ color: 'var(--accent-primary)' }}>View Source <ExternalLink size={10} style={{ display: 'inline' }} /></a>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>{r.summary}</p>
              
              {/* Scores */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Relevance</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div className="confidence-bar" style={{ width: '80px' }}>
                      <div className={`confidence-bar-fill ${r.relevance >= 70 ? 'high' : r.relevance >= 50 ? 'medium' : 'low'}`} style={{ width: `${r.relevance}%` }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{r.relevance}%</span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Confidence</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div className="confidence-bar" style={{ width: '80px' }}>
                      <div className={`confidence-bar-fill ${r.confidence >= 70 ? 'high' : r.confidence >= 50 ? 'medium' : 'low'}`} style={{ width: `${r.confidence}%` }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{r.confidence}%</span>
                  </div>
                </div>
              </div>

              <div style={{
                padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                fontSize: '12px', color: 'var(--risk-medium)',
              }}>
                ⚠ {r.risk_impact}
              </div>
            </div>
          ))}
        </div>
      )}

      {!results && !searching && (
        <div className="glass-card animate-in animate-in-delay-2" style={{ textAlign: 'center', padding: '64px' }}>
          <Newspaper size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>AI-Powered Media Analysis</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', margin: '0 auto' }}>
            Search for an entity to scan news sources using AI. Articles are automatically classified
            by risk category (fraud, corruption, terrorism) with relevance and confidence scoring.
          </p>
        </div>
      )}
    </div>
  );
}
