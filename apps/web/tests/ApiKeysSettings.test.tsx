import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ApiKeysSettings } from '@/app/settings/components/ApiKeysSettings';
import api from '@/lib/api';
import { ToastProvider } from '@/components/ui/Toast';

vi.mock('@/lib/api', () => ({
  default: {
    getSystemSettings: vi.fn(),
    updateSystemSetting: vi.fn(),
  },
}));

describe('ApiKeysSettings Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render configured API keys list with masked values and configured badges', async () => {
    vi.mocked(api.getSystemSettings).mockResolvedValue([
      {
        key: 'news_api_key',
        value: 'sk_live_1234567890abcdef',
        description: 'API Key used for live adverse news sentiment checks',
      },
      {
        key: 'openai_api_key',
        value: '',
        description: 'OpenAI key for adverse media risk analysis',
      },
    ]);

    render(
      <ToastProvider>
        <ApiKeysSettings />
      </ToastProvider>
    );

    expect(await screen.findByText('Service API Keys')).toBeInTheDocument();
    expect(screen.getByText('News API')).toBeInTheDocument();
    expect(screen.getByText('OpenAI API')).toBeInTheDocument();
    expect(screen.getByText('● CONFIGURED')).toBeInTheDocument();
    expect(screen.getByText('● NOT SET')).toBeInTheDocument();
  });

  it('should allow editing an API key and submit update to api.updateSystemSetting', async () => {
    vi.mocked(api.getSystemSettings).mockResolvedValue([
      {
        key: 'news_api_key',
        value: 'sk_old_key',
        description: 'News API Key',
      },
    ]);
    vi.mocked(api.updateSystemSetting).mockResolvedValue({
      key: 'news_api_key',
      value: 'sk_new_secret_key_12345',
    });

    render(
      <ToastProvider>
        <ApiKeysSettings />
      </ToastProvider>
    );

    const editBtn = await screen.findByRole('button', { name: /Edit/i });
    fireEvent.click(editBtn);

    const input = screen.getByPlaceholderText(/Paste new API key here/i);
    fireEvent.change(input, { target: { value: 'sk_new_secret_key_12345' } });

    const saveBtn = screen.getByRole('button', { name: /Save Key/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.updateSystemSetting).toHaveBeenCalledWith('news_api_key', 'sk_new_secret_key_12345');
    });
  });
});
