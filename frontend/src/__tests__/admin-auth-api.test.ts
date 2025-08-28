import { mockApiResponse } from '../utils/test-utils';

// Mock the admin auth API
describe('Admin Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates environment variables', () => {
    const requiredEnvVars = [
      'JWT_SECRET',
      'ADMIN_EMAIL',
      'ADMIN_PASSWORD_HASH',
      'ENCRYPTION_KEY'
    ];
    
    requiredEnvVars.forEach(varName => {
      expect(process.env[varName]).toBeDefined();
    });
  });

  it('handles missing credentials', async () => {
    const response = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('required');
  });

  it('handles invalid method', async () => {
    const response = await fetch('/api/admin-auth', {
      method: 'GET'
    });
    
    expect(response.status).toBe(405);
    const data = await response.json();
    expect(data.error).toContain('Method not allowed');
  });
});
