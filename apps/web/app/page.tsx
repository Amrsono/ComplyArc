'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, ShieldAlert, Search, AlertTriangle, TrendingUp, TrendingDown,
  Activity, Eye, Shield, Zap, ArrowUpRight, Clock, Loader2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from 'recharts';
import api from '@/lib/api';

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
          <span style={{ fontWeight: 600 }}>{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
        <AlertTriangle size={40} style={{ color: 'var(--risk-medium)', marginBottom: '12px' }} />
        <h3>Failed to load dashboard</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{error}</p>
        <button className="btn btn-primary" onClick={fetchData}>Retry</button>
      </div>
    );
  }

  const s = stats.stats || {};
  const riskDist = stats.risk_distribution || {};
  const riskDistribution = [
    { name: 'High', value: riskDist.high || 0, color: '#ef4444' },
    { name: 'Medium', value: riskDist.medium || 0, color: '#f59e0b' },
    { name: 'Low', value: riskDist.low || 0, color: '#10b981' },
  ];

  const casesByStatus = stats.cases_by_status || {};
  const casesByType = [
    { type: 'Open', count: casesByStatus.open || 0 },
    { type: 'Under Review', count: casesByStatus.under_review || 0 },
    { type: 'Escalated', count: casesByStatus.escalated || 0 },
    { type: 'Closed', count: casesByStatus.closed || 0 },
  ];

  const recentAlerts = (stats.recent_alerts || []).map((a: any, i: number) => ({
    id: a.id || String(i),
    severity: a.severity || 'medium',
    type: a.type === 'sanctions_match' ? 'Sanctions Match' : a.type === 'adverse_media' ? 'Adverse Media' : a.type,
    client: a.client_name || 'Unknown',
    desc: a.description || '',
    time: a.created_at ? new Date(a.created_at).toLocaleString() : '',
  }));

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
            <button className="btn btn-secondary btn-sm" onClick={fetchData}>
              <Clock size={14} /> Refresh
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => router.push('/screening')}>
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
          <div className="kpi-value"><AnimatedNumber value={s.total_clients || 0} /></div>
          <div className="kpi-trend up"><TrendingUp size={12} /> {s.active_clients || 0} active</div>
        </div>

        <div className="kpi-card danger animate-in animate-in-delay-2" id="kpi-high-risk">
          <div className="kpi-header">
            <span className="kpi-label">High Risk</span>
            <div className="kpi-icon"><AlertTriangle size={20} /></div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--risk-high)' }}>
            <AnimatedNumber value={s.high_risk_clients || 0} />
          </div>
          <div className="kpi-trend down"><TrendingDown size={12} /> {s.pending_clients || 0} pending</div>
        </div>

        <div className="kpi-card warning animate-in animate-in-delay-3" id="kpi-active-cases">
          <div className="kpi-header">
            <span className="kpi-label">Active Cases</span>
            <div className="kpi-icon"><ShieldAlert size={20} /></div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--risk-medium)' }}>
            <AnimatedNumber value={s.active_cases || 0} />
          </div>
          <div className="kpi-trend up"><ArrowUpRight size={12} /> {s.pending_review_cases || 0} pending review</div>
        </div>

        <div className="kpi-card success animate-in animate-in-delay-4" id="kpi-screenings">
          <div className="kpi-header">
            <span className="kpi-label">Screenings Today</span>
            <div className="kpi-icon"><Search size={20} /></div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--risk-low)' }}>
            <AnimatedNumber value={s.screenings_today || 0} />
          </div>
          <div className="kpi-trend up"><TrendingUp size={12} /> {s.total_screenings || 0} total</div>
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
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value" stroke="none"
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
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.name}</div>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>{item.value.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cases by Status */}
        <div className="chart-card animate-in animate-in-delay-3">
          <h3>Cases by Status</h3>
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
      </div>

      {/* Recent Alerts */}
      <div className="chart-card animate-in animate-in-delay-4">
        <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Recent Alerts
          <button className="btn btn-secondary btn-sm" onClick={() => router.push('/alerts')}>
            View All
          </button>
        </h3>
        <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
          {recentAlerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              No recent alerts
            </div>
          ) : recentAlerts.map((alert: any) => (
            <div className="alert-item" key={alert.id} style={{ cursor: 'pointer' }} onClick={() => router.push('/alerts')}>
              <div className={`alert-dot ${alert.severity}`} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>{alert.type}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{alert.time}</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{alert.client}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 2 }}>{alert.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
