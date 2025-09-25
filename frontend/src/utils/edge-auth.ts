// Basic edge auth utilities
export const validateEnvironment = () => ({ ADMIN_EMAIL: 'admin@test.com', ADMIN_PASSWORD_HASH: 'test-hash' });
export const verifyPassword = (password: string, hash: string) => password === hash;
export const generateToken = (payload?: any) => 'mock-token';
export const checkRateLimit = (ip?: string) => true;
export const createSession = (payload?: any) => ({ id: payload?.id || 'mock-session' });