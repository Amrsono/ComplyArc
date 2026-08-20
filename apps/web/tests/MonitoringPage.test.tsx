import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import MonitoringPage from '@/app/monitoring/page';
import api from '@/lib/api';
import { ToastProvider } from '@/components/ui/Toast';

vi.mock('@/lib/api', () => ({
  default: {
    listMonitoring: vi.fn(),
    toggleMonitoring: vi.fn(),
    registerMonitoring: vi.fn(),
    listClients: vi.fn(),
  },
}));

describe('MonitoringPage Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render monitoring header and stats cards', async () => {
    vi.mocked(api.listMonitoring).mockResolvedValue({
      total: 2,
      active: 2,
      paused: 0,
      total_alerts: 1,
      items: [
        {
          id: 'mon-1',
          client_id: 'c-1',
          client_name: 'Acme Corp',
          frequency: 'daily',
          status: 'active',
          alerts_count: 1,
          check_sanctions: true,
          check_pep: true,
          check_adverse_media: false,
          last_checked_at: '2026-08-20T10:00:00Z',
        },
      ],
    } as any);

    render(
      <ToastProvider>
        <MonitoringPage />
      </ToastProvider>
    );

    expect(await screen.findByText('Continuous Monitoring')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('should toggle monitoring status on button click', async () => {
    vi.mocked(api.listMonitoring).mockResolvedValue({
      total: 1,
      active: 0,
      paused: 1,
      total_alerts: 0,
      items: [
        {
          id: 'mon-1',
          client_id: 'c-1',
          client_name: 'Acme Corp',
          frequency: 'daily',
          status: 'paused',
          alerts_count: 0,
          check_sanctions: true,
          check_pep: true,
          check_adverse_media: false,
          last_checked_at: '2026-08-20T10:00:00Z',
        },
      ],
    } as any);

    vi.mocked(api.toggleMonitoring).mockResolvedValue({
      id: 'mon-1',
      status: 'active',
    } as any);

    render(
      <ToastProvider>
        <MonitoringPage />
      </ToastProvider>
    );

    const resumeBtn = await screen.findByRole('button', { name: /Resume/i });
    fireEvent.click(resumeBtn);

    await waitFor(() => {
      expect(api.toggleMonitoring).toHaveBeenCalledWith('mon-1');
    });
  });
});
