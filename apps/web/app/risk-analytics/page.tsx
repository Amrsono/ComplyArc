'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, Cell,
} from 'recharts';
import { BarChart3, Globe, TrendingUp, Shield, Loader2 } from 'lucide-react';
import api from '@/lib/api';

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
      borderRadius: '8px', padding: '10px 14px', fontSize: '12px',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color || p.fill, display: 'flex', gap: 8 }}>
          <span>{p.name}:</span><span style={{ fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function RiskAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRiskAnalytics()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
    </div>;
  }

  const summary = data?.summary || {};
  const riskByCountry = data?.risk_by_country || [];
  const productRisk = data?.product_risk || [];
  const riskFactorAvg = data?.risk_factor_avg || [];

  return (
    <div>
      <div className="page-header animate-in">
        <h2>Risk Analytics</h2>
        <p>Portfolio risk distribution, geography exposure, and trend analysis</p>
      </div>

      {/* Top KPIs */}
      <div className="kpi-grid animate-in animate-in-delay-1">
        <div className="kpi-card danger">
          <div className="kpi-header"><span className="kpi-label">High Risk Clients</span><div className="kpi-icon"><Shield size={18} /></div></div>
          <div className="kpi-value" style={{ color: 'var(--risk-high)' }}>{data?.risk_distribution?.high || 0}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{summary.high_risk_pct || 0}% of portfolio</div>
        </div>
        <div className="kpi-card warning">
          <div className="kpi-header"><span className="kpi-label">Avg Portfolio Risk</span><div className="kpi-icon"><BarChart3 size={18} /></div></div>
          <div className="kpi-value" style={{ color: 'var(--risk-medium)' }}>{summary.avg_portfolio_risk || 0}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Out of 5.0</div>
        </div>
        <div className="kpi-card info">
          <div className="kpi-header"><span className="kpi-label">Countries</span><div className="kpi-icon"><Globe size={18} /></div></div>
          <div className="kpi-value">{summary.countries || 0}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Active jurisdictions</div>
        </div>
        <div className="kpi-card success">
          <div className="kpi-header"><span className="kpi-label">Total Clients</span><div className="kpi-icon"><TrendingUp size={18} /></div></div>
          <div className="kpi-value" style={{ color: 'var(--risk-low)' }}>{summary.total_clients || 0}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>In portfolio</div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Risk by Country */}
        <div className="chart-card animate-in animate-in-delay-2">
          <h3>Risk by Country</h3>
          {riskByCountry.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={riskByCountry} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                <XAxis type="number" domain={[0, 5]} stroke="var(--text-muted)" fontSize={11} />
                <YAxis dataKey="country" type="category" width={80} stroke="var(--text-muted)" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avg_risk" name="Avg Risk" radius={[0, 6, 6, 0]}>
                  {riskByCountry.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.avg_risk >= 3.5 ? '#ef4444' : entry.avg_risk >= 2.5 ? '#f59e0b' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>No country data yet</div>
          )}
        </div>

        {/* Product Risk */}
        <div className="chart-card animate-in animate-in-delay-3">
          <h3>Product Risk Exposure</h3>
          {productRisk.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={productRisk}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                <XAxis dataKey="product" stroke="var(--text-muted)" fontSize={10} angle={-20} />
                <YAxis domain={[0, 5]} stroke="var(--text-muted)" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="risk" name="Risk Level" radius={[6, 6, 0, 0]}>
                  {productRisk.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.risk >= 3.5 ? '#ef4444' : entry.risk >= 2.5 ? '#f59e0b' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>No product data yet</div>
          )}
        </div>
      </div>

      {/* Risk Factor Averages */}
      <div className="glass-card animate-in animate-in-delay-4">
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Average Risk Factor Scores (Portfolio-wide)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {riskFactorAvg.length > 0 ? riskFactorAvg.map((f: any) => (
            <div key={f.factor} style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>{f.factor}</div>
              <div style={{
                fontSize: '28px', fontWeight: 800,
                color: f.avg >= 3 ? 'var(--risk-medium)' : 'var(--risk-low)',
              }}>{f.avg}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>out of 5.0</div>
              <div className="confidence-bar" style={{ marginTop: '8px' }}>
                <div className={`confidence-bar-fill ${f.avg >= 3.5 ? 'high' : f.avg >= 2.5 ? 'medium' : 'low'}`} style={{ width: `${(f.avg / 5) * 100}%` }} />
              </div>
            </div>
          )) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              No risk scores calculated yet. Score clients from the Clients page to see analytics.
            </div>
          )}
        </div>
      </div>

      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
