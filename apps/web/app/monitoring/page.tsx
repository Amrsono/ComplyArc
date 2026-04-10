'use client';

import { Activity, CheckCircle, AlertTriangle, Clock, Play, Pause } from 'lucide-react';

const monitoredClients = [
  { id: '1', name: 'ABC Trading LLC', type: 'corporate', frequency: 'daily', lastScreened: '2 hours ago', nextScreening: 'Tomorrow 06:00', sanctions: true, pep: true, media: true, alerts: 3, status: 'active' },
  { id: '2', name: 'Global Investments Corp', type: 'corporate', frequency: 'weekly', lastScreened: '3 days ago', nextScreening: 'Mon 06:00', sanctions: true, pep: true, media: false, alerts: 0, status: 'active' },
  { id: '3', name: 'Ahmed Al-Rashid', type: 'individual', frequency: 'daily', lastScreened: '4 hours ago', nextScreening: 'Tomorrow 06:00', sanctions: true, pep: true, media: true, alerts: 1, status: 'active' },
  { id: '5', name: 'Dragon Holdings Ltd', type: 'corporate', frequency: 'weekly', lastScreened: '5 days ago', nextScreening: 'Tue 06:00', sanctions: true, pep: false, media: true, alerts: 0, status: 'active' },
  { id: '7', name: 'Sahara Mining Co', type: 'corporate', frequency: 'daily', lastScreened: '1 hour ago', nextScreening: 'Tomorrow 06:00', sanctions: true, pep: true, media: true, alerts: 5, status: 'active' },
  { id: '6', name: 'Pacific Ventures KK', type: 'corporate', frequency: 'monthly', lastScreened: '2 weeks ago', nextScreening: 'Jul 01 06:00', sanctions: true, pep: false, media: false, alerts: 0, status: 'paused' },
];

export default function MonitoringPage() {
  return (
    <div>
      <div className="page-header animate-in">
        <div className="page-header-row">
          <div>
            <h2>Continuous Monitoring</h2>
            <p>Automated re-screening and change tracking for registered clients</p>
          </div>
          <button className="btn btn-primary"><Activity size={16} /> Register Client</button>
        </div>
      </div>

      {/* Stats */}
      <div className="kpi-grid animate-in animate-in-delay-1" style={{ marginBottom: '20px' }}>
        <div className="kpi-card success" style={{ padding: '14px 18px' }}>
          <div className="kpi-header"><span className="kpi-label">Active Monitoring</span><div className="kpi-icon"><Activity size={18} /></div></div>
          <div className="kpi-value" style={{ fontSize: '22px', color: 'var(--risk-low)' }}>{monitoredClients.filter(c => c.status === 'active').length}</div>
        </div>
        <div className="kpi-card warning" style={{ padding: '14px 18px' }}>
          <div className="kpi-header"><span className="kpi-label">Alerts Generated</span><div className="kpi-icon"><AlertTriangle size={18} /></div></div>
          <div className="kpi-value" style={{ fontSize: '22px', color: 'var(--risk-medium)' }}>{monitoredClients.reduce((s, c) => s + c.alerts, 0)}</div>
        </div>
        <div className="kpi-card info" style={{ padding: '14px 18px' }}>
          <div className="kpi-header"><span className="kpi-label">Daily Screenings</span><div className="kpi-icon"><Clock size={18} /></div></div>
          <div className="kpi-value" style={{ fontSize: '22px' }}>{monitoredClients.filter(c => c.frequency === 'daily').length}</div>
        </div>
        <div className="kpi-card" style={{ padding: '14px 18px' }}>
          <div className="kpi-header"><span className="kpi-label">Paused</span><div className="kpi-icon"><Pause size={18} /></div></div>
          <div className="kpi-value" style={{ fontSize: '22px', color: 'var(--text-tertiary)' }}>{monitoredClients.filter(c => c.status === 'paused').length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card animate-in animate-in-delay-2" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Frequency</th>
              <th>Scope</th>
              <th>Last Screened</th>
              <th>Next</th>
              <th>Alerts</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {monitoredClients.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600, fontSize: '13.5px' }}>{c.name}</td>
                <td>
                  <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-secondary)', textTransform: 'capitalize' }}>
                    {c.frequency}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {c.sanctions && <span style={{ fontSize: '10px', padding: '2px 5px', borderRadius: '4px', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>SAN</span>}
                    {c.pep && <span style={{ fontSize: '10px', padding: '2px 5px', borderRadius: '4px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>PEP</span>}
                    {c.media && <span style={{ fontSize: '10px', padding: '2px 5px', borderRadius: '4px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>MED</span>}
                  </div>
                </td>
                <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{c.lastScreened}</td>
                <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{c.nextScreening}</td>
                <td>
                  {c.alerts > 0 ? (
                    <span className="badge badge-high" style={{ fontSize: '11px' }}>{c.alerts}</span>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>—</span>
                  )}
                </td>
                <td>
                  {c.status === 'active' ? (
                    <span className="badge badge-active">● Active</span>
                  ) : (
                    <span className="badge badge-dormant">⏸ Paused</span>
                  )}
                </td>
                <td>
                  <button className="btn btn-secondary btn-sm">
                    {c.status === 'active' ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Resume</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
