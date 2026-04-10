'use client';

import { ShieldAlert, Filter, Clock, AlertTriangle, User, ArrowRight, CheckCircle } from 'lucide-react';

const cases = [
  { id: 'CX-2024-00012', client: 'XYZ Trading Ltd', title: 'OFAC SDN Match — Director screening', type: 'sanctions_match', status: 'open', priority: 'critical', assigned: 'Sarah Johnson', created: '2 hours ago' },
  { id: 'CX-2024-00011', client: 'ABC Trading LLC', title: 'Adverse media — Fraud allegations (FT)', type: 'adverse_media', status: 'under_review', priority: 'high', assigned: 'Michael Chen', created: '1 day ago' },
  { id: 'CX-2024-00010', client: 'Ahmed Al-Rashid', title: 'PEP association — Close relative identified', type: 'pep_match', status: 'under_review', priority: 'medium', assigned: 'Sarah Johnson', created: '2 days ago' },
  { id: 'CX-2024-00009', client: 'DEF Holdings', title: 'Risk score escalation — 2.8 → 4.1', type: 'risk_escalation', status: 'escalated', priority: 'high', assigned: 'David Kim', created: '3 days ago' },
  { id: 'CX-2024-00008', client: 'Dragon Holdings', title: 'Monitoring alert — New sanctions exposure', type: 'monitoring_alert', status: 'open', priority: 'medium', assigned: 'Unassigned', created: '4 days ago' },
  { id: 'CX-2024-00007', client: 'Global Inv Corp', title: 'Periodic KYC review — Annual refresh', type: 'monitoring_alert', status: 'closed', priority: 'low', assigned: 'Michael Chen', created: '1 week ago' },
];

const priorityColors: Record<string, string> = {
  critical: '#dc2626', high: '#ef4444', medium: '#f59e0b', low: '#10b981',
};

const statusColumns = ['open', 'under_review', 'escalated', 'closed'];
const statusLabels: Record<string, string> = {
  open: 'Open', under_review: 'Under Review', escalated: 'Escalated', closed: 'Closed',
};

export default function CasesPage() {
  return (
    <div>
      <div className="page-header animate-in">
        <div className="page-header-row">
          <div>
            <h2>Case Management</h2>
            <p>Investigation workflow — alerts, reviews, and resolutions</p>
          </div>
          <button className="btn btn-primary"><ShieldAlert size={16} /> New Case</button>
        </div>
      </div>

      {/* Kanban Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', minHeight: '60vh' }} className="animate-in animate-in-delay-1">
        {statusColumns.map(status => {
          const column = cases.filter(c => c.status === status);
          return (
            <div key={status} style={{
              background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column',
            }}>
              {/* Column Header */}
              <div style={{
                padding: '14px 16px', borderBottom: '1px solid var(--border-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: status === 'open' ? '#3b82f6' : status === 'under_review' ? '#f59e0b' : status === 'escalated' ? '#ef4444' : '#10b981',
                  }} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{statusLabels[status]}</span>
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: 700, background: 'var(--bg-elevated)',
                  padding: '2px 8px', borderRadius: '10px', color: 'var(--text-secondary)',
                }}>{column.length}</span>
              </div>

              {/* Cards */}
              <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {column.map(c => (
                  <div key={c.id} style={{
                    padding: '14px', borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{c.id}</span>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: priorityColors[c.priority],
                        boxShadow: `0 0 6px ${priorityColors[c.priority]}`,
                      }} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', lineHeight: 1.3 }}>{c.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      {c.client}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`badge badge-${c.priority === 'critical' ? 'high' : c.priority}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                        {c.priority.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{c.created}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
