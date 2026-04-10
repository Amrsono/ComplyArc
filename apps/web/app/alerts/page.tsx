'use client';

import { Bell, Filter, CheckCircle, ShieldAlert, AlertTriangle, TrendingUp, Activity, Eye } from 'lucide-react';

const alerts = [
  { id: '1', type: 'sanctions_match', severity: 'high', client: 'XYZ Trading Ltd', clientId: '10', desc: 'OFAC SDN match detected — Director "John A. Smith" matches SDN entry with 91% confidence', time: '12 minutes ago', read: false },
  { id: '2', type: 'adverse_media', severity: 'high', client: 'ABC Trading LLC', clientId: '1', desc: 'New adverse media hit: "Financial irregularities investigation linked to UAE trade firms" — Financial Times', time: '34 minutes ago', read: false },
  { id: '3', type: 'risk_change', severity: 'medium', client: 'DEF Holdings', clientId: '5', desc: 'Risk score increased from 2.8 to 4.1 (MEDIUM → HIGH). Triggered by new sanctions exposure in geography risk factor', time: '1 hour ago', read: false },
  { id: '4', type: 'pep_match', severity: 'medium', client: 'Ahmed Al-Rashid', clientId: '8', desc: 'PEP association identified — Close relative is a senior government official in Saudi Arabia', time: '2 hours ago', read: true },
  { id: '5', type: 'monitoring', severity: 'low', client: 'Pacific Ventures KK', clientId: '6', desc: 'Client status changed to DORMANT — No activity recorded for 180 days. Monitoring continues.', time: '3 hours ago', read: true },
  { id: '6', type: 'sanctions_match', severity: 'medium', client: 'Sahara Mining Co', clientId: '7', desc: 'EU Consolidated List — Partial match found for director "Viktor Petrov" (68% confidence)', time: '5 hours ago', read: true },
  { id: '7', type: 'monitoring', severity: 'low', client: 'Global Investments Corp', clientId: '2', desc: 'Annual KYC review due in 30 days — Automatic reminder generated', time: '1 day ago', read: true },
];

const typeIcons: Record<string, any> = {
  sanctions_match: ShieldAlert, adverse_media: AlertTriangle,
  risk_change: TrendingUp, pep_match: Eye, monitoring: Activity,
};

const typeLabels: Record<string, string> = {
  sanctions_match: 'Sanctions Match', adverse_media: 'Adverse Media',
  risk_change: 'Risk Change', pep_match: 'PEP Match', monitoring: 'Monitoring',
};

export default function AlertsPage() {
  return (
    <div>
      <div className="page-header animate-in">
        <div className="page-header-row">
          <div>
            <h2>Alerts Center</h2>
            <p>Real-time compliance alerts and notifications</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm"><Filter size={14} /> Filter</button>
            <button className="btn btn-secondary btn-sm"><CheckCircle size={14} /> Mark All Read</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="kpi-grid animate-in animate-in-delay-1" style={{ marginBottom: '20px' }}>
        <div className="kpi-card danger" style={{ padding: '14px 18px' }}>
          <div className="kpi-header"><span className="kpi-label">Critical</span><div className="kpi-icon"><AlertTriangle size={18} /></div></div>
          <div className="kpi-value" style={{ fontSize: '22px', color: 'var(--risk-high)' }}>2</div>
        </div>
        <div className="kpi-card warning" style={{ padding: '14px 18px' }}>
          <div className="kpi-header"><span className="kpi-label">Medium</span><div className="kpi-icon"><Bell size={18} /></div></div>
          <div className="kpi-value" style={{ fontSize: '22px', color: 'var(--risk-medium)' }}>2</div>
        </div>
        <div className="kpi-card success" style={{ padding: '14px 18px' }}>
          <div className="kpi-header"><span className="kpi-label">Low</span><div className="kpi-icon"><Activity size={18} /></div></div>
          <div className="kpi-value" style={{ fontSize: '22px', color: 'var(--risk-low)' }}>3</div>
        </div>
        <div className="kpi-card info" style={{ padding: '14px 18px' }}>
          <div className="kpi-header"><span className="kpi-label">Unread</span><div className="kpi-icon"><Eye size={18} /></div></div>
          <div className="kpi-value" style={{ fontSize: '22px' }}>{alerts.filter(a => !a.read).length}</div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="glass-card animate-in animate-in-delay-2" style={{ padding: '8px' }}>
        {alerts.map((alert) => {
          const Icon = typeIcons[alert.type] || Bell;
          return (
            <div key={alert.id} style={{
              display: 'flex', gap: '14px', padding: '16px 14px',
              borderRadius: 'var(--radius-md)', cursor: 'pointer',
              transition: 'all 0.2s', background: alert.read ? 'transparent' : 'rgba(59,130,246,0.04)',
              borderLeft: `3px solid ${alert.severity === 'high' ? 'var(--risk-high)' : alert.severity === 'medium' ? 'var(--risk-medium)' : 'var(--risk-low)'}`,
              marginBottom: '4px',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--radius-md)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: alert.severity === 'high' ? 'var(--risk-high-bg)' : alert.severity === 'medium' ? 'var(--risk-medium-bg)' : 'var(--risk-low-bg)',
              }}>
                <Icon size={18} color={alert.severity === 'high' ? 'var(--risk-high)' : alert.severity === 'medium' ? 'var(--risk-medium)' : 'var(--risk-low)'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge badge-${alert.severity}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                      {typeLabels[alert.type]}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '13.5px' }}>{alert.client}</span>
                    {!alert.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)' }} />}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{alert.time}</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{alert.desc}</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button className="btn btn-secondary btn-sm">View Details</button>
                  <button className="btn btn-secondary btn-sm"><ShieldAlert size={12} /> Create Case</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
