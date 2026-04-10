'use client';

import { Settings as SettingsIcon, Key, Users, Bell, Shield, Globe, Database, Zap } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div>
      <div className="page-header animate-in">
        <h2>Settings</h2>
        <p>Platform configuration and administration</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
        {/* Settings Nav */}
        <div className="glass-card animate-in animate-in-delay-1" style={{ padding: '12px', height: 'fit-content' }}>
          {[
            { icon: Globe, label: 'Organization', active: true },
            { icon: Key, label: 'API Keys' },
            { icon: Users, label: 'Team Members' },
            { icon: Bell, label: 'Notifications' },
            { icon: Shield, label: 'Security' },
            { icon: Database, label: 'Data Sources' },
            { icon: Zap, label: 'Integrations' },
          ].map(item => (
            <div key={item.label} className={`nav-item ${item.active ? 'active' : ''}`}>
              <item.icon className="nav-icon" size={18} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Settings Content */}
        <div className="animate-in animate-in-delay-2">
          {/* Organization */}
          <div className="glass-card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Organization Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group">
                <label>Organization Name</label>
                <input className="input" defaultValue="ComplyArc Enterprise" />
              </div>
              <div className="input-group">
                <label>Industry</label>
                <select className="input">
                  <option>Financial Services</option>
                  <option>Banking</option>
                  <option>Fintech</option>
                  <option>Law Firm</option>
                  <option>Corporate Service Provider</option>
                </select>
              </div>
              <div className="input-group">
                <label>Contact Email</label>
                <input className="input" type="email" defaultValue="compliance@company.com" />
              </div>
              <div className="input-group">
                <label>Jurisdiction</label>
                <select className="input">
                  <option>United Arab Emirates</option>
                  <option>United Kingdom</option>
                  <option>United States</option>
                  <option>European Union</option>
                </select>
              </div>
            </div>
            <button className="btn btn-primary" style={{ marginTop: '20px' }}>Save Changes</button>
          </div>

          {/* API Keys */}
          <div className="glass-card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>API Keys</h3>
              <button className="btn btn-primary btn-sm"><Key size={14} /> Generate Key</button>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Key</th><th>Created</th><th>Last Used</th><th>Status</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 500 }}>Production Key</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>ctx_a1b2c3d4e5...â—â—â—â—</td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>2024-01-15</td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>2 hours ago</td>
                  <td><span className="badge badge-active">Active</span></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 500 }}>Staging Key</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>ctx_f6g7h8i9j0...â—â—â—â—</td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>2024-03-20</td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>1 day ago</td>
                  <td><span className="badge badge-active">Active</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Risk Thresholds */}
          <div className="glass-card">
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Risk Scoring Configuration</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group">
                <label>High Risk Threshold (â‰¥)</label>
                <input className="input" type="number" defaultValue="4.0" step="0.1" min="1" max="5" />
              </div>
              <div className="input-group">
                <label>Medium Risk Threshold (â‰¥)</label>
                <input className="input" type="number" defaultValue="2.5" step="0.1" min="1" max="5" />
              </div>
              <div className="input-group">
                <label>Match Confidence â€” High (â‰¥%)</label>
                <input className="input" type="number" defaultValue="85" min="50" max="100" />
              </div>
              <div className="input-group">
                <label>Match Confidence â€” Medium (â‰¥%)</label>
                <input className="input" type="number" defaultValue="70" min="30" max="100" />
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
            <button className="btn btn-primary" style={{ marginTop: '20px' }}>Save Configuration</button>
          </div>
        </div>
      </div>
    </div>
  );
}
