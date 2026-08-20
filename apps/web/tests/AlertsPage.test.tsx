import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AlertsPage from '@/app/alerts/page';
import api from '@/lib/api';

vi.mock('@/lib/api', () => ({
  default: {
    listAlerts: vi.fn(),
    getAlertStats: vi.fn(),
    markAllAlertsRead: vi.fn(),
    createCase: vi.fn(),
  },
}));

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('AlertsPage Component Tests', () => {
  const mockAlerts = [
    {
      id: 'alt-1',
      title: 'OFAC Sanction match detected for client',
      description: 'Client name matched OFAC SDN listing with 96% confidence',
      severity: 'high',
      status: 'unread',
      alert_type: 'sanctions_hit',
      type: 'sanctions_match',
      client: 'Al-Mansoor Trading',
      client_id: 'cli-101',
      created_at: new Date().toISOString(),
    },
    {
      id: 'alt-2',
      title: 'Adverse media spike detected',
      description: 'Multiple articles flagged for corruption inquiries',
      severity: 'critical',
      status: 'unread',
      alert_type: 'adverse_media',
      type: 'adverse_media',
      client: 'Global Minerals',
      client_id: 'cli-102',
      created_at: new Date().toISOString(),
    },
  ];

  const mockStats = {
    total: 2,
    unread: 2,
    high: 1,
    medium: 1,
    low: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.listAlerts).mockResolvedValue({
      items: mockAlerts,
      total: 2,
      page: 1,
      page_size: 50,
    } as any);
    vi.mocked(api.getAlertStats).mockResolvedValue(mockStats as any);
  });

  it('should render alert cards and statistics banner', async () => {
    render(<AlertsPage />);

    await waitFor(() => {
      expect(screen.getByText('Al-Mansoor Trading')).toBeInTheDocument();
      expect(screen.getByText('Global Minerals')).toBeInTheDocument();
      expect(screen.getByText('Client name matched OFAC SDN listing with 96% confidence')).toBeInTheDocument();
    });
  });

  it('should mark all alerts as read on button click', async () => {
    vi.mocked(api.markAllAlertsRead).mockResolvedValue({ updated: 2 } as any);

    render(<AlertsPage />);

    const markReadBtn = await screen.findByRole('button', { name: /mark all read/i });
    fireEvent.click(markReadBtn);

    await waitFor(() => {
      expect(api.markAllAlertsRead).toHaveBeenCalled();
    });
  });

  it('should trigger case escalation from alert action', async () => {
    vi.mocked(api.createCase).mockResolvedValue({
      id: 'case-99',
      case_number: 'CAS-99',
      title: 'Client name matched OFAC SDN listing with 96% confidence',
      status: 'open',
      priority: 'high',
      created_at: new Date().toISOString(),
    });

    render(<AlertsPage />);

    const createCaseBtns = await screen.findAllByRole('button', { name: /create case/i });
    fireEvent.click(createCaseBtns[0]);

    await waitFor(() => {
      expect(api.createCase).toHaveBeenCalledWith({
        title: 'Client name matched OFAC SDN listing with 96% confidence',
        case_type: 'sanctions_match',
        priority: 'high',
        client_id: 'cli-101',
        client_name: 'Al-Mansoor Trading',
      });
    });
  });
});
