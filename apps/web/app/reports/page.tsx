'use client';

import { FileText, Download, Calendar, Filter, FileCheck, BarChart, Shield } from 'lucide-react';

const reports = [
  { id: '1', name: 'Monthly Compliance Report — June 2024', type: 'compliance', date: '2024-07-01', status: 'ready', size: '2.4 MB' },
  { id: '2', name: 'High Risk Client Portfolio Review', type: 'risk', date: '2024-06-28', status: 'ready', size: '1.8 MB' },
  { id: '3', name: 'Sanctions Screening Summary Q2 2024', type: 'screening', date: '2024-06-30', status: 'ready', size: '856 KB' },
  { id: '4', name: 'Adverse Media Intelligence Report', type: 'media', date: '2024-06-25', status: 'generating', size: '—' },
  { id: '5', name: 'SAR Filing Summary — YTD 2024', type: 'sar', date: '2024-06-15', status: 'ready', size: '540 KB' },
  { id: '6', name: 'KYC Onboarding Statistics', type: 'kyc', date: '2024-06-20', status: 'ready', size: '1.2 MB' },
];

const reportTemplates = [
  { id: '1', name: 'Regulatory Compliance Report', desc: 'Full compliance overview for regulator submission', icon: FileCheck },
  { id: '2', name: 'Risk Assessment Report', desc: 'Portfolio-wide risk distribution and analysis', icon: Shield },
  { id: '3', name: 'Screening Activity Report', desc: 'Detailed screening results and match statistics', icon: BarChart },
  { id: '4', name: 'Audit Trail Export', desc: 'Complete audit log for compliance review period', icon: FileText },
];

export default function ReportsPage() {
  return (
    <div>
      <div className="page-header animate-in">
        <div className="page-header-row">
          <div>
            <h2>Compliance Reports</h2>
            <p>Generate and export regulator-ready compliance reports</p>
          </div>
          <button className="btn btn-primary"><FileText size={16} /> Generate Report</button>
        </div>
      </div>

      {/* Report Templates */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }} className="animate-in animate-in-delay-1">
        {reportTemplates.map(t => {
          const Icon = t.icon;
          return (
            <div key={t.id} className="glass-card" style={{
              cursor: 'pointer', textAlign: 'center', padding: '20px 16px',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--radius-md)',
                background: 'rgba(59,130,246,0.1)', margin: '0 auto 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={22} color="var(--accent-primary)" />
              </div>
              <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{t.name}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>{t.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Reports Table */}
      <div className="glass-card animate-in animate-in-delay-2" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-primary)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Generated Reports</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Report Name</th>
              <th>Type</th>
              <th>Generated</th>
              <th>Status</th>
              <th>Size</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 500 }}>{r.name}</td>
                <td>
                  <span className="badge" style={{
                    background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                    border: '1px solid var(--border-secondary)', textTransform: 'capitalize',
                  }}>{r.type}</span>
                </td>
                <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{r.date}</td>
                <td>
                  {r.status === 'ready' ? (
                    <span className="badge badge-low">✓ Ready</span>
                  ) : (
                    <span className="badge badge-pending">⟳ Generating</span>
                  )}
                </td>
                <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{r.size}</td>
                <td>
                  <button className="btn btn-secondary btn-sm" disabled={r.status !== 'ready'}>
                    <Download size={12} /> Download
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
