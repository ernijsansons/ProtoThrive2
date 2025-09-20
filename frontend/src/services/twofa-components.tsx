import React, { useState, useEffect } from 'react';
import { TwoFactorAuthService } from '../services/twofa-service';

interface TwoFactorSetupProps {
  onComplete: (secret: string, backupCodes: string[]) => void;
  onCancel: () => void;
}

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  onComplete,
  onCancel
}) => {
  const [secret, setSecret] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  
  useEffect(() => {
    const generateSecret = async () => {
      const newSecret = TwoFactorAuthService.generateSecretKey();
      setSecret(newSecret);
      
      const qrCodeUrl = await TwoFactorAuthService.generateQRCode(newSecret, 'user@example.com');
      setQrCode(qrCodeUrl);
    };
    
    generateSecret();
  }, []);
  
  const handleVerify = () => {
    if (TwoFactorAuthService.verifyToken(token, secret)) {
      const codes = TwoFactorAuthService.generateBackupCodes();
      setBackupCodes(codes);
      setStep('backup');
    } else {
      alert('Invalid token. Please try again.');
    }
  };
  
  const handleComplete = () => {
    onComplete(secret, backupCodes);
  };
  
  if (step === 'backup') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Backup Codes</h2>
        <p className="text-gray-600 mb-4">
          Save these backup codes in a secure location. You can use them to access your account if you lose your 2FA device.
        </p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {backupCodes.map((code, index) => (
            <div key={index} className="p-2 bg-gray-100 rounded text-center font-mono text-sm">
              {code}
            </div>
          ))}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleComplete}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Complete Setup
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Two-Factor Authentication Setup</h2>
      
      {step === 'setup' && (
        <div>
          <p className="text-gray-600 mb-4">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </p>
          <div className="text-center mb-4">
            <img src={qrCode} alt="QR Code" className="mx-auto" />
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Or manually enter this secret: <code className="bg-gray-100 px-1 rounded">{secret}</code>
          </p>
          <button
            onClick={() => setStep('verify')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Next: Verify Token
          </button>
        </div>
      )}
      
      {step === 'verify' && (
        <div>
          <p className="text-gray-600 mb-4">
            Enter the 6-digit code from your authenticator app
          </p>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="000000"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={6}
          />
          <div className="flex space-x-2 mt-4">
            <button
              onClick={handleVerify}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Verify
            </button>
            <button
              onClick={() => setStep('setup')}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        </div>
      )}
      
      <button
        onClick={onCancel}
        className="w-full mt-4 px-4 py-2 text-gray-600 hover:text-gray-800"
      >
        Cancel
      </button>
    </div>
  );
};

interface TwoFactorVerifyProps {
  onVerify: (token: string) => void;
  onUseBackupCode: (code: string) => void;
}

export const TwoFactorVerify: React.FC<TwoFactorVerifyProps> = ({
  onVerify,
  onUseBackupCode
}) => {
  const [token, setToken] = useState<string>('');
  const [backupCode, setBackupCode] = useState<string>('');
  const [useBackup, setUseBackup] = useState<boolean>(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (useBackup) {
      onUseBackupCode(backupCode);
    } else {
      onVerify(token);
    }
  };
  
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Two-Factor Authentication</h2>
      
      <form onSubmit={handleSubmit}>
        {!useBackup ? (
          <div>
            <p className="text-gray-600 mb-4">
              Enter the 6-digit code from your authenticator app
            </p>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="000000"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={6}
              required
            />
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-4">
              Enter one of your backup codes
            </p>
            <input
              type="text"
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value)}
              placeholder="BACKUP"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        )}
        
        <button
          type="submit"
          className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {useBackup ? 'Use Backup Code' : 'Verify'}
        </button>
      </form>
      
      <button
        onClick={() => setUseBackup(!useBackup)}
        className="w-full mt-2 px-4 py-2 text-blue-600 hover:text-blue-800"
      >
        {useBackup ? 'Use Authenticator App' : 'Use Backup Code'}
      </button>
    </div>
  );
};
