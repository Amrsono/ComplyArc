'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/components/providers/AuthProvider';
import { ShieldAlert } from 'lucide-react';

const settingsSections = [
  { icon: Globe, label: 'Organization', id: 'org' },
  { icon: Key, label: 'API Keys', id: 'api' },
  { icon: Shield, label: 'Risk Scoring', id: 'risk' },
  { icon: Bell, label: 'Notifications', id: 'notif' },
  { icon: Users, label: 'Team Members', id: 'team' },
  { icon: Database, label: 'Data Sources', id: 'data' },
  { icon: Zap, label: 'Integrations', id: 'integ' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { success } = useToast();
  const [activeSection, setActiveSection] = useState('org');

  if (user?.email !== 'admin@arc.com') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px'
        }}>
          <ShieldAlert size={40} style={{ color: 'var(--risk-high)' }} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.6 }}>
          The settings panel is reserved for authorized system administrators only. 
          Please contact your IT department if you believe this is an error.
        </p>
      </div>
    );
  }

  const [saving, setSaving] = useState(false);
  const [orgForm, setOrgForm] = useState({ name: 'ComplyArc Enterprise', industry: 'Financial Services', email: 'compliance@company.com', jurisdiction: 'United Arab Emirates' });
  const [riskForm, setRiskForm] = useState({ highThreshold: '4.0', medThreshold: '2.5', highConfidence: '85', medConfidence: '70' });
  const [apiKeys, setApiKeys] = useState([
    { id: '1', name: 'Production Key', key: 'ctx_a1b2c3d4e5...●●●●', created: '2024-01-15', lastUsed: '2 hours ago', active: true },
    { id: '2', name: 'Staging Key', key: 'ctx_f6g7h8i9j0...●●●●', created: '2024-03-20', lastUsed: '1 day ago', active: true },
  ]);

  const handleSave = async (section: string) => {
    setSaving(true);
    try {
      // Simulate API save
      await new Promise(r => setTimeout(r, 800));
      success(`${section} settings saved`);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateKey = () => {
    const newKey = {
      id: String(apiKeys.length + 1),
      name: `Key ${apiKeys.length + 1}`,
      key: `ctx_${Math.random().toString(36).slice(2, 12)}...●●●●`,
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      active: true,
    };
    setApiKeys(prev => [...prev, newKey]);
    success('API key generated');
  };

  return (
    <div>
      <div className="page-header animate-in">
        <h2>Settings</h2>
        <p>Platform configuration and administration</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
        {/* Settings Nav */}
        <div className="glass-card animate-in animate-in-delay-1" style={{ padding: '12px', height: 'fit-content' }}>
          {settingsSections.map(item => (
            <div
              key={item.id}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
              style={{ cursor: 'pointer' }}
            >
              <item.icon className="nav-icon" size={18} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Settings Content */}
        <div className="animate-in animate-in-delay-2">
          {activeSection === 'org' && (
            <div className="glass-card">
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Organization Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <label>Organization Name</label>
                  <input className="input" value={orgForm.name} onChange={e => setOrgForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label>Industry</label>
                  <select className="input" value={orgForm.industry} onChange={e => setOrgForm(f => ({ ...f, industry: e.target.value }))}>
                    <option>Financial Services</option><option>Banking</option><option>Fintech</option><option>Law Firm</option><option>Corporate Service Provider</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Contact Email</label>
                  <input className="input" type="email" value={orgForm.email} onChange={e => setOrgForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label>Jurisdiction</label>
                  <select className="input" value={orgForm.jurisdiction} onChange={e => setOrgForm(f => ({ ...f, jurisdiction: e.target.value }))}>
                    <option>United Arab Emirates</option><option>United Kingdom</option><option>United States</option><option>European Union</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => handleSave('Organization')} disabled={saving}>
                {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : 'Save Changes'}
              </button>
            </div>
          )}

          {activeSection === 'api' && (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>API Keys</h3>
                <button className="btn btn-primary btn-sm" onClick={handleGenerateKey}><Key size={14} /> Generate Key</button>
              </div>
              <table className="data-table">
                <thead>
                  <tr><th>Name</th><th>Key</th><th>Created</th><th>Last Used</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {apiKeys.map(k => (
                    <tr key={k.id}>
                      <td style={{ fontWeight: 500 }}>{k.name}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>{k.key}</td>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{k.created}</td>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{k.lastUsed}</td>
                      <td><span className="badge badge-active">Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'risk' && (
            <div className="glass-card">
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Risk Scoring Configuration</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <label>High Risk Threshold (≥)</label>
                  <input className="input" type="number" value={riskForm.highThreshold} onChange={e => setRiskForm(f => ({ ...f, highThreshold: e.target.value }))} step="0.1" min="1" max="5" />
                </div>
                <div className="input-group">
                  <label>Medium Risk Threshold (≥)</label>
                  <input className="input" type="number" value={riskForm.medThreshold} onChange={e => setRiskForm(f => ({ ...f, medThreshold: e.target.value }))} step="0.1" min="1" max="5" />
                </div>
                <div className="input-group">
                  <label>Match Confidence — High (≥%)</label>
                  <input className="input" type="number" value={riskForm.highConfidence} onChange={e => setRiskForm(f => ({ ...f, highConfidence: e.target.value }))} min="50" max="100" />
                </div>
                <div className="input-group">
                  <label>Match Confidence — Medium (≥%)</label>
                  <input className="input" type="number" value={riskForm.medConfidence} onChange={e => setRiskForm(f => ({ ...f, medConfidence: e.target.value }))} min="30" max="100" />
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>Risk Weight Distribution</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  {[
                    { label: 'Client Risk', weight: 40 },
                    { label: 'Geography Risk', weight: 20 },
                    { label: 'Product Risk', weight: 20 },
                    { label: 'Interface Risk', weight: 20 },
                  ].map(w => (
                    <div key={w.label} style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>{w.label}</div>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent-primary)' }}>{w.weight}%</div>
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => handleSave('Risk Configuration')} disabled={saving}>
                {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : 'Save Configuration'}
              </button>
            </div>
          )}

          {activeSection === 'notif' && (
            <div className="glass-card">
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Notification Preferences</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'High-risk screening matches', desc: 'Immediate notification for high-confidence matches', checked: true },
                  { label: 'Case status changes', desc: 'When cases are escalated or closed', checked: true },
                  { label: 'New adverse media hits', desc: 'AI-detected negative news for monitored entities', checked: true },
                  { label: 'Monitoring re-screen results', desc: 'Periodic screening results with changes', checked: false },
                  { label: 'Weekly compliance digest', desc: 'Summary of weekly compliance activity', checked: true },
                ].map(n => (
                  <div key={n.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{n.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{n.desc}</div>
                    </div>
                    <input type="checkbox" defaultChecked={n.checked} style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)' }} />
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => handleSave('Notifications')}>Save Preferences</button>
            </div>
          )}

          {(activeSection === 'team' || activeSection === 'integ') && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
              <SettingsIcon size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>
                {activeSection === 'team' ? 'Team Management' : 'Integrations'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                This section will be available in a future update. Contact support for early access.
              </p>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="glass-card">
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Data Sources & Intelligence</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-primary)' }}>
                  <h4 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>Global Watchlists (OFAC, UN, PEPs)</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Trigger a manual synchronization of the latest global intelligence data. This will stream and ingest the newest records from the US Treasury, UN Security Council, and OpenSanctions Global databases into your local intelligence pool.
                  </p>
                  
                  <button 
                    className="btn btn-primary" 
                    onClick={async () => {
                      setSaving(true);
                      try {
                        const { api } = await import('@/lib/api');
                        await api.ingestSanctions();
                        success('Global watchlists successfully synchronized!');
                      } catch (error) {
                        console.error('Ingestion failed', error);
                        success('Failed to synchronize data. Check console.');
                      } finally {
                        setSaving(false);
                      }
                    }} 
                    disabled={saving}
                  >
                    {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} /> Synchronizing Live Intelligence...</> : <><Database size={14} style={{ marginRight: '8px' }}/> Sync Global Watchlists</>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
