'use client';

import { useState, useEffect } from 'react';
import {
  Users, ShieldAlert, Search, AlertTriangle, TrendingUp, TrendingDown,
  Activity, Eye, Shield, Zap, ArrowUpRight, Clock
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, AreaChart, Area,
} from 'recharts';

/* ─── Demo Data ───────────────────────────────── */
const riskDistribution = [
  { name: 'High', value: 320, color: '#ef4444' },
  { name: 'Medium', value: 1940, color: '#f59e0b' },
  { name: 'Low', value: 10190, color: '#10b981' },
];

const screeningTrend = [
  { date: 'Jan', screenings: 420, matches: 32 },
  { date: 'Feb', screenings: 510, matches: 45 },
  { date: 'Mar', screenings: 680, matches: 38 },
  { date: 'Apr', screenings: 590, matches: 52 },
  { date: 'May', screenings: 750, matches: 41 },
  { date: 'Jun', screenings: 890, matches: 67 },
  { date: 'Jul', screenings: 820, matches: 55 },
];

const casesByType = [
  { type: 'Sanctions', count: 24 },
  { type: 'PEP', count: 18 },
  { type: 'Adverse Media', count: 31 },
  { type: 'Risk Escalation', count: 11 },
];

const recentAlerts = [
  { id: '1', severity: 'high', type: 'Sanctions Match', client: 'XYZ Trading Ltd', desc: 'OFAC SDN list match — 91% confidence', time: '12 min ago' },
  { id: '2', severity: 'high', type: 'Adverse Media', client: 'ABC Trading LLC', desc: 'Fraud allegations in Financial Times', time: '34 min ago' },
  { id: '3', severity: 'medium', type: 'Risk Increase', client: 'DEF Holdings', desc: 'Risk score increased from 2.8 to 4.1', time: '1 hour ago' },
  { id: '4', severity: 'medium', type: 'PEP Match', client: 'Ahmed Al-Rashid', desc: 'Close associate of PEP identified', time: '2 hours ago' },
  { id: '5', severity: 'low', type: 'Monitoring Alert', client: 'Pacific Ventures KK', desc: 'Status changed to dormant — 180 days inactive', time: '3 hours ago' },
];

/* ─── Animated Counter ────────────────────────── */
function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.round(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <>{display.toLocaleString()}</>;
}

/* ─── Custom Tooltip ──────────────────────────── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
      borderRadius: '8px', padding: '10px 14px', fontSize: '12px',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color, display: 'flex', gap: 8 }}>
          <span>{p.name}:</span>
          <span style={{ fontWeight: 600 }}>{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div>
      {/* Page Header */}
      <div className="page-header animate-in">
        <div className="page-header-row">
          <div>
            <h2>Compliance Dashboard</h2>
            <p>Real-time overview of your compliance operations</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm">
              <Clock size={14} /> Last 30 Days
            </button>
            <button className="btn btn-primary btn-sm">
              <Zap size={14} /> Quick Screen
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card info animate-in animate-in-delay-1" id="kpi-total-clients">
          <div className="kpi-header">
            <span className="kpi-label">Total Clients</span>
            <div className="kpi-icon"><Users size={20} /></div>
          </div>
          <div className="kpi-value"><AnimatedNumber value={12450} /></div>
          <div className="kpi-trend up"><TrendingUp size={12} /> +124 this month</div>
        </div>

        <div className="kpi-card danger animate-in animate-in-delay-2" id="kpi-high-risk">
          <div className="kpi-header">
            <span className="kpi-label">High Risk</span>
            <div className="kpi-icon"><AlertTriangle size={20} /></div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--risk-high)' }}>
            <AnimatedNumber value={320} />
          </div>
          <div className="kpi-trend down"><TrendingDown size={12} /> +18 this week</div>
        </div>

        <div className="kpi-card warning animate-in animate-in-delay-3" id="kpi-active-cases">
          <div className="kpi-header">
            <span className="kpi-label">Active Cases</span>
            <div className="kpi-icon"><ShieldAlert size={20} /></div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--risk-medium)' }}>
            <AnimatedNumber value={84} />
          </div>
          <div className="kpi-trend up"><ArrowUpRight size={12} /> 27 pending review</div>
        </div>

        <div className="kpi-card success animate-in animate-in-delay-4" id="kpi-screenings">
          <div className="kpi-header">
            <span className="kpi-label">Screenings Today</span>
            <div className="kpi-icon"><Search size={20} /></div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--risk-low)' }}>
            <AnimatedNumber value={247} />
          </div>
          <div className="kpi-trend up"><TrendingUp size={12} /> +12% vs yesterday</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        {/* Risk Distribution Pie */}
        <div className="chart-card animate-in animate-in-delay-2">
          <h3>Risk Distribution</h3>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {riskDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {riskDistribution.map((item) => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: item.color,
                  }} />
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.name}</div>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>{item.value.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Screening Trend Line */}
        <div className="chart-card animate-in animate-in-delay-3">
          <h3>Screening Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={screeningTrend}>
              <defs>
                <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone" dataKey="screenings" stroke="#3b82f6"
                fill="url(#gradBlue)" strokeWidth={2} name="Screenings"
              />
              <Area
                type="monotone" dataKey="matches" stroke="#ef4444"
                fill="none" strokeWidth={2} strokeDasharray="5 5" name="Matches"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Row: Cases by Type + Alerts */}
      <div className="charts-grid">
        {/* Cases Bar Chart */}
        <div className="chart-card animate-in animate-in-delay-3">
          <h3>Cases by Type</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={casesByType}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
              <XAxis dataKey="type" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Cases" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Alerts */}
        <div className="chart-card animate-in animate-in-delay-4">
          <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Recent Alerts
            <span className="badge badge-high" style={{ fontSize: '10px' }}>
              {recentAlerts.filter(a => a.severity === 'high').length} Critical
            </span>
          </h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {recentAlerts.map((alert) => (
              <div className="alert-item" key={alert.id}>
                <div className={`alert-dot ${alert.severity}`} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{alert.type}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{alert.time}</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{alert.client}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {alert.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
