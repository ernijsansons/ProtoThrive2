import { generateSecret, verifyToken } from 'speakeasy';
import QRCode from 'qrcode';

export class TwoFactorAuthService {
  static generateSecretKey(): string {
    return generateSecret({
      name: 'ProtoThrive',
      issuer: 'ProtoThrive',
      length: 32
    }).base32;
  }
  
  static async generateQRCode(secret: string, email: string): Promise<string> {
    const otpauth = `otpauth://totp/ProtoThrive:${email}?secret=${secret}&issuer=ProtoThrive`;
    return QRCode.toDataURL(otpauth);
  }
  
  static verifyToken(token: string, secret: string): boolean {
    return verifyToken({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps tolerance
    });
  }
  
  static generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 8).toUpperCase());
    }
    return codes;
  }
}
