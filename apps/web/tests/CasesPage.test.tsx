import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CasesPage from '@/app/cases/page';
import api from '@/lib/api';

vi.mock('@/lib/api', () => ({
  default: {
    listCases: vi.fn(),
    createCase: vi.fn(),
    updateCase: vi.fn(),
    getCaseNotes: vi.fn(),
    addCaseNote: vi.fn(),
  },
}));

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('CasesPage Component Tests', () => {
  const mockCases = [
    {
      id: 'case-1',
      case_number: 'CAS-1001',
      title: 'High Risk Sanctions Hit - John Doe',
      case_type: 'sanctions_match',
      priority: 'high',
      status: 'open',
      client_name: 'John Doe',
      created_at: new Date().toISOString(),
    },
    {
      id: 'case-2',
      case_number: 'CAS-1002',
      title: 'Adverse Media Escalation',
      case_type: 'adverse_media',
      priority: 'critical',
      status: 'under_review',
      client_name: 'Acme Corp',
      created_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.listCases).mockResolvedValue({
      items: mockCases,
      total: 2,
      page: 1,
      page_size: 100,
    });
    vi.mocked(api.getCaseNotes).mockResolvedValue([
      {
        id: 'note-1',
        case_id: 'case-1',
        author_email: 'analyst@complyarc.com',
        content: 'Reviewing OFAC SDN match results.',
        note_type: 'comment',
        created_at: new Date().toISOString(),
      },
    ]);
  });

  it('should render all 4 Kanban board columns and initial cases', async () => {
    render(<CasesPage />);

    // Check Kanban columns
    await waitFor(() => {
      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByText('Under Review')).toBeInTheDocument();
      expect(screen.getByText('Escalated')).toBeInTheDocument();
      expect(screen.getByText('Closed')).toBeInTheDocument();
    });

    // Check case card titles
    expect(screen.getByText('High Risk Sanctions Hit - John Doe')).toBeInTheDocument();
    expect(screen.getByText('Adverse Media Escalation')).toBeInTheDocument();
  });

  it('should open new case modal and submit a new case', async () => {
    vi.mocked(api.createCase).mockResolvedValue({
      id: 'case-3',
      case_number: 'CAS-1003',
      title: 'PEP Match - Senator Smith',
      status: 'open',
      priority: 'medium',
      created_at: new Date().toISOString(),
    });

    render(<CasesPage />);

    // Click "New Case" button
    const newCaseBtn = await screen.findByRole('button', { name: /new case/i });
    fireEvent.click(newCaseBtn);

    expect(screen.getByText('New Case', { selector: 'h3' })).toBeInTheDocument();

    // Fill form inputs
    const titleInput = screen.getByPlaceholderText('Case title');
    fireEvent.change(titleInput, { target: { value: 'PEP Match - Senator Smith' } });

    const clientInput = screen.getByPlaceholderText('Client name');
    fireEvent.change(clientInput, { target: { value: 'Senator Smith' } });

    // Submit form
    const createBtn = screen.getByRole('button', { name: /^create case$/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(api.createCase).toHaveBeenCalledWith({
        title: 'PEP Match - Senator Smith',
        case_type: 'sanctions_match',
        priority: 'medium',
        client_name: 'Senator Smith',
      });
    });
  });

  it('should update case status when moving status in detail modal', async () => {
    vi.mocked(api.updateCase).mockResolvedValue({
      id: 'case-1',
      case_number: 'CAS-1001',
      title: 'High Risk Sanctions Hit - John Doe',
      status: 'under_review',
      priority: 'high',
      created_at: new Date().toISOString(),
    });

    render(<CasesPage />);

    // Click case card title
    const caseCard = await screen.findByText('High Risk Sanctions Hit - John Doe');
    fireEvent.click(caseCard);

    // Wait for note content to confirm modal is open
    await waitFor(() => {
      expect(screen.getByText('Reviewing OFAC SDN match results.')).toBeInTheDocument();
    });

    // Click status move button "Under Review" inside the Move to section
    const moveButtons = screen.getAllByRole('button', { name: /under review/i });
    fireEvent.click(moveButtons[moveButtons.length - 1]);

    await waitFor(() => {
      expect(api.updateCase).toHaveBeenCalledWith('case-1', { status: 'under_review' });
    });
  });

  it('should add a case note successfully', async () => {
    vi.mocked(api.addCaseNote).mockResolvedValue({
      id: 'note-2',
      case_id: 'case-1',
      author_email: 'officer@complyarc.com',
      content: 'SAR filing approved by MLRO.',
      note_type: 'comment',
      created_at: new Date().toISOString(),
    });

    render(<CasesPage />);

    const caseCard = await screen.findByText('High Risk Sanctions Hit - John Doe');
    fireEvent.click(caseCard);

    await waitFor(() => {
      expect(screen.getByText('Reviewing OFAC SDN match results.')).toBeInTheDocument();
    });

    const noteInput = screen.getByPlaceholderText('Add a note...');
    fireEvent.change(noteInput, { target: { value: 'SAR filing approved by MLRO.' } });
    fireEvent.keyDown(noteInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(api.addCaseNote).toHaveBeenCalledWith('case-1', 'SAR filing approved by MLRO.');
    });
  });
});
