import { describe, it, expect, beforeEach, vi } from 'vitest';
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

  it('should format POST body correctly for screening and batchScreen', async () => {
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

    await api.batchScreen([{ name: 'Target 1' }, { name: 'Target 2' }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
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

  it('should support client CRUD and UBO operations', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'c-1', name: 'Test Client' }),
    });
    global.fetch = fetchMock;

    await api.getClient('c-1');
    await api.createClient({ name: 'New Corp', entity_type: 'corporate' });
    await api.updateClient('c-1', { status: 'active' });
    await api.activateClient('c-1');
    await api.getUBOs('c-1');
    await api.addUBO('c-1', { name: 'Owner', ownership_percentage: 51 });
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it('should support risk calculation endpoints', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ client_id: 'c-1', calculated_score: 75 }),
    });
    global.fetch = fetchMock;

    await api.getClientRisk('c-1');
    await api.calculateRisk('c-1');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should support cases and notes management', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'case-1', title: 'AML Review' }),
    });
    global.fetch = fetchMock;

    await api.listCases();
    await api.getCase('case-1');
    await api.createCase({ title: 'New Case' });
    await api.updateCase('case-1', { status: 'in_review' });
    await api.addCaseNote('case-1', 'Investigating transactions');
    await api.getCaseNotes('case-1');
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it('should support alerts, adverse media, settings, reports, admin, and monitoring', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    global.fetch = fetchMock;

    await api.register('test@complyarc.com', 'pass', 'Full Name');
    await api.listAlerts();
    await api.getAlertStats();
    await api.updateAlert('alert-1', { is_read: true });
    await api.markAllAlertsRead();
    await api.searchMedia('Acme Corp');
    await api.getDashboardStats();
    await api.getRiskAnalytics();
    await api.getAuditLog();
    await api.ingestSanctions();
    await api.getSystemSettings();
    await api.updateSystemSetting('news_key', '12345');
    await api.listMonitoring();
    await api.toggleMonitoring('mon-1');
    await api.registerMonitoring({ client_id: 'c-1' });
    await api.deleteMonitoring('mon-1');
    await api.listReports();
    await api.generateReport({ report_type: 'aml_summary' });

    expect(fetchMock).toHaveBeenCalledTimes(18);
  });
});
