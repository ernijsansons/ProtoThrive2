import React, { useState } from 'react';
import { XMarkIcon, EnvelopeIcon, CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface EmailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: string;
}

const EmailCaptureModal: React.FC<EmailCaptureModalProps> = ({ isOpen, onClose, source = 'modal' }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Store in localStorage as fallback
      const waitlistEntry = {
        email,
        name,
        source,
        timestamp: new Date().toISOString()
      };

      const existingWaitlist = JSON.parse(localStorage.getItem('protothrive-waitlist') || '[]');
      existingWaitlist.push(waitlistEntry);
      localStorage.setItem('protothrive-waitlist', JSON.stringify(existingWaitlist));

      // TODO: Send to backend API when ready
      // const response = await fetch('/api/waitlist', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(waitlistEntry)
      // });

      setSubmitted(true);

      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setEmail('');
        setName('');
      }, 3000);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-scaleIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {!submitted ? (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Get Early Access
              </h2>
              <p className="text-gray-600">
                Join 1,200+ developers building 60% faster with AI
              </p>
            </div>

            {/* Benefits */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-2">🎁 Early Access Includes:</p>
              <ul className="space-y-1 text-sm text-blue-800">
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>14-day free trial (no credit card)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>50% discount for first 100 users</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Priority onboarding & support</span>
                </li>
              </ul>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="you@company.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Joining...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <EnvelopeIcon className="w-5 h-5" />
                    <span>Get Early Access</span>
                  </span>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                By signing up, you agree to our{' '}
                <a href="/terms" className="text-blue-600 hover:underline">Terms</a>
                {' '}and{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
              </p>
            </form>
          </>
        ) : (
          /* Success State */
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              You're on the list! 🎉
            </h3>
            <p className="text-gray-600 mb-4">
              We'll send you an invite soon. Check your email!
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              <CheckCircleIcon className="w-4 h-4" />
              <span>Early access reserved for <strong>{email}</strong></span>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default EmailCaptureModal;
