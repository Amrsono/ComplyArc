/**
 * ComplyArc — API Client
 * Centralized HTTP client for backend communication with structured logging and typing
 */

import { logger } from './logger';
import type {
  User,
  Client,
  UBO,
  ScreeningResult,
  RiskBreakdown,
  ComplianceCase,
  CaseNote,
  Alert,
  AuditLogEntry,
  SystemSetting,
} from './types';

let API_URL = '/api/v1';

// Only use absolute URL in development or if explicitly required
if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
}

if (typeof window !== 'undefined') {
  logger.info('ApiClient', `Initialized with Base URL: ${API_URL}`);
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  page_size?: number;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('complyarc_token', token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('complyarc_token');
    }
    return null;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('complyarc_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, token } = options;
    const authToken = token || this.getToken();

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...headers,
      },
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const fullUrl = `${this.baseUrl}${endpoint}`;
    logger.debug('ApiClient', `${method} ${fullUrl}`);

    const response = await fetch(fullUrl, config);
    if (!response.ok) {
      let errorDetail = 'Request failed';
      let errorType = 'UnknownError';

      try {
        const error = await response.json();
        errorDetail = error.detail || error.message || 'Request failed';
        errorType = error.type || 'ServerError';

        if (Array.isArray(errorDetail)) {
          errorDetail = errorDetail
            .map((e: { loc?: string[]; msg?: string }) => `${e.loc?.[e.loc.length - 1] || 'field'}: ${e.msg || 'invalid'}`)
            .join(', ');
        }
      } catch {
        errorDetail = await response.text().catch(() => `HTTP ${response.status}`);
      }

      logger.error('ApiClient', `${method} ${endpoint} failed (${response.status}): ${errorDetail}`, {
        status: response.status,
        type: errorType,
      });

      const err = new Error(errorDetail);
      (err as unknown as { status: number; type: string }).status = response.status;
      (err as unknown as { status: number; type: string }).type = errorType;
      throw err;
    }

    return response.json();
  }

  // ——— Auth ————————————————————————
  async login(email: string, password: string): Promise<{ access_token: string; token_type: string; user: User }> {
    const data = await this.request<{ access_token: string; token_type: string; user: User }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    this.setToken(data.access_token);
    return data;
  }

  async register(email: string, password: string, fullName: string, organization?: string): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: { email, password, full_name: fullName, organization },
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // ——— Screening ——————————————————
  async screenEntity(
    name: string,
    entityType: string = 'individual',
    options?: Record<string, unknown>
  ): Promise<ScreeningResult> {
    return this.request<ScreeningResult>('/screen', {
      method: 'POST',
      body: { name, entity_type: entityType, ...options },
    });
  }

  async batchScreen(entities: Array<{ name: string; entity_type?: string }>): Promise<ScreeningResult[]> {
    return this.request<ScreeningResult[]>('/screen/batch', {
      method: 'POST',
      body: { entities },
    });
  }

  // ——— Clients ————————————————————
  async listClients(params?: Record<string, string>): Promise<PaginatedResponse<Client>> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<PaginatedResponse<Client>>(`/clients${query}`);
  }

  async getClient(id: string): Promise<Client> {
    return this.request<Client>(`/clients/${id}`);
  }

  async createClient(data: Partial<Client>): Promise<Client> {
    return this.request<Client>('/clients', { method: 'POST', body: data });
  }

  async updateClient(id: string, data: Partial<Client>): Promise<Client> {
    return this.request<Client>(`/clients/${id}`, { method: 'PATCH', body: data });
  }

  async activateClient(id: string): Promise<Client> {
    return this.request<Client>(`/clients/${id}/activate`, { method: 'POST' });
  }

  async getUBOs(clientId: string): Promise<UBO[]> {
    return this.request<UBO[]>(`/clients/${clientId}/ubos`);
  }

  async addUBO(clientId: string, data: Partial<UBO>): Promise<UBO> {
    return this.request<UBO>(`/clients/${clientId}/ubos`, { method: 'POST', body: data });
  }

  // ——— Risk ————————————————————————
  async calculateRisk(clientId: string, overrides?: Record<string, unknown>): Promise<RiskBreakdown> {
    return this.request<RiskBreakdown>('/risk/calculate', {
      method: 'POST',
      body: { client_id: clientId, ...overrides },
    });
  }

  async getClientRisk(clientId: string): Promise<RiskBreakdown> {
    return this.request<RiskBreakdown>(`/risk/client/${clientId}`);
  }

  // ——— Cases ——————————————————————
  async listCases(params?: Record<string, string>): Promise<PaginatedResponse<ComplianceCase>> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<PaginatedResponse<ComplianceCase>>(`/cases${query}`);
  }

  async getCase(id: string): Promise<ComplianceCase> {
    return this.request<ComplianceCase>(`/cases/${id}`);
  }

  async createCase(data: Partial<ComplianceCase>): Promise<ComplianceCase> {
    return this.request<ComplianceCase>('/cases', { method: 'POST', body: data });
  }

  async updateCase(id: string, data: Partial<ComplianceCase>): Promise<ComplianceCase> {
    return this.request<ComplianceCase>(`/cases/${id}`, { method: 'PATCH', body: data });
  }

  async addCaseNote(caseId: string, content: string, noteType: string = 'comment'): Promise<CaseNote> {
    return this.request<CaseNote>(`/cases/${caseId}/notes`, {
      method: 'POST',
      body: { content, note_type: noteType },
    });
  }

  async getCaseNotes(caseId: string): Promise<CaseNote[]> {
    return this.request<CaseNote[]>(`/cases/${caseId}/notes`);
  }

  // ——— Adverse Media ————————————————
  async searchMedia(entityName: string, clientId?: string): Promise<{ hits: unknown[]; total: number }> {
    return this.request<{ hits: unknown[]; total: number }>('/media/search', {
      method: 'POST',
      body: { entity_name: entityName, client_id: clientId },
    });
  }

  // ——— Alerts ————————————————————————
  async listAlerts(params?: Record<string, string>): Promise<PaginatedResponse<Alert>> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<PaginatedResponse<Alert>>(`/alerts${query}`);
  }

  async getAlertStats(): Promise<{ unread: number; critical: number; total: number }> {
    return this.request<{ unread: number; critical: number; total: number }>('/alerts/stats');
  }

  async updateAlert(id: string, data: Partial<Alert>): Promise<Alert> {
    return this.request<Alert>(`/alerts/${id}`, { method: 'PATCH', body: data });
  }

  async markAllAlertsRead(): Promise<{ success: boolean; marked_count: number }> {
    return this.request<{ success: boolean; marked_count: number }>('/alerts/mark-all-read', { method: 'POST' });
  }

  // ——— Monitoring ——————————————————
  async listMonitoring(params?: Record<string, string>): Promise<PaginatedResponse<unknown>> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<PaginatedResponse<unknown>>(`/monitoring${query}`);
  }

  async registerMonitoring(data: Record<string, unknown>): Promise<unknown> {
    return this.request<unknown>('/monitoring', { method: 'POST', body: data });
  }

  async toggleMonitoring(id: string): Promise<{ success: boolean; status: string }> {
    return this.request<{ success: boolean; status: string }>(`/monitoring/${id}/toggle`, { method: 'POST' });
  }

  async deleteMonitoring(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/monitoring/${id}`, { method: 'DELETE' });
  }

  // ——— Reports ————————————————————
  async listReports(params?: Record<string, string>): Promise<PaginatedResponse<unknown>> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<PaginatedResponse<unknown>>(`/reports${query}`);
  }

  async generateReport(data: Record<string, unknown>): Promise<unknown> {
    return this.request<unknown>('/reports/generate', { method: 'POST', body: data });
  }

  async downloadReport(id: string): Promise<void> {
    const authToken = this.getToken();
    const response = await fetch(`${this.baseUrl}/reports/${id}/download`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ——— Dashboard ————————————————————
  async getDashboardStats(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/dashboard/stats');
  }

  async getRiskAnalytics(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/dashboard/risk-analytics');
  }

  async getAuditLog(params?: Record<string, string>): Promise<PaginatedResponse<AuditLogEntry>> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<PaginatedResponse<AuditLogEntry>>(`/dashboard/audit-log${query}`);
  }

  // ——— Admin ——————————————————————
  async ingestSanctions(): Promise<{ success: boolean; total_records: number }> {
    return this.request<{ success: boolean; total_records: number }>('/admin/ingest-sanctions', { method: 'POST' });
  }

  // ——— Settings —————————————————————
  async getSystemSettings(): Promise<SystemSetting[]> {
    return this.request<SystemSetting[]>('/settings');
  }

  async updateSystemSetting(key: string, value: string): Promise<SystemSetting> {
    return this.request<SystemSetting>(`/settings/${key}`, { method: 'PUT', body: { value } });
  }
}

export const api = new ApiClient(API_URL);
export default api;
