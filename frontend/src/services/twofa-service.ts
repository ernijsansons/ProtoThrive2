// Mock implementation for build - replace with actual speakeasy/qrcode when packages are installed
// import { generateSecret, verifyToken } from 'speakeasy';
// import QRCode from 'qrcode';

export class TwoFactorAuthService {
  static generateSecretKey(): string {
    // Mock implementation - generate a random base32-like string
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static async generateQRCode(secret: string, email: string): Promise<string> {
    // Mock implementation - return a placeholder data URL
    const otpauth = `otpauth://totp/ProtoThrive:${email}?secret=${secret}&issuer=ProtoThrive`;
    // Return a simple placeholder QR code data URL
    return `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="white"/><text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12">QR Code for: ${otpauth.substring(0, 50)}...</text></svg>`)}`;
  }

  static verifyToken(token: string, secret: string): boolean {
    // Mock implementation - for development, accept any 6-digit token
    return token.length === 6 && /^\d{6}$/.test(token);
  }
  
  static generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 8).toUpperCase());
    }
    return codes;
  }
}
