'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Search, Users, ShieldAlert, FileWarning,
  BarChart3, FileText, Settings, Bell, Activity, LogOut
} from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

const navItems = [
  { sectionKey: 'nav.overview' },
  { labelKey: 'nav.dashboard', href: '/', icon: LayoutDashboard },
  { sectionKey: 'nav.operations' },
  { labelKey: 'nav.screening', href: '/screening', icon: Search },
  { labelKey: 'nav.clients', href: '/clients', icon: Users },
  { labelKey: 'nav.cases', href: '/cases', icon: ShieldAlert, badgeKey: 'cases' },
  { labelKey: 'nav.alerts', href: '/alerts', icon: Bell, badgeKey: 'alerts' },
  { sectionKey: 'nav.intelligence' },
  { labelKey: 'nav.adverseMedia', href: '/adverse-media', icon: FileWarning },
  { labelKey: 'nav.riskAnalytics', href: '/risk-analytics', icon: BarChart3 },
  { sectionKey: 'nav.management' },
  { labelKey: 'nav.reports', href: '/reports', icon: FileText },
  { labelKey: 'nav.monitoring', href: '/monitoring', icon: Activity },
  { labelKey: 'nav.settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [badges, setBadges] = useState<Record<string, number>>({});

  // Fetch live badge counts
  useEffect(() => {
    async function fetchBadges() {
      try {
        const [alertStats, caseData] = await Promise.all([
          api.getAlertStats().catch(() => null),
          api.listCases({ page_size: '1' }).catch(() => null),
        ]);
        const newBadges: Record<string, number> = {};
        if (alertStats?.unread) newBadges.alerts = alertStats.unread;
        if (caseData?.total) newBadges.cases = caseData.total;
        setBadges(newBadges);
      } catch { /* silent */ }
    }
    fetchBadges();
    const interval = setInterval(fetchBadges, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="sidebar" id="main-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">CA</div>
        <div className="logo-text">
          <h1>ComplyArc</h1>
          <span>Risk Intelligence</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item, i) => {
          if ('sectionKey' in item) {
            return (
              <div key={i} className="nav-section-label">
                {t(item.sectionKey as string)}
              </div>
            );
          }

          if ('href' in item && 'icon' in item) {
            // Role-based visibility check for Settings
            if (item.labelKey === 'nav.settings' && user?.role !== 'admin') {
              return null;
            }

            const Icon = item.icon!;
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname?.startsWith(item.href!));
            const badgeCount = item.badgeKey ? badges[item.badgeKey] : undefined;

            return (
              <Link
                key={item.href}
                href={item.href!}
                className={`nav-item ${isActive ? 'active' : ''}`}
                id={`nav-${item.labelKey?.replace('nav.', '')}`}
              >
                <Icon className="nav-icon" size={20} />
                <span>{t(item.labelKey as string)}</span>
                {badgeCount !== undefined && badgeCount > 0 && (
                  <span className="nav-badge">{badgeCount > 99 ? '99+' : badgeCount}</span>
                )}
              </Link>
            );
          }

          return null;
        })}
      </nav>

      {/* User + Logout */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border-primary)',
        fontSize: '11px',
        color: 'var(--text-tertiary)',
      }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.full_name || user.email}
              </div>
              <div style={{ fontSize: '10px', opacity: 0.7, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.email}</div>
            </div>
            <button
              onClick={logout}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-tertiary)', padding: '4px',
                borderRadius: '4px', transition: 'all 0.2s',
              }}
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: 'var(--status-active)',
            boxShadow: '0 0 6px var(--status-active)',
          }} />
          {t('nav.systemOperational')}
        </div>
        <div style={{ marginTop: '4px', opacity: 0.6 }}>v1.0.0 — Enterprise</div>
      </div>
    </aside>
  );
}
