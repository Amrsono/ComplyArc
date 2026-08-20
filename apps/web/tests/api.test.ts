import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { api } from '../lib/api';

describe('ApiClient Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    api.clearToken();
    vi.restoreAllMocks();
  });

  it('should manage JWT tokens in memory and localStorage', () => {
    expect(api.getToken()).toBeNull();

    api.setToken('sample-jwt-token-xyz');
    expect(api.getToken()).toBe('sample-jwt-token-xyz');
    expect(localStorage.getItem('complyarc_token')).toBe('sample-jwt-token-xyz');

    api.clearToken();
    expect(api.getToken()).toBeNull();
    expect(localStorage.getItem('complyarc_token')).toBeNull();
  });

  it('should successfully make a GET request with Authorization headers', async () => {
    api.setToken('mock-auth-token');

    const mockResponse = { id: 'u1', email: 'test@complyarc.com', role: 'admin' };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });
    global.fetch = fetchMock;

    const data = await api.getMe();
    expect(data).toEqual(mockResponse);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[0]).toContain('/auth/me');
    expect(callArgs[1].headers['Authorization']).toBe('Bearer mock-auth-token');
    expect(callArgs[1].headers['Content-Type']).toBe('application/json');
  });

  it('should format POST body correctly for screening', async () => {
    const mockScreenResult = {
      screening_id: 'scr-123',
      total_matches: 2,
      overall_risk: 'high',
      matches: [],
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockScreenResult,
    });
    global.fetch = fetchMock;

    const res = await api.screenEntity('Target Entity', 'corporate', { nationality: 'RU' });
    expect(res).toEqual(mockScreenResult);

    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[0]).toContain('/screen');
    expect(callArgs[1].method).toBe('POST');
    expect(JSON.parse(callArgs[1].body)).toEqual({
      name: 'Target Entity',
      entity_type: 'corporate',
      nationality: 'RU',
    });
  });

  it('should throw descriptive error on 401/400 API failure', async () => {
    const errorResponse = { detail: 'Invalid email or password' };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => errorResponse,
    });
    global.fetch = fetchMock;

    await expect(api.login('bad@user.com', 'wrongpass')).rejects.toThrow('Invalid email or password');
  });

  it('should correctly format query parameters in listClients', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], total: 0 }),
    });
    global.fetch = fetchMock;

    await api.listClients({ page: '1', search: 'Acme', risk_level: 'high' });
    const callUrl = fetchMock.mock.calls[0][0];
    expect(callUrl).toContain('page=1');
    expect(callUrl).toContain('search=Acme');
    expect(callUrl).toContain('risk_level=high');
  });
});
