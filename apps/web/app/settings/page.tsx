'use client';

import React, { useState } from 'react';
import { Settings as SettingsIcon, Key, Users, Bell, Shield, Globe, Database, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTranslation } from '@/lib/i18n';
import { OrgSettings } from './components/OrgSettings';
import { ApiKeysSettings } from './components/ApiKeysSettings';
import { RiskSettings } from './components/RiskSettings';
import { NotificationSettings } from './components/NotificationSettings';
import { DataSourcesSettings } from './components/DataSourcesSettings';

interface SettingsSectionItem {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  labelKey: string;
  id: string;
}

const settingsSections: SettingsSectionItem[] = [
  { icon: Globe, labelKey: 'settings.org', id: 'org' },
  { icon: Key, labelKey: 'settings.apiKeys', id: 'api' },
  { icon: Shield, labelKey: 'settings.risk', id: 'risk' },
  { icon: Bell, labelKey: 'settings.notif', id: 'notif' },
  { icon: Users, labelKey: 'settings.team', id: 'team' },
  { icon: Database, labelKey: 'settings.data', id: 'data' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('org');

  if (user?.role !== 'admin') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
          }}
        >
          <ShieldAlert size={40} style={{ color: 'var(--risk-high)' }} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.6 }}>
          The settings panel is reserved for authorized system administrators only. Please contact your IT department if
          you believe this is an error.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header animate-in">
        <h2>{t('settings.title')}</h2>
        <p>{t('settings.subtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
        {/* Settings Navigation */}
        <div className="glass-card animate-in animate-in-delay-1" style={{ padding: '12px', height: 'fit-content' }}>
          {settingsSections.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
              style={{ cursor: 'pointer' }}
            >
              <item.icon className="nav-icon" size={18} />
              <span>{t(item.labelKey)}</span>
            </div>
          ))}
        </div>

        {/* Settings Content Panels */}
        <div className="animate-in animate-in-delay-2">
          {activeSection === 'org' && <OrgSettings />}
          {activeSection === 'api' && <ApiKeysSettings />}
          {activeSection === 'risk' && <RiskSettings />}
          {activeSection === 'notif' && <NotificationSettings />}
          {activeSection === 'team' && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
              <SettingsIcon size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>Team Management</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Role-based team invitations and enterprise SSO are available in enterprise tier.
              </p>
            </div>
          )}
          {activeSection === 'data' && <DataSourcesSettings />}
        </div>
      </div>
    </div>
  );
}
