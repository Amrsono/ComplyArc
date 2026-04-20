'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Loader2, Plus, X, MessageSquare, Send } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const priorityColors: Record<string, string> = {
  critical: '#dc2626', high: '#ef4444', medium: '#f59e0b', low: '#10b981',
};
const statusColumns = ['open', 'under_review', 'escalated', 'closed'];
const statusLabels: Record<string, string> = {
  open: 'Open', under_review: 'Under Review', escalated: 'Escalated', closed: 'Closed',
};

export default function CasesPage() {
  const { success, error: showError } = useToast();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [newForm, setNewForm] = useState({ title: '', case_type: 'sanctions_match', priority: 'medium', client_name: '' });
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<any[]>([]);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listCases({ page_size: '100' });
      setCases(data.items || []);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  const handleCreateCase = async () => {
    try {
      await api.createCase(newForm);
      success('Case created');
      setShowNewModal(false);
      setNewForm({ title: '', case_type: 'sanctions_match', priority: 'medium', client_name: '' });
      fetchCases();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleStatusChange = async (caseId: string, newStatus: string) => {
    try {
      await api.updateCase(caseId, { status: newStatus });
      success(`Case moved to ${statusLabels[newStatus]}`);
      fetchCases();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const openCaseDetail = async (c: any) => {
    setSelectedCase(c);
    try {
      const n = await api.getCaseNotes(c.id);
      setNotes(n || []);
    } catch { setNotes([]); }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !selectedCase) return;
    try {
      await api.addCaseNote(selectedCase.id, noteText);
      setNoteText('');
      const n = await api.getCaseNotes(selectedCase.id);
      setNotes(n || []);
      success('Note added');
    } catch (err: any) {
      showError(err.message);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
    </div>;
  }

  return (
    <div>
      <div className="page-header animate-in">
        <div className="page-header-row">
          <div>
            <h2>Case Management</h2>
            <p>Investigation workflow — alerts, reviews, and resolutions</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
            <Plus size={16} /> New Case
          </button>
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

              <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                {column.map(c => (
                  <div key={c.id} onClick={() => openCaseDetail(c)} style={{
                    padding: '14px', borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{c.case_number || c.id?.slice(0, 12)}</span>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: priorityColors[c.priority] || '#6b7280',
                        boxShadow: `0 0 6px ${priorityColors[c.priority] || '#6b7280'}`,
                      }} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', lineHeight: 1.3 }}>{c.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      {c.client_name || '—'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`badge badge-${c.priority === 'critical' ? 'high' : c.priority}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                        {(c.priority || 'medium').toUpperCase()}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Case Modal */}
      {showNewModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowNewModal(false)}>
          <div className="glass-card" style={{ width: '480px', maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>New Case</h3>
              <button onClick={() => setShowNewModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <div className="input-group" style={{ marginBottom: '12px' }}>
              <label>Title</label>
              <input className="input" value={newForm.title} onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))} placeholder="Case title" />
            </div>
            <div className="input-group" style={{ marginBottom: '12px' }}>
              <label>Client Name</label>
              <input className="input" value={newForm.client_name} onChange={e => setNewForm(f => ({ ...f, client_name: e.target.value }))} placeholder="Client name" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div className="input-group">
                <label>Type</label>
                <select className="input" value={newForm.case_type} onChange={e => setNewForm(f => ({ ...f, case_type: e.target.value }))}>
                  <option value="sanctions_match">Sanctions Match</option>
                  <option value="adverse_media">Adverse Media</option>
                  <option value="pep_match">PEP Match</option>
                  <option value="risk_escalation">Risk Escalation</option>
                  <option value="monitoring_alert">Monitoring Alert</option>
                </select>
              </div>
              <div className="input-group">
                <label>Priority</label>
                <select className="input" value={newForm.priority} onChange={e => setNewForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleCreateCase} style={{ width: '100%' }}>Create Case</button>
          </div>
        </div>
      )}

      {/* Case Detail Modal */}
      {selectedCase && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setSelectedCase(null)}>
          <div className="glass-card" style={{ width: '600px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{selectedCase.title}</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{selectedCase.case_number || selectedCase.id?.slice(0, 12)}</span>
              </div>
              <button onClick={() => setSelectedCase(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span className={`badge badge-${selectedCase.priority === 'critical' ? 'high' : selectedCase.priority}`}>{(selectedCase.priority || '').toUpperCase()}</span>
              <span className={`badge badge-${selectedCase.status}`}>{statusLabels[selectedCase.status] || selectedCase.status}</span>
            </div>

            {/* Status Actions */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Move to:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {statusColumns.filter(s => s !== selectedCase.status).map(s => (
                  <button key={s} className="btn btn-secondary btn-sm" onClick={() => { handleStatusChange(selectedCase.id, s); setSelectedCase(null); }}>
                    {statusLabels[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={16} /> Notes
              </h4>
              {notes.map((n: any, i: number) => (
                <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', marginBottom: '8px', fontSize: '13px' }}>
                  <div style={{ color: 'var(--text-secondary)' }}>{n.content}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <input className="input" value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..." onKeyDown={e => e.key === 'Enter' && handleAddNote()} style={{ flex: 1 }} />
                <button className="btn btn-primary btn-sm" onClick={handleAddNote}><Send size={14} /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
