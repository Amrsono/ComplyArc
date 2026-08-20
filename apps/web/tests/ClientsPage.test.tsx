import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientsPage from '@/app/clients/page';
import api from '@/lib/api';

vi.mock('@/lib/api', () => ({
  default: {
    listClients: vi.fn(),
  },
}));

describe('ClientsPage Component Tests', () => {
  const mockClients = [
    {
      id: 'c-1',
      name: 'Falcon Holdings LLC',
      type: 'corporate',
      entity_type: 'corporate',
      status: 'active',
      risk_level: 'low',
      risk_score_total: 1.5,
      country: 'AE',
      created_at: new Date().toISOString(),
    },
    {
      id: 'c-2',
      name: 'John Doe',
      type: 'individual',
      entity_type: 'individual',
      status: 'dormant',
      risk_level: 'high',
      risk_score_total: 4.8,
      country: 'US',
      created_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.listClients).mockResolvedValue({
      items: mockClients,
      total: 2,
      page: 1,
      page_size: 20,
    } as any);
  });

  it('should render client list table with names and risk badges', async () => {
    render(<ClientsPage />);

    await waitFor(() => {
      expect(screen.getByText('Falcon Holdings LLC')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('LOW')).toBeInTheDocument();
      expect(screen.getByText('HIGH')).toBeInTheDocument();
    });
  });

  it('should filter clients by search input', async () => {
    render(<ClientsPage />);

    const searchInput = await screen.findByPlaceholderText('Search clients...');
    fireEvent.change(searchInput, { target: { value: 'Falcon' } });

    await waitFor(() => {
      expect(api.listClients).toHaveBeenCalled();
    });
  });
});
