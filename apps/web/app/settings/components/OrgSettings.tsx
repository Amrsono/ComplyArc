'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation, Language } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';

export function OrgSettings() {
  const { t, language, setLanguage } = useTranslation();
  const { success } = useToast();
  const [saving, setSaving] = useState(false);
  const [orgForm, setOrgForm] = useState({
    name: 'ComplyArc Enterprise',
    industry: 'Financial Services',
    email: 'compliance@company.com',
    jurisdiction: 'United Arab Emirates',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      success('Organization details saved successfully');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card">
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Organization Details</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="input-group">
          <label>{t('settings.language')}</label>
          <select className="input" value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
            <option value="en">English</option>
            <option value="ar">العربية (Arabic)</option>
            <option value="fr">Français (French)</option>
            <option value="es">Español (Spanish)</option>
            <option value="pt">Português (Portuguese)</option>
          </select>
        </div>
        <div className="input-group">
          <label>Organization Name</label>
          <input
            className="input"
            value={orgForm.name}
            onChange={(e) => setOrgForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="input-group">
          <label>Industry</label>
          <select
            className="input"
            value={orgForm.industry}
            onChange={(e) => setOrgForm((f) => ({ ...f, industry: e.target.value }))}
          >
            <option>Financial Services</option>
            <option>Banking</option>
            <option>Fintech</option>
            <option>Law Firm</option>
            <option>Corporate Service Provider</option>
          </select>
        </div>
        <div className="input-group">
          <label>Contact Email</label>
          <input
            className="input"
            type="email"
            value={orgForm.email}
            onChange={(e) => setOrgForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div className="input-group">
          <label>Jurisdiction</label>
          <select
            className="input"
            value={orgForm.jurisdiction}
            onChange={(e) => setOrgForm((f) => ({ ...f, jurisdiction: e.target.value }))}
          >
            <option>United Arab Emirates</option>
            <option>United Kingdom</option>
            <option>United States</option>
            <option>European Union</option>
          </select>
        </div>
      </div>
      <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={handleSave} disabled={saving}>
        {saving ? (
          <>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </button>
    </div>
  );
}
