import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '../components/layout/Sidebar';
import { I18nProvider } from '../lib/i18n';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/screening',
}));

// Mock AuthProvider
vi.mock('../components/providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { full_name: 'Admin User', email: 'admin@complyarc.com', role: 'admin' },
    logout: vi.fn(),
    loading: false,
    isAuthenticated: true,
  }),
}));

// Mock api calls for badge counts
vi.mock('@/lib/api', () => ({
  default: {
    getAlertStats: vi.fn().mockResolvedValue({ unread: 3 }),
    listCases: vi.fn().mockResolvedValue({ total: 7 }),
  },
}));

describe('Sidebar Navigation Component Tests', () => {
  it('should render all navigation modules for admin user', () => {
    render(
      <I18nProvider>
        <Sidebar />
      </I18nProvider>
    );

    expect(screen.getByText('ComplyArc')).toBeInTheDocument();
    expect(screen.getByText('Screening')).toBeInTheDocument();
    expect(screen.getByText('Clients')).toBeInTheDocument();
    expect(screen.getByText('Cases')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
    expect(screen.getByText('Adverse Media')).toBeInTheDocument();
    expect(screen.getByText('Risk Analytics')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
  });
});
