'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Search, Users, ShieldAlert, FileWarning,
  BarChart3, FileText, Settings, Bell, Activity, Database
} from 'lucide-react';

const navItems = [
  { section: 'Overview' },
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { section: 'Operations' },
  { label: 'Screening', href: '/screening', icon: Search },
  { label: 'Clients', href: '/clients', icon: Users },
  { label: 'Cases', href: '/cases', icon: ShieldAlert, badge: 3 },
  { label: 'Alerts', href: '/alerts', icon: Bell, badge: 7 },
  { section: 'Intelligence' },
  { label: 'Adverse Media', href: '/adverse-media', icon: FileWarning },
  { label: 'Risk Analytics', href: '/risk-analytics', icon: BarChart3 },
  { section: 'Management' },
  { label: 'Reports', href: '/reports', icon: FileText },
  { label: 'Monitoring', href: '/monitoring', icon: Activity },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar" id="main-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">C</div>
        <div className="logo-text">
          <h1>Cortex AML</h1>
          <span>Risk Intelligence</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item, i) => {
          if ('section' in item && !('label' in item)) {
            return (
              <div key={i} className="nav-section-label">
                {item.section}
              </div>
            );
          }

          if ('href' in item && 'icon' in item) {
            const Icon = item.icon!;
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname?.startsWith(item.href!));

            return (
              <Link
                key={item.href}
                href={item.href!}
                className={`nav-item ${isActive ? 'active' : ''}`}
                id={`nav-${item.label?.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className="nav-icon" size={20} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </Link>
            );
          }

          return null;
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border-primary)',
        fontSize: '11px',
        color: 'var(--text-tertiary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: 'var(--status-active)',
            boxShadow: '0 0 6px var(--status-active)',
          }} />
          System Operational
        </div>
        <div style={{ marginTop: '4px', opacity: 0.6 }}>v1.0.0 — Enterprise</div>
      </div>
    </aside>
  );
}
