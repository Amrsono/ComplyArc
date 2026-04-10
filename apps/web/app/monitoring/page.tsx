'use client';

import { useState, useEffect, useCallback } from 'react';
import { Activity, AlertTriangle, Clock, Play, Pause, Plus, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export default function MonitoringPage() {
  const { success, error: showError } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [registerForm, setRegisterForm] = useState({ client_id: '', frequency: 'daily', sanctions: true, pep: true, media: false });
  const [clients, setClients] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.listMonitoring();
      setData(d);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = async (id: string) => {
    try {
      const result = await api.toggleMonitoring(id);
      success(result.status === 'active' ? 'Monitoring resumed' : 'Monitoring paused');
      fetchData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleRegister = async () => {
    if (!registerForm.client_id) return;
    try {
      await api.registerMonitoring(registerForm);
      success('Client registered for monitoring');
      setShowRegister(false);
      fetchData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const openRegisterModal = async () => {
    try {
      const c = await api.listClients({ page_size: '100' });
      setClients(c.items || []);
    } catch { /* ignore */ }
    setShowRegister(true);
  };

  const items = data?.items || [];
  const activeCount = data?.active_count || 0;
  const totalAlerts = items.reduce((s: number, c: any) => s + (c.alerts_count || 0), 0);

  return (
    <div>
      <div className="page-header animate-in">
        <div className="page-header-row">
          <div>
            <h2>Continuous Monitoring</h2>
            <p>Automated re-screening and change tracking for registered clients</p>
          </div>
          <button className="btn btn-primary" onClick={openRegisterModal}><Plus size={16} /> Register Client</button>
        </div>
      </div>

      {/* Stats */}
      <div className="kpi-grid animate-in animate-in-delay-1" style={{ marginBottom: '20px' }}>
        <div className="kpi-card success" style={{ padding: '14px 18px' }}>
          <div className="kpi-header"><span className="kpi-label">Active Monitoring</span><div className="kpi-icon"><Activity size={18} /></div></div>
          <div className="kpi-value" style={{ fontSize: '22px', color: 'var(--risk-low)' }}>{activeCount}</div>
        </div>
        <div className="kpi-card warning" style={{ padding: '14px 18px' }}>
          <div className="kpi-header"><span className="kpi-label">Alerts Generated</span><div className="kpi-icon"><AlertTriangle size={18} /></div></div>
          <div className="kpi-value" style={{ fontSize: '22px', color: 'var(--risk-medium)' }}>{totalAlerts}</div>
        </div>
        <div className="kpi-card info" style={{ padding: '14px 18px' }}>
          <div className="kpi-header"><span className="kpi-label">Total Monitored</span><div className="kpi-icon"><Clock size={18} /></div></div>
          <div className="kpi-value" style={{ fontSize: '22px' }}>{items.length}</div>
        </div>
        <div className="kpi-card" style={{ padding: '14px 18px' }}>
          <div className="kpi-header"><span className="kpi-label">Paused</span><div className="kpi-icon"><Pause size={18} /></div></div>
          <div className="kpi-value" style={{ fontSize: '22px', color: 'var(--text-tertiary)' }}>{items.filter((c: any) => !c.is_active).length}</div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
        </div>
      ) : (
        <div className="glass-card animate-in animate-in-delay-2" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr><th>Client</th><th>Frequency</th><th>Scope</th><th>Last Screened</th><th>Next</th><th>Alerts</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No monitored clients. Click "Register Client" to start.</td></tr>
              ) : items.map((c: any) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600, fontSize: '13.5px' }}>{c.client_name}</td>
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
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{c.last_screened ? new Date(c.last_screened).toLocaleDateString() : '—'}</td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{c.next_review ? new Date(c.next_review).toLocaleDateString() : '—'}</td>
                  <td>
                    {c.alerts_count > 0 ? (
                      <span className="badge badge-high" style={{ fontSize: '11px' }}>{c.alerts_count}</span>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>—</span>
                    )}
                  </td>
                  <td>
                    {c.is_active ? (
                      <span className="badge badge-active">● Active</span>
                    ) : (
                      <span className="badge badge-dormant">⏸ Paused</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleToggle(c.id)}>
                      {c.is_active ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Resume</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Register Modal */}
      {showRegister && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowRegister(false)}>
          <div className="glass-card" style={{ width: '440px', maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Register for Monitoring</h3>
              <button onClick={() => setShowRegister(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <div className="input-group" style={{ marginBottom: '12px' }}>
              <label>Client</label>
              <select className="input" value={registerForm.client_id} onChange={e => setRegisterForm(f => ({ ...f, client_id: e.target.value }))}>
                <option value="">Select client...</option>
                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="input-group" style={{ marginBottom: '12px' }}>
              <label>Frequency</label>
              <select className="input" value={registerForm.frequency} onChange={e => setRegisterForm(f => ({ ...f, frequency: e.target.value }))}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              {(['sanctions', 'pep', 'media'] as const).map(scope => (
                <label key={scope} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <input type="checkbox" checked={(registerForm as any)[scope]} onChange={e => setRegisterForm(f => ({ ...f, [scope]: e.target.checked }))} style={{ accentColor: 'var(--accent-primary)' }} />
                  {scope.toUpperCase()}
                </label>
              ))}
            </div>
            <button className="btn btn-primary" onClick={handleRegister} style={{ width: '100%' }}>Register</button>
          </div>
        </div>
      )}

      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
