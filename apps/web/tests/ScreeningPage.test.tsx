import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ScreeningPage from '@/app/screening/page';
import api from '@/lib/api';

vi.mock('@/lib/api', () => ({
  default: {
    screenEntity: vi.fn(),
    createCase: vi.fn(),
  },
}));

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('ScreeningPage Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search inputs, entity types, and list filters', () => {
    render(<ScreeningPage />);

    expect(screen.getByPlaceholderText(/Enter name to screen/i)).toBeInTheDocument();
    expect(screen.getByText('Individual')).toBeInTheDocument();
    expect(screen.getByText('Corporate')).toBeInTheDocument();
    expect(screen.getByText('OFAC')).toBeInTheDocument();
    expect(screen.getByText('EU')).toBeInTheDocument();
    expect(screen.getByText('UN')).toBeInTheDocument();
  });

  it('should trigger screening API and render match results with confidence badges', async () => {
    vi.mocked(api.screenEntity).mockResolvedValue({
      screening_id: 'scr-123',
      query_name: 'Viktor Bout',
      total_matches: 1,
      overall_risk: 'critical',
      created_at: new Date().toISOString(),
      matches: [
        {
          matched_name: 'Viktor Anatolyevich Bout',
          matched_list: 'OFAC',
          match_score: 95.4,
          match_confidence: 'high',
          name_similarity: 95.4,
          explanation: 'Exact alias match on OFAC SDN',
        },
      ],
    } as any);

    render(<ScreeningPage />);

    const searchInput = screen.getByPlaceholderText(/Enter name to screen/i);
    fireEvent.change(searchInput, { target: { value: 'Viktor Bout' } });

    const screenBtn = screen.getByRole('button', { name: /screen entity/i });
    fireEvent.click(screenBtn);

    await waitFor(() => {
      expect(api.screenEntity).toHaveBeenCalledWith('Viktor Bout', 'individual', {
        lists: ['OFAC', 'EU', 'UN', 'UK', 'PEP', 'Internal'],
      });
    });

    expect(await screen.findByText('Viktor Anatolyevich Bout')).toBeInTheDocument();
    expect(screen.getByText('95.4%')).toBeInTheDocument();
    expect(screen.getByText(/Exact alias match on OFAC SDN/)).toBeInTheDocument();
  });

  it('should open case escalation from match result', async () => {
    vi.mocked(api.screenEntity).mockResolvedValue({
      screening_id: 'scr-123',
      query_name: 'Viktor Bout',
      total_matches: 1,
      overall_risk: 'critical',
      created_at: new Date().toISOString(),
      matches: [
        {
          matched_name: 'Viktor Anatolyevich Bout',
          matched_list: 'OFAC',
          match_score: 95.4,
          match_confidence: 'high',
          name_similarity: 95.4,
          explanation: 'Exact alias match',
        },
      ],
    } as any);

    vi.mocked(api.createCase).mockResolvedValue({
      id: 'case-99',
      case_number: 'CAS-99',
      title: 'OFAC Match — Viktor Anatolyevich Bout',
      status: 'open',
      priority: 'critical',
      created_at: new Date().toISOString(),
    });

    render(<ScreeningPage />);

    const searchInput = screen.getByPlaceholderText(/Enter name to screen/i);
    fireEvent.change(searchInput, { target: { value: 'Viktor Bout' } });

    const screenBtn = screen.getByRole('button', { name: /screen entity/i });
    fireEvent.click(screenBtn);

    const createCaseBtn = await screen.findByRole('button', { name: /true match — create case/i });
    fireEvent.click(createCaseBtn);

    await waitFor(() => {
      expect(api.createCase).toHaveBeenCalledWith({
        title: 'OFAC Match — Viktor Anatolyevich Bout',
        client_name: 'Viktor Bout',
        priority: 'critical',
        case_type: 'sanctions_match',
      });
    });
  });
});
