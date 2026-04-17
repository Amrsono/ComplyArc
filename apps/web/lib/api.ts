/**
 * ComplyArc — API Client
 * Centralized HTTP client for backend communication
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  token?: string;
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

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      let errorMessage = error.detail;
      if (Array.isArray(errorMessage)) {
        errorMessage = errorMessage.map((e: any) => `${e.loc?.[e.loc.length - 1] || e.loc}: ${e.msg}`).join(', ');
      }
      throw new Error(errorMessage || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ——— Auth ————————————————————————
  async login(email: string, password: string) {
    const data = await this.request<any>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    this.setToken(data.access_token);
    return data;
  }

  async register(email: string, password: string, fullName: string, organization?: string) {
    return this.request<any>('/auth/register', {
      method: 'POST',
      body: { email, password, full_name: fullName, organization },
    });
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  // ——— Screening ——————————————————
  async screenEntity(name: string, entityType: string = 'individual', options?: any) {
    return this.request<any>('/screen', {
      method: 'POST',
      body: { name, entity_type: entityType, ...options },
    });
  }

  async batchScreen(entities: any[]) {
    return this.request<any>('/screen/batch', {
      method: 'POST',
      body: { entities },
    });
  }

  // ——— Clients ————————————————————
  async listClients(params?: any) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/clients${query}`);
  }

  async getClient(id: string) {
    return this.request<any>(`/clients/${id}`);
  }

  async createClient(data: any) {
    return this.request<any>('/clients', { method: 'POST', body: data });
  }

  async updateClient(id: string, data: any) {
    return this.request<any>(`/clients/${id}`, { method: 'PATCH', body: data });
  }

  async activateClient(id: string) {
    return this.request<any>(`/clients/${id}/activate`, { method: 'POST' });
  }

  async getUBOs(clientId: string) {
    return this.request<any>(`/clients/${clientId}/ubos`);
  }

  async addUBO(clientId: string, data: any) {
    return this.request<any>(`/clients/${clientId}/ubos`, { method: 'POST', body: data });
  }

  // ——— Risk ————————————————————————
  async calculateRisk(clientId: string, overrides?: any) {
    return this.request<any>('/risk/calculate', {
      method: 'POST',
      body: { client_id: clientId, ...overrides },
    });
  }

  async getClientRisk(clientId: string) {
    return this.request<any>(`/risk/client/${clientId}`);
  }

  // ——— Cases ——————————————————————
  async listCases(params?: any) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/cases${query}`);
  }

  async getCase(id: string) {
    return this.request<any>(`/cases/${id}`);
  }

  async createCase(data: any) {
    return this.request<any>('/cases', { method: 'POST', body: data });
  }

  async updateCase(id: string, data: any) {
    return this.request<any>(`/cases/${id}`, { method: 'PATCH', body: data });
  }

  async addCaseNote(caseId: string, content: string, noteType: string = 'comment') {
    return this.request<any>(`/cases/${caseId}/notes`, {
      method: 'POST',
      body: { content, note_type: noteType },
    });
  }

  async getCaseNotes(caseId: string) {
    return this.request<any>(`/cases/${caseId}/notes`);
  }

  // ——— Adverse Media ————————————————
  async searchMedia(entityName: string, clientId?: string) {
    return this.request<any>('/media/search', {
      method: 'POST',
      body: { entity_name: entityName, client_id: clientId },
    });
  }

  // ——— Alerts ————————————————————————
  async listAlerts(params?: any) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/alerts${query}`);
  }

  async getAlertStats() {
    return this.request<any>('/alerts/stats');
  }

  async updateAlert(id: string, data: any) {
    return this.request<any>(`/alerts/${id}`, { method: 'PATCH', body: data });
  }

  async markAllAlertsRead() {
    return this.request<any>('/alerts/mark-all-read', { method: 'POST' });
  }

  // ——— Monitoring ——————————————————
  async listMonitoring(params?: any) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/monitoring${query}`);
  }

  async registerMonitoring(data: any) {
    return this.request<any>('/monitoring', { method: 'POST', body: data });
  }

  async toggleMonitoring(id: string) {
    return this.request<any>(`/monitoring/${id}/toggle`, { method: 'POST' });
  }

  async deleteMonitoring(id: string) {
    return this.request<any>(`/monitoring/${id}`, { method: 'DELETE' });
  }

  // ——— Reports ————————————————————
  async listReports(params?: any) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/reports${query}`);
  }

  async generateReport(data: any) {
    return this.request<any>('/reports/generate', { method: 'POST', body: data });
  }

  async downloadReport(id: string) {
    const authToken = this.getToken();
    const response = await fetch(`${this.baseUrl}/reports/${id}/download`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ——— Dashboard ————————————————————
  async getDashboardStats() {
    return this.request<any>('/dashboard/stats');
  }

  async getRiskAnalytics() {
    return this.request<any>('/dashboard/risk-analytics');
  }

  async getAuditLog(params?: any) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/dashboard/audit-log${query}`);
  }

  // ——— Admin ——————————————————————
  async ingestSanctions() {
    return this.request<any>('/admin/ingest-sanctions', { method: 'POST' });
  }
}

export const api = new ApiClient(API_URL);
export default api;
