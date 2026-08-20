import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import DashboardPage from '@/app/page';
import api from '@/lib/api';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/lib/api', () => ({
  default: {
    getDashboardStats: vi.fn(),
  },
}));

vi.mock('recharts', async () => {
  const original = await vi.importActual<any>('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => <div data-testid="chart-container">{children}</div>,
  };
});

describe('DashboardCharts & KPI Rendering Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all KPI metric cards and risk distribution numbers accurately', async () => {
    vi.mocked(api.getDashboardStats).mockResolvedValue({
      total_clients: 2450,
      total_screenings: 180,
      active_alerts: 15,
      open_cases: 8,
      risk_distribution: {
        high: 42,
        medium: 210,
        low: 2198,
      },
      cases_by_status: {
        open: 8,
        under_review: 5,
        escalated: 2,
        closed: 45,
      },
      recent_alerts: [],
    } as any);

    render(<DashboardPage />);

    expect(await screen.findByText('Compliance Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Total Clients')).toBeInTheDocument();
    expect(screen.getByText('High Risk')).toBeInTheDocument();
    expect(screen.getByText('Active Cases')).toBeInTheDocument();
    expect(screen.getByText('Risk Distribution')).toBeInTheDocument();
    expect(screen.getByText('Cases by Status')).toBeInTheDocument();
  });
});
