'use client';

import React, { useState } from 'react';
import { useToast } from '@/components/ui/Toast';

export function NotificationSettings() {
  const { success } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      success('Notification preferences saved');
    } finally {
      setSaving(false);
    }
  };

  const notificationOptions = [
    { label: 'High-risk screening matches', desc: 'Immediate notification for high-confidence matches', checked: true },
    { label: 'Case status changes', desc: 'When cases are escalated or closed', checked: true },
    { label: 'New adverse media hits', desc: 'AI-detected negative news for monitored entities', checked: true },
    { label: 'Monitoring re-screen results', desc: 'Periodic screening results with changes', checked: false },
    { label: 'Weekly compliance digest', desc: 'Summary of weekly compliance activity', checked: true },
  ];

  return (
    <div className="glass-card">
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Notification Preferences</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {notificationOptions.map((n) => (
          <div
            key={n.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>{n.label}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{n.desc}</div>
            </div>
            <input
              type="checkbox"
              defaultChecked={n.checked}
              style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)' }}
            />
          </div>
        ))}
      </div>
      <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={handleSave} disabled={saving}>
        Save Preferences
      </button>
    </div>
  );
}
