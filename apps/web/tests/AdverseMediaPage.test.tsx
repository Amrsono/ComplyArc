import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import AdverseMediaPage from '@/app/adverse-media/page';
import api from '@/lib/api';
import { ToastProvider } from '@/components/ui/Toast';

vi.mock('@/lib/api', () => ({
  default: {
    searchMedia: vi.fn(),
  },
}));

describe('AdverseMediaPage Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render adverse media scan search bar', () => {
    render(
      <ToastProvider>
        <AdverseMediaPage />
      </ToastProvider>
    );

    expect(screen.getByText('Adverse Media Intelligence')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search adverse media for entity/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /AI Media Scan/i })).toBeInTheDocument();
  });

  it('should execute search and render returned news articles and risk tags', async () => {
    vi.mocked(api.searchMedia).mockResolvedValue({
      entity_name: 'Acme International',
      total_hits: 1,
      high_severity: 1,
      results: [
        {
          id: 'media-1',
          title: 'Acme International Under Investigation for Money Laundering',
          source: 'Financial News',
          source_url: 'https://example.com/article1',
          category: 'money_laundering',
          severity: 'high',
          relevance_score: 90,
          confidence_score: 85,
          snippet: 'Authorities announced criminal inquiry into financial transactions.',
        },
      ],
      ai_overall_summary: 'Significant AML risk detected relating to fraudulent trade finance transactions.',
    });

    render(
      <ToastProvider>
        <AdverseMediaPage />
      </ToastProvider>
    );

    const input = screen.getByPlaceholderText(/Search adverse media for entity/i);
    fireEvent.change(input, { target: { value: 'Acme International' } });

    const scanBtn = screen.getByRole('button', { name: /AI Media Scan/i });
    fireEvent.click(scanBtn);

    await waitFor(() => {
      expect(api.searchMedia).toHaveBeenCalledWith('Acme International');
      expect(screen.getByText('Acme International Under Investigation for Money Laundering')).toBeInTheDocument();
    });
  });
});
