import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import CasesPage from '@/app/cases/page';
import api from '@/lib/api';
import { ToastProvider } from '@/components/ui/Toast';

vi.mock('@/lib/api', () => ({
  default: {
    listCases: vi.fn(),
    createCase: vi.fn(),
    updateCase: vi.fn(),
    addCaseNote: vi.fn(),
    getCaseNotes: vi.fn(),
  },
}));

describe('CasesPage Kanban & Investigation Tests', () => {
  const mockCases = [
    {
      id: 'case-101',
      title: 'Potential OFAC Match: Alpha Corp',
      case_type: 'sanctions_match',
      priority: 'high',
      status: 'open',
      client_name: 'Alpha Corp',
      created_at: new Date().toISOString(),
    },
    {
      id: 'case-102',
      title: 'Adverse Media Review: Beta Ltd',
      case_type: 'adverse_media',
      priority: 'medium',
      status: 'under_review',
      client_name: 'Beta Ltd',
      created_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.listCases).mockResolvedValue({
      items: mockCases,
      total: 2,
    } as any);
  });

  it('should render kanban columns and move case status from detail modal', async () => {
    vi.mocked(api.getCaseNotes).mockResolvedValue([]);
    vi.mocked(api.updateCase).mockResolvedValue({
      ...mockCases[0],
      status: 'under_review',
    } as any);

    render(
      <ToastProvider>
        <CasesPage />
      </ToastProvider>
    );

    const caseCard = await screen.findByText('Potential OFAC Match: Alpha Corp');
    expect(screen.getByText('Adverse Media Review: Beta Ltd')).toBeInTheDocument();

    // Click case card to open modal
    fireEvent.click(caseCard);

    // Click "Under Review" status transition button
    const reviewBtn = await screen.findByRole('button', { name: /^Under Review$/i });
    fireEvent.click(reviewBtn);

    await waitFor(() => {
      expect(api.updateCase).toHaveBeenCalledWith('case-101', { status: 'under_review' });
    });
  });

  it('should open case detail modal and add investigation notes', async () => {
    vi.mocked(api.getCaseNotes).mockResolvedValue([
      {
        id: 'note-1',
        case_id: 'case-101',
        author: 'compliance@arc.com',
        content: 'Initial screening verified against OFAC list.',
        created_at: new Date().toISOString(),
      },
    ] as any);

    vi.mocked(api.addCaseNote).mockResolvedValue({
      id: 'note-2',
      case_id: 'case-101',
      author: 'compliance@arc.com',
      content: 'Enhanced due diligence requested from compliance officer.',
      created_at: new Date().toISOString(),
    } as any);

    render(
      <ToastProvider>
        <CasesPage />
      </ToastProvider>
    );

    const caseCard = await screen.findByText('Potential OFAC Match: Alpha Corp');
    fireEvent.click(caseCard);

    expect(await screen.findByText('Initial screening verified against OFAC list.')).toBeInTheDocument();

    const noteInput = screen.getByPlaceholderText(/Add a note/i);
    fireEvent.change(noteInput, {
      target: { value: 'Enhanced due diligence requested from compliance officer.' },
    });

    const sendBtn = noteInput.parentElement?.querySelector('button');
    expect(sendBtn).toBeDefined();
    if (sendBtn) fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(api.addCaseNote).toHaveBeenCalledWith(
        'case-101',
        'Enhanced due diligence requested from compliance officer.'
      );
    });
  });
});
