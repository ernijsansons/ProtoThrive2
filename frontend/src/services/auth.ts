/**
 * Authentication Service for ProtoThrive Frontend
 * Handles JWT tokens, user authentication, and API communication
 */

interface User {
  id: string;
  email: string;
  role: 'vibe_coder' | 'engineer' | 'exec';
}

interface AuthResponse {
  token: string;
  user: User;
  expires_in: number;
}

interface LoginCredentials {
  email: string;
  password: string;
}

class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private user: User | null = null;
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
    this.loadFromStorage();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const token = localStorage.getItem('protothrive_token');
      const userStr = localStorage.getItem('protothrive_user');

      if (token && userStr) {
        this.token = token;
        this.user = JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Failed to load auth from storage:', error);
      this.clearStorage();
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      if (this.token && this.user) {
        localStorage.setItem('protothrive_token', this.token);
        localStorage.setItem('protothrive_user', JSON.stringify(this.user));
      } else {
        this.clearStorage();
      }
    } catch (error) {
      console.error('Failed to save auth to storage:', error);
    }
  }

  private clearStorage(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('protothrive_token');
    localStorage.removeItem('protothrive_user');
  }

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await fetch(`${this.apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data: AuthResponse = await response.json();

      this.token = data.token;
      this.user = data.user;
      this.saveToStorage();

      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async loginWithDevelopmentToken(): Promise<User> {
    // For development/testing - use mock token
    this.token = 'mock_token_for_development';
    this.user = {
      id: 'dev_user_' + Math.random().toString(36).substr(2, 9),
      email: 'developer@protothrive.com',
      role: 'vibe_coder'
    };

    this.saveToStorage();
    return this.user;
  }

  async validateToken(): Promise<boolean> {
    if (!this.token) return false;

    try {
      const response = await fetch(`${this.apiUrl}/api/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid && data.user) {
          this.user = data.user;
          this.saveToStorage();
          return true;
        }
      }

      // Token invalid, clear auth
      this.logout();
      return false;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  logout(): void {
    this.token = null;
    this.user = null;
    this.clearStorage();
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!(this.token && this.user);
  }

  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If unauthorized, clear auth and redirect to login
    if (response.status === 401) {
      this.logout();
      // You might want to redirect to login page here
      // window.location.href = '/login';
    }

    return response;
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
export default authService;