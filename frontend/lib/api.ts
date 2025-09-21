/**
 * ProtoThrive Frontend API Client
 * Connects to the Cloudflare Workers backend with JWT authentication
 *
 * Ref: CLAUDE.md Phase 2 - Frontend-Backend Integration
 */

import { useState } from 'react';

// API Configuration
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://backend-thermo-dev.ernijs-ansons.workers.dev',
  timeout: 10000, // 10 seconds
  retries: 3
};

// Types
export interface User {
  id: string;
  email: string;
  role: 'vibe_coder' | 'engineer' | 'admin' | 'exec';
  exp?: number;
  iat?: number;
}

export interface AuthTokens {
  demo: string;
  admin: string;
  test: string;
}

export interface Roadmap {
  id: string;
  user_id: string;
  json_graph: string | object;
  status: 'draft' | 'active' | 'completed' | 'archived';
  vibe_mode: boolean;
  thrive_score: number;
  created_at?: string;
  updated_at?: string;
}

export interface Snippet {
  id: string;
  category: string;
  code: string;
  ui_preview_url?: string;
  version: number;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

// API Error Classes
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class AuthError extends ApiError {
  constructor(message: string, data?: any) {
    super(message, 401, 'AUTH_ERROR', data);
    this.name = 'AuthError';
  }
}

// Storage utilities for JWT tokens
class TokenStorage {
  private readonly TOKEN_KEY = 'protothrive_jwt_token';

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_KEY);
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp && payload.exp < now;
    } catch {
      return true;
    }
  }
}

export const tokenStorage = new TokenStorage();

// HTTP Client with retry logic
class HttpClient {
  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || `HTTP ${response.status}`,
          response.status,
          errorData.code,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      // Retry on network errors
      if (retryCount < API_CONFIG.retries &&
          (error.name === 'AbortError' || error.name === 'TypeError')) {
        console.warn(`Request failed, retrying... (${retryCount + 1}/${API_CONFIG.retries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.makeRequest(url, options, retryCount + 1);
      }

      throw new ApiError(
        error.message || 'Network error',
        0,
        'NETWORK_ERROR',
        error
      );
    }
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    return this.makeRequest<T>(url, { method: 'GET', headers });
  }

  async post<T>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<T> {
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    return this.makeRequest<T>(url, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<T> {
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    return this.makeRequest<T>(url, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    return this.makeRequest<T>(url, { method: 'DELETE', headers });
  }
}

const httpClient = new HttpClient();

// Authenticated request helper
function getAuthHeaders(): Record<string, string> {
  const token = tokenStorage.getToken();
  if (!token) {
    throw new AuthError('No authentication token found');
  }

  if (tokenStorage.isTokenExpired(token)) {
    tokenStorage.removeToken();
    throw new AuthError('Authentication token has expired');
  }

  return {
    'Authorization': `Bearer ${token}`
  };
}

// API Client
export class ProtoThriveApi {
  // Health & Status
  static async getHealth(): Promise<{ status: string; connected: boolean; database?: any }> {
    return httpClient.get('/health');
  }

  static async getApiInfo(): Promise<ApiResponse> {
    return httpClient.get('/');
  }

  // Authentication
  static async getDevTokens(): Promise<{ tokens: AuthTokens; usage: any; note: string }> {
    return httpClient.get('/auth/dev-tokens');
  }

  static async validateToken(token?: string): Promise<{ valid: boolean; user?: User }> {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : getAuthHeaders();
    return httpClient.get('/auth/validate', headers);
  }

  static async getAuthInfo(): Promise<any> {
    return httpClient.get('/auth/info');
  }

  // Set authentication token
  static setAuthToken(token: string): void {
    tokenStorage.setToken(token);
  }

  // Clear authentication
  static logout(): void {
    tokenStorage.removeToken();
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    try {
      const result = await this.validateToken();
      return result.valid ? result.user || null : null;
    } catch (error) {
      if (error instanceof AuthError) {
        return null;
      }
      throw error;
    }
  }

  // Roadmaps API
  static async getRoadmaps(limit = 10, offset = 0): Promise<Roadmap[]> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    return httpClient.get(`/api/roadmaps?${params}`, getAuthHeaders());
  }

  static async getRoadmap(id: string): Promise<Roadmap> {
    return httpClient.get(`/api/roadmaps/${id}`, getAuthHeaders());
  }

  static async createRoadmap(roadmapData: Partial<Roadmap>): Promise<Roadmap> {
    return httpClient.post('/api/roadmaps', roadmapData, getAuthHeaders());
  }

  static async updateRoadmap(id: string, roadmapData: Partial<Roadmap>): Promise<Roadmap> {
    return httpClient.put(`/api/roadmaps/${id}`, roadmapData, getAuthHeaders());
  }

  static async deleteRoadmap(id: string): Promise<{ success: boolean }> {
    return httpClient.delete(`/api/roadmaps/${id}`, getAuthHeaders());
  }

  // Snippets API
  static async getSnippets(category?: string, limit = 50): Promise<Snippet[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (category) params.set('category', category);
    return httpClient.get(`/api/snippets?${params}`);
  }

  static async createSnippet(snippetData: Partial<Snippet>): Promise<Snippet> {
    return httpClient.post('/api/snippets', snippetData, getAuthHeaders());
  }
}

// React hook for API loading states
export function useApiState<T>(initialData?: T) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (apiCall: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall();
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData(initialData);
    setError(null);
    setLoading(false);
  };

  return { data, loading, error, execute, reset, setData };
}

// Export default API instance
export default ProtoThriveApi;