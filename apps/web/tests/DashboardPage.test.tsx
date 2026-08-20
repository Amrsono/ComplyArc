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
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  };
});

describe('DashboardPage Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render compliance metrics, risk cards, and quick actions', async () => {
    vi.mocked(api.getDashboardStats).mockResolvedValue({
      total_clients: 1250,
      total_screenings: 45,
      active_alerts: 7,
      open_cases: 12,
      risk_distribution: { high: 28, medium: 140, low: 1082 },
      cases_by_status: { new: 3, open: 5, in_review: 4, closed: 10 },
      recent_alerts: [],
    } as any);

    render(<DashboardPage />);

    expect(await screen.findByText('Total Clients')).toBeInTheDocument();
    expect(screen.getByText('Active Cases')).toBeInTheDocument();
    expect(screen.getByText('Risk Distribution')).toBeInTheDocument();
  });
});
