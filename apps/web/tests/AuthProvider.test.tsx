import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/components/providers/AuthProvider';
import api from '@/lib/api';

vi.mock('@/lib/api', () => ({
  default: {
    getToken: vi.fn(),
    getMe: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    clearToken: vi.fn(),
  },
}));

function TestConsumer() {
  const { user, loading, login, register, logout, isAuthenticated } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? 'logged-in' : 'logged-out'}</span>
      <span data-testid="user-email">{user?.email || 'none'}</span>
      <span data-testid="loading-status">{loading ? 'loading' : 'ready'}</span>
      <button onClick={() => login('admin@complyarc.com', 'password123')}>Login</button>
      <button onClick={() => register('user@test.com', 'pass', 'Test User', 'Org')}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthProvider Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should restore session when token exists', async () => {
    vi.mocked(api.getToken).mockReturnValue('valid-jwt-token');
    vi.mocked(api.getMe).mockResolvedValue({
      id: 'u-1',
      email: 'admin@complyarc.com',
      full_name: 'Admin User',
      role: 'admin',
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-in');
      expect(screen.getByTestId('user-email')).toHaveTextContent('admin@complyarc.com');
    });
  });

  it('should handle login flow correctly', async () => {
    vi.mocked(api.getToken).mockReturnValue(null);
    vi.mocked(api.login).mockResolvedValue({
      token: 'jwt-123',
      user: { id: 'u-2', email: 'officer@complyarc.com', full_name: 'Officer', role: 'compliance_officer' },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-out');

    const loginBtn = screen.getByText('Login');
    fireEvent.click(loginBtn);

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith('admin@complyarc.com', 'password123');
      expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-in');
    });
  });

  it('should handle logout flow', async () => {
    vi.mocked(api.getToken).mockReturnValue('token');
    vi.mocked(api.getMe).mockResolvedValue({
      id: 'u-1',
      email: 'admin@complyarc.com',
      role: 'admin',
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-in');
    });

    const logoutBtn = screen.getByText('Logout');
    fireEvent.click(logoutBtn);

    expect(api.clearToken).toHaveBeenCalled();
    expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-out');
  });
});
