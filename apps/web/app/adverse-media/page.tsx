'use client';

import { Search, AlertTriangle, Zap, Newspaper, ExternalLink, Loader2 } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export default function AdverseMediaPage() {
  const { error: showError } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const data = await api.searchMedia(query);
      setResults(data);
    } catch (err: any) {
      showError(err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const articles = results?.articles || results?.results || [];
  const summary = results?.ai_summary || results?.summary || null;

  return (
    <div>
      <div className="page-header animate-in">
        <h2>Adverse Media Intelligence</h2>
        <p>AI-powered news analysis with risk classification and entity extraction</p>
      </div>

      <div className="glass-card animate-in animate-in-delay-1" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="search-wrapper" style={{ flex: 1 }}>
            <Search className="search-icon" size={18} />
            <input
              className="search-input"
              placeholder="Search adverse media for entity (e.g., ABC Trading LLC)"
              value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="btn btn-primary" onClick={handleSearch} disabled={searching} style={{ minWidth: '180px' }}>
            {searching ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</> : <><Zap size={16} /> AI Media Scan</>}
          </button>
        </div>
      </div>

      {results && (
        <div className="animate-in">
          <div className="glass-card glass-card-sm" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>AI Analysis Complete</span>
              <span style={{ color: 'var(--text-secondary)', marginLeft: '12px', fontSize: '13px' }}>
                {articles.length} articles analyzed
              </span>
            </div>
            {articles.some((r: any) => r.severity === 'high') && (
              <div className="badge badge-high"><AlertTriangle size={12} /> Elevated Risk</div>
            )}
          </div>

          {summary && (
            <div className="glass-card" style={{ marginBottom: '20px', borderLeft: '3px solid var(--accent-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Zap size={16} color="var(--accent-primary)" />
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--accent-primary)' }}>AI Risk Summary</span>
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{summary}</p>
            </div>
          )}

          {articles.map((r: any, i: number) => (
            <div key={i} className="glass-card" style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Newspaper size={18} color="var(--text-secondary)" />
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{r.title}</span>
                </div>
                <span className={`badge badge-${r.severity || 'medium'}`}>{(r.category || 'general').replace('_', ' ')}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '10px' }}>
                {r.source} · {r.date || r.published_date} {r.url && r.url !== '#' && <> · <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)' }}>View Source <ExternalLink size={10} style={{ display: 'inline' }} /></a></>}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>{r.summary}</p>

              <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                {r.relevance !== undefined && (
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Relevance</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="confidence-bar" style={{ width: '80px' }}>
                        <div className={`confidence-bar-fill ${r.relevance >= 70 ? 'high' : r.relevance >= 50 ? 'medium' : 'low'}`} style={{ width: `${r.relevance}%` }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{r.relevance}%</span>
                    </div>
                  </div>
                )}
                {r.confidence !== undefined && (
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Confidence</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="confidence-bar" style={{ width: '80px' }}>
                        <div className={`confidence-bar-fill ${r.confidence >= 70 ? 'high' : r.confidence >= 50 ? 'medium' : 'low'}`} style={{ width: `${r.confidence}%` }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{r.confidence}%</span>
                    </div>
                  </div>
                )}
              </div>

              {r.risk_impact && (
                <div style={{
                  padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                  fontSize: '12px', color: 'var(--risk-medium)',
                }}>
                  ⚠ {r.risk_impact}
                </div>
              )}
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

      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
