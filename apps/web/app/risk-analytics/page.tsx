'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { BarChart3, Globe, TrendingUp, Shield } from 'lucide-react';

const riskByCountry = [
  { country: '🇦🇪 UAE', clients: 45, avgRisk: 3.8, high: 18 },
  { country: '🇬🇧 UK', clients: 120, avgRisk: 1.9, high: 8 },
  { country: '🇺🇸 USA', clients: 95, avgRisk: 1.6, high: 5 },
  { country: '🇭🇰 HK', clients: 38, avgRisk: 3.2, high: 12 },
  { country: '🇸🇦 KSA', clients: 22, avgRisk: 3.5, high: 9 },
  { country: '🇿🇦 RSA', clients: 18, avgRisk: 3.9, high: 7 },
  { country: '🇯🇵 Japan', clients: 65, avgRisk: 1.4, high: 2 },
  { country: '🇩🇪 Germany', clients: 78, avgRisk: 1.5, high: 3 },
];

const productRisk = [
  { product: 'Trade Finance', risk: 4.2, clients: 180, color: '#ef4444' },
  { product: 'Private Banking', risk: 3.8, clients: 95, color: '#f59e0b' },
  { product: 'Trust Services', risk: 3.5, clients: 62, color: '#f59e0b' },
  { product: 'Securities', risk: 2.8, clients: 245, color: '#f59e0b' },
  { product: 'Advisory', risk: 1.5, clients: 320, color: '#10b981' },
  { product: 'Consulting', risk: 1.2, clients: 185, color: '#10b981' },
];

const riskTrend = [
  { month: 'Jan', high: 280, medium: 1800, low: 9800 },
  { month: 'Feb', high: 295, medium: 1850, low: 9900 },
  { month: 'Mar', high: 310, medium: 1900, low: 10050 },
  { month: 'Apr', high: 305, medium: 1920, low: 10100 },
  { month: 'May', high: 315, medium: 1930, low: 10150 },
  { month: 'Jun', high: 320, medium: 1940, low: 10190 },
];

const riskFactorAvg = [
  { factor: 'Client Risk', avg: 2.4 },
  { factor: 'Geography Risk', avg: 2.1 },
  { factor: 'Product Risk', avg: 2.8 },
  { factor: 'Interface Risk', avg: 1.9 },
];

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
          <div className="kpi-value" style={{ color: 'var(--risk-high)' }}>320</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>2.6% of portfolio</div>
        </div>
        <div className="kpi-card warning">
          <div className="kpi-header"><span className="kpi-label">Avg Portfolio Risk</span><div className="kpi-icon"><BarChart3 size={18} /></div></div>
          <div className="kpi-value" style={{ color: 'var(--risk-medium)' }}>2.3</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Out of 5.0</div>
        </div>
        <div className="kpi-card info">
          <div className="kpi-header"><span className="kpi-label">Countries</span><div className="kpi-icon"><Globe size={18} /></div></div>
          <div className="kpi-value">47</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Active jurisdictions</div>
        </div>
        <div className="kpi-card success">
          <div className="kpi-header"><span className="kpi-label">Risk Trend</span><div className="kpi-icon"><TrendingUp size={18} /></div></div>
          <div className="kpi-value" style={{ color: 'var(--risk-low)' }}>Stable</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>+0.2% this quarter</div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Risk by Country */}
        <div className="chart-card animate-in animate-in-delay-2">
          <h3>Risk by Country</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={riskByCountry} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
              <XAxis type="number" domain={[0, 5]} stroke="var(--text-muted)" fontSize={11} />
              <YAxis dataKey="country" type="category" width={80} stroke="var(--text-muted)" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avgRisk" name="Avg Risk" radius={[0, 6, 6, 0]}>
                {riskByCountry.map((entry, i) => (
                  <Cell key={i} fill={entry.avgRisk >= 3.5 ? '#ef4444' : entry.avgRisk >= 2.5 ? '#f59e0b' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Product Risk */}
        <div className="chart-card animate-in animate-in-delay-3">
          <h3>Product Risk Exposure</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={productRisk}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
              <XAxis dataKey="product" stroke="var(--text-muted)" fontSize={10} angle={-20} />
              <YAxis domain={[0, 5]} stroke="var(--text-muted)" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="risk" name="Risk Level" radius={[6, 6, 0, 0]}>
                {productRisk.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Trend */}
      <div className="chart-card animate-in animate-in-delay-3" style={{ marginBottom: '20px' }}>
        <h3>Risk Category Trend (6 Months)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={riskTrend}>
            <defs>
              <linearGradient id="gHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gMed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} /><stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
            <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
            <YAxis stroke="var(--text-muted)" fontSize={11} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="high" name="High Risk" stroke="#ef4444" fill="url(#gHigh)" strokeWidth={2} />
            <Area type="monotone" dataKey="medium" name="Medium Risk" stroke="#f59e0b" fill="url(#gMed)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Risk Factor Averages */}
      <div className="glass-card animate-in animate-in-delay-4">
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Average Risk Factor Scores (Portfolio-wide)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {riskFactorAvg.map(f => (
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
          ))}
        </div>
      </div>
    </div>
  );
}
