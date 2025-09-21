import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheckIcon,
  KeyIcon,
  QrCodeIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';

interface TwoFactorSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (backupCodes: string[]) => void;
  userEmail: string;
}

interface TwoFactorVerifyProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (code: string) => Promise<boolean>;
  onUseBackupCode?: () => void;
  title?: string;
  description?: string;
}

// Mock QR code generation (in production, use a real QR library)
const generateMockQRCode = (secret: string, email: string): string => {
  // This would normally generate a real QR code
  // For demo purposes, we'll return a mock data URL
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 200;
  canvas.height = 200;

  if (ctx) {
    // Create a simple mock QR pattern
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = '#ffffff';

    // Mock QR pattern
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 20; j++) {
        if ((i + j) % 3 === 0) {
          ctx.fillRect(i * 10, j * 10, 8, 8);
        }
      }
    }

    // Add center square
    ctx.fillRect(85, 85, 30, 30);
  }

  return canvas.toDataURL();
};

const generateBackupCodes = (): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    codes.push(`${code.substring(0, 3)}-${code.substring(3)}`);
  }
  return codes;
};

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  isOpen,
  onClose,
  onComplete,
  userEmail
}) => {
  const [step, setStep] = useState(1);
  const [secret] = useState('JBSWY3DPEHPK3PXP'); // Mock secret
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [backupCodes] = useState(generateBackupCodes());
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQrCodeUrl(generateMockQRCode(secret, userEmail));
    }
  }, [isOpen, secret, userEmail]);

  const handleVerification = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // Mock verification - in production, verify with backend
      await new Promise(resolve => setTimeout(resolve, 1500));

      // For demo, accept any 6-digit code
      if (verificationCode.match(/^\d{6}$/)) {
        setStep(3); // Move to backup codes step
      } else {
        setError('Invalid code. Please try again.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleComplete = () => {
    onComplete(backupCodes);
    onClose();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Show brief success feedback
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const steps = [
    {
      title: 'Set up Two-Factor Authentication',
      description: 'Add an extra layer of security to your ProtoThrive account'
    },
    {
      title: 'Scan QR Code',
      description: 'Use your authenticator app to scan the QR code below'
    },
    {
      title: 'Verify Setup',
      description: 'Enter the 6-digit code from your authenticator app'
    },
    {
      title: 'Save Backup Codes',
      description: 'Store these codes safely - you\'ll need them if you lose your device'
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                <ShieldCheckIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{steps[step - 1]?.title}</h2>
                <p className="text-sm text-gray-600">{steps[step - 1]?.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="px-6 py-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Step {step} of {steps.length}</span>
              <span className="text-sm text-gray-500">{Math.round((step / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(step / steps.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-6"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <DevicePhoneMobileIcon className="w-8 h-8 text-blue-600" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Secure Your Account
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Two-factor authentication adds an extra layer of security by requiring both your password and a code from your phone.
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">You'll need:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• An authenticator app (Google Authenticator, Authy, etc.)</li>
                    <li>• Your smartphone or tablet</li>
                    <li>• A safe place to store backup codes</li>
                  </ul>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all duration-200"
                >
                  Get Started
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-4 inline-block">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code for 2FA setup"
                      className="w-48 h-48"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Or enter this code manually:
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type={showSecret ? "text" : "password"}
                        value={secret}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                      />
                      <button
                        onClick={() => setShowSecret(!showSecret)}
                        className="p-2 text-gray-500 hover:text-gray-700"
                      >
                        {showSecret ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(secret)}
                        className="p-2 text-gray-500 hover:text-gray-700"
                      >
                        <ClipboardDocumentIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-semibold mb-1">Keep this secure!</p>
                        <p>Don't share this code with anyone. It's used to generate your authentication codes.</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(3)}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all duration-200"
                  >
                    I've Added the Code
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <KeyIcon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Verify Your Setup
                  </h3>
                  <p className="text-gray-600">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setVerificationCode(value);
                      setError('');
                    }}
                    placeholder="000000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-wider focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    maxLength={6}
                  />
                  {error && (
                    <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
                  )}
                </div>

                <button
                  onClick={handleVerification}
                  disabled={verificationCode.length !== 6 || isVerifying}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </button>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Two-Factor Authentication Enabled!
                  </h3>
                  <p className="text-gray-600">
                    Save these backup codes in a secure location
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">Backup Codes</span>
                    <button
                      onClick={() => copyToClipboard(backupCodes.join('\n'))}
                      className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                    >
                      Copy All
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded px-3 py-2 font-mono text-sm text-center"
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                    <div className="text-sm text-red-800">
                      <p className="font-semibold mb-1">Important:</p>
                      <ul className="space-y-1">
                        <li>• Each backup code can only be used once</li>
                        <li>• Store them in a secure password manager</li>
                        <li>• Don't share them with anyone</li>
                        <li>• You can generate new codes anytime in settings</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleComplete}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all duration-200"
                >
                  Complete Setup
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const TwoFactorVerify: React.FC<TwoFactorVerifyProps> = ({
  isOpen,
  onClose,
  onVerify,
  onUseBackupCode,
  title = "Two-Factor Authentication",
  description = "Enter your 6-digit authentication code"
}) => {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [showBackupOption, setShowBackupOption] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digits

    const newCode = code.split('');
    newCode[index] = value;
    const updatedCode = newCode.join('');

    setCode(updatedCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (updatedCode.length === 6) {
      handleVerify(updatedCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (codeToVerify = code) => {
    if (codeToVerify.length !== 6) {
      setError('Please enter a complete 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const isValid = await onVerify(codeToVerify);
      if (!isValid) {
        setError('Invalid code. Please try again.');
        setCode('');
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      setCode('');
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-sm w-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <ShieldCheckIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <div>
              <div className="flex justify-center space-x-2 mb-4">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={code[index] || ''}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-xl font-mono border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    maxLength={1}
                  />
                ))}
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm text-center"
                >
                  {error}
                </motion.p>
              )}
            </div>

            {isVerifying && (
              <div className="text-center">
                <div className="inline-flex items-center text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Verifying...
                </div>
              </div>
            )}

            <div className="space-y-3">
              {!showBackupOption ? (
                <button
                  onClick={() => setShowBackupOption(true)}
                  className="w-full text-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                  Can't access your authenticator app?
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={onUseBackupCode}
                    className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Use Backup Code
                  </button>
                  <button
                    onClick={() => setShowBackupOption(false)}
                    className="w-full text-gray-500 hover:text-gray-600 text-sm"
                  >
                    Back to authenticator code
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default { TwoFactorSetup, TwoFactorVerify };