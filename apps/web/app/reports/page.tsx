'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, Download, Plus, Clock, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const reportTypes = [
  { type: 'compliance', label: 'Compliance Summary', desc: 'Overall compliance posture, screening activity, and case resolution metrics', icon: '📋' },
  { type: 'risk', label: 'Risk Assessment Report', desc: 'Client risk distribution, factor analysis, and trend data', icon: '⚠️' },
  { type: 'screening', label: 'Screening Activity', desc: 'Detailed screening results, match rates, and false positive analysis', icon: '🔍' },
  { type: 'sar', label: 'SAR Filing Report', desc: 'Suspicious Activity Report data package for regulatory submission', icon: '📄' },
  { type: 'kyc', label: 'KYC Status Report', desc: 'Client onboarding status, document verification, and approval rates', icon: '✅' },
  { type: 'audit', label: 'Audit Trail', desc: 'Complete audit log export with user actions and system events', icon: '📝' },
];

export default function ReportsPage() {
  const { success, error: showError } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [genForm, setGenForm] = useState({ report_type: 'compliance', title: '', date_from: '', date_to: '' });
  const [generating, setGenerating] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listReports();
      setReports(data.items || []);
    } catch (err: any) {
      // Reports might be empty on fresh start
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.generateReport(genForm);
      success('Report generated successfully');
      setShowGenerate(false);
      setGenForm({ report_type: 'compliance', title: '', date_from: '', date_to: '' });
      fetchReports();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      await api.downloadReport(id);
      success('Report downloaded');
    } catch (err: any) {
      showError(err.message);
    }
  };

  return (
    <div>
      <div className="page-header animate-in">
        <div className="page-header-row">
          <div>
            <h2>Reports</h2>
            <p>Generate and download compliance reports</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowGenerate(true)}>
            <Plus size={16} /> Generate Report
          </button>
        </div>
      </div>

      {/* Report Templates */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }} className="animate-in animate-in-delay-1">
        {reportTypes.map(rt => (
          <div key={rt.type} className="glass-card" style={{ padding: '20px', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => { setGenForm(f => ({ ...f, report_type: rt.type })); setShowGenerate(true); }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>{rt.icon}</div>
            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{rt.label}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{rt.desc}</div>
          </div>
        ))}
      </div>

      {/* Generated Reports */}
      <div className="glass-card animate-in animate-in-delay-2">
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} /> Generated Reports
        </h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
          </div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '13px' }}>
            No reports generated yet. Choose a template above or click "Generate Report".
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Report</th><th>Type</th><th>Generated</th><th>Size</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {reports.map((r: any) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600, fontSize: '13.5px' }}>{r.name}</td>
                  <td>
                    <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-secondary)', textTransform: 'capitalize' }}>
                      {r.type}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {r.date ? new Date(r.date).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{r.size || '—'}</td>
                  <td><span className="badge badge-active">● {r.status || 'Ready'}</span></td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleDownload(r.id)}>
                      <Download size={14} /> Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Generate Modal */}
      {showGenerate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowGenerate(false)}>
          <div className="glass-card" style={{ width: '480px', maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Generate Report</h3>
              <button onClick={() => setShowGenerate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <div className="input-group" style={{ marginBottom: '12px' }}>
              <label>Report Type</label>
              <select className="input" value={genForm.report_type} onChange={e => setGenForm(f => ({ ...f, report_type: e.target.value }))}>
                {reportTypes.map(rt => <option key={rt.type} value={rt.type}>{rt.label}</option>)}
              </select>
            </div>
            <div className="input-group" style={{ marginBottom: '12px' }}>
              <label>Title (optional)</label>
              <input className="input" value={genForm.title} onChange={e => setGenForm(f => ({ ...f, title: e.target.value }))} placeholder="Custom report title" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div className="input-group">
                <label>Date From</label>
                <input className="input" type="date" value={genForm.date_from} onChange={e => setGenForm(f => ({ ...f, date_from: e.target.value }))} />
              </div>
              <div className="input-group">
                <label>Date To</label>
                <input className="input" type="date" value={genForm.date_to} onChange={e => setGenForm(f => ({ ...f, date_to: e.target.value }))} />
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={generating} style={{ width: '100%' }}>
              {generating ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</> : 'Generate Report'}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
