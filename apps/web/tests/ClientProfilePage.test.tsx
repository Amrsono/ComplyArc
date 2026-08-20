import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientProfilePage from '@/app/clients/[id]/page';
import api from '@/lib/api';

vi.mock('@/lib/api', () => ({
  default: {
    getClient: vi.fn(),
    getUBOs: vi.fn(),
    getClientRisk: vi.fn(),
    calculateRisk: vi.fn(),
    updateClient: vi.fn(),
  },
}));

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('ClientProfilePage Component Tests', () => {
  const mockClient = {
    id: 'client-999',
    name: 'Apex Global Trade Ltd',
    entity_type: 'corporate',
    type: 'corporate',
    status: 'active',
    country: 'United Arab Emirates',
    jurisdiction: 'United Arab Emirates',
    industry: 'Commodities Trading',
    risk_level: 'high',
    risk_score_total: 4.2,
    date_of_birth: '2015-06-12',
    tax_id: 'TR-882910',
    created_at: new Date().toISOString(),
  };

  const mockUbos = [
    {
      id: 'ubo-1',
      client_id: 'client-999',
      name: 'Tariq Al-Mansoor',
      ownership_percent: 65,
      nationality: 'AE',
      is_pep: false,
      is_sanctioned: false,
      created_at: new Date().toISOString(),
    },
  ];

  const mockRisk = {
    client_id: 'client-999',
    total_score: 4.2,
    risk_level: 'high',
    breakdown: {
      client_risk: { score: 4, factors: ['High risk jurisdiction'] },
      geography_risk: { score: 4.5, factors: ['Cross-border high volume'] },
      product_risk: { score: 3.5, factors: ['Wire transfers'] },
      interface_risk: { score: 2.0, factors: ['Direct onboarding'] },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getClient).mockResolvedValue(mockClient as any);
    vi.mocked(api.getUBOs).mockResolvedValue(mockUbos as any);
    vi.mocked(api.getClientRisk).mockResolvedValue(mockRisk as any);
  });

  it('should render client name, status badge, UBO information, and details', async () => {
    render(<ClientProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Apex Global Trade Ltd')).toBeInTheDocument();
      expect(screen.getByText('Tariq Al-Mansoor')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
      expect(screen.getByText('United Arab Emirates')).toBeInTheDocument();
      expect(screen.getByText('Commodities Trading')).toBeInTheDocument();
    });
  });

  it('should calculate risk score on button click', async () => {
    vi.mocked(api.calculateRisk).mockResolvedValue({
      client_id: 'client-999',
      total_score: 4.5,
      risk_level: 'critical',
      breakdown: {
        client_risk: { score: 5, factors: [] },
        geography_risk: { score: 5, factors: [] },
        product_risk: { score: 4, factors: [] },
        interface_risk: { score: 3, factors: [] },
      },
    } as any);

    render(<ClientProfilePage />);

    const calculateBtn = await screen.findByRole('button', { name: /calculate risk/i });
    fireEvent.click(calculateBtn);

    await waitFor(() => {
      expect(api.calculateRisk).toHaveBeenCalledWith('client-999');
    });
  });

  it('should toggle client suspension status on click', async () => {
    vi.mocked(api.updateClient).mockResolvedValue({
      ...mockClient,
      status: 'suspended',
    } as any);

    render(<ClientProfilePage />);

    const suspendBtn = await screen.findByRole('button', { name: /^suspend$/i });
    fireEvent.click(suspendBtn);

    await waitFor(() => {
      expect(api.updateClient).toHaveBeenCalledWith('client-999', { status: 'suspended' });
    });
  });
});
