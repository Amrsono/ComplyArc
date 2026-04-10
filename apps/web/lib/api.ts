/**
 * ComplyArc â€” API Client
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
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // â”€â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ Screening â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ Clients â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ Risk â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async calculateRisk(clientId: string, overrides?: any) {
    return this.request<any>('/risk/calculate', {
      method: 'POST',
      body: { client_id: clientId, ...overrides },
    });
  }

  async getClientRisk(clientId: string) {
    return this.request<any>(`/risk/client/${clientId}`);
  }

  // â”€â”€â”€ Cases â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ Adverse Media â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async searchMedia(entityName: string, clientId?: string) {
    return this.request<any>('/media/search', {
      method: 'POST',
      body: { entity_name: entityName, client_id: clientId },
    });
  }

  // â”€â”€â”€ Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async getDashboardStats() {
    return this.request<any>('/dashboard/stats');
  }

  async getAuditLog(params?: any) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/dashboard/audit-log${query}`);
  }

  // â”€â”€â”€ Admin â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async ingestSanctions() {
    return this.request<any>('/admin/ingest-sanctions', { method: 'POST' });
  }
}

export const api = new ApiClient(API_URL);
export default api;
