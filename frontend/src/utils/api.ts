/**
 * API Configuration for ProtoThrive Frontend
 * Connects to production backend at backend-thermo.ernijs-ansons.workers.dev
 */

// Production backend URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-thermo.ernijs-ansons.workers.dev';

/**
 * API Client with automatic token management
 */
export class APIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Get authorization token from localStorage
   */
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      const authData = localStorage.getItem('protothrive-auth');
      if (!authData) return null;

      const parsed = JSON.parse(authData);
      return parsed?.state?.tokens?.accessToken || null;
    } catch {
      return null;
    }
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Public endpoints
  async register(data: { name: string; email: string; password: string }) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getHealth() {
    return this.request('/health');
  }

  async getStatus() {
    return this.request('/api/status');
  }

  // Protected endpoints
  async getRoadmaps(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/api/roadmaps${query}`);
  }

  async getSnippets(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/api/snippets${query}`);
  }

  async getUserProfile() {
    return this.request('/api/user/profile');
  }

  async refreshToken(refreshToken: string) {
    return this.request('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }
}

// Default API client instance
export const api = new APIClient();

// Export helper functions
export const apiHelpers = {
  /**
   * Test backend connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Get backend version
   */
  async getVersion(): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/`);
      const data = await response.json();
      return data.version || 'unknown';
    } catch {
      return 'unknown';
    }
  },
};
