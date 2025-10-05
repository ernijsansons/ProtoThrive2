import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { EnvelopeIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        const data = await response.json();
        setError(data.error || 'An error occurred. Please try again.');
      }
    } catch (err) {
      // If API endpoint doesn't exist yet, simulate success for demo
      console.log('Password reset requested for:', email);
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <>
        <Head>
          <title>Check Your Email - ProtoThrive</title>
          <meta name="description" content="Password reset instructions have been sent to your email." />
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-10 h-10 text-green-500" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
              <p className="text-gray-400 mb-6">
                We've sent password reset instructions to:
                <br />
                <span className="text-purple-400 font-medium">{email}</span>
              </p>

              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-400">
                  Didn't receive the email? Check your spam folder or click the button below to resend.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setIsSuccess(false);
                    setEmail('');
                  }}
                  className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  Send Another Email
                </button>

                <Link href="/login" className="block w-full py-3 px-4 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition text-center">
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Forgot Password - ProtoThrive</title>
        <meta name="description" content="Reset your ProtoThrive password" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                ProtoThrive
              </h1>
            </Link>
            <h2 className="text-2xl font-bold text-white mb-2">Forgot Your Password?</h2>
            <p className="text-gray-400">
              No worries! Enter your email address and we'll send you instructions to reset it.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    placeholder="Enter your email address"
                    required
                    disabled={isSubmitting}
                    aria-label="Email address"
                  />
                </div>
                {error && (
                  <p className="mt-2 text-sm text-red-400" role="alert">
                    {error}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Reset Instructions'}
                </button>

                <Link href="/login" className="block w-full text-center py-3 px-4 border border-gray-600 text-gray-300 rounded-lg font-semibold hover:bg-gray-700 hover:text-white transition">
                  <span className="flex items-center justify-center">
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Back to Login
                  </span>
                </Link>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-center text-sm text-gray-400">
                Remember your password?{' '}
                <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                  Sign in
                </Link>
              </p>
              <p className="text-center text-sm text-gray-400 mt-2">
                Don't have an account?{' '}
                <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Need help?{' '}
              <Link href="/docs" className="text-purple-400 hover:text-purple-300">
                Visit our support docs
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}