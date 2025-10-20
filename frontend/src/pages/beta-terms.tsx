import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { SparklesIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const BetaTerms = () => {
  return (
    <>
      <Head>
        <title>Beta Terms & Conditions - ProtoThrive</title>
        <meta name="description" content="ProtoThrive beta software terms and conditions" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Header */}
        <header className="w-full py-6 px-4 sm:px-6 lg:px-8 border-b border-gray-200 bg-white">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/" className="inline-flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <SparklesIcon className="h-5 h-5 text-white" />
              </div>
              <span className="text-gray-900 font-bold text-xl">ProtoThrive</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeftIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Home</span>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 mb-8 rounded-r-lg">
            <h1 className="text-2xl font-bold text-amber-900 mb-2">Beta Software Notice</h1>
            <p className="text-amber-800">This product is currently in beta testing. Features and pricing are subject to change.</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 prose max-w-none">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Beta Testing Agreement</h2>

            <p className="text-gray-700 mb-6">Last updated: October 5, 2025</p>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Beta Status</h3>
              <p className="text-gray-700">
                ProtoThrive is currently in beta testing. This means the software is still under development and may contain bugs, errors, or incomplete features. By using this beta version, you acknowledge and accept these limitations.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">2. No Warranty</h3>
              <p className="text-gray-700">
                THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. We make no guarantees about uptime, data retention, or feature availability during the beta period.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Changes to Features</h3>
              <p className="text-gray-700">
                We reserve the right to add, modify, or remove features at any time without prior notice. Your feedback during beta testing will help shape the final product.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Data & Privacy</h3>
              <p className="text-gray-700">
                While we implement industry-standard security measures, beta software may have undiscovered vulnerabilities. Do not store production-critical or sensitive data during beta testing.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Pricing Changes</h3>
              <p className="text-gray-700">
                Beta users may receive special early-access pricing. However, prices are subject to change upon official launch. We will notify beta users of any pricing changes with reasonable notice.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Feedback & Bug Reports</h3>
              <p className="text-gray-700">
                We encourage you to report bugs and provide feedback. By submitting feedback, you grant us the right to use it to improve the product without compensation.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Termination</h3>
              <p className="text-gray-700">
                We reserve the right to terminate beta access at any time. Similarly, you may stop using the beta software at any time without penalty.
              </p>
            </section>

            <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-2">Questions?</h4>
              <p className="text-gray-700 text-sm">
                If you have questions about these beta terms, please contact us at{' '}
                <a href="mailto:beta@protothrive.com" className="text-blue-600 hover:text-blue-700 font-medium">
                  beta@protothrive.com
                </a>
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link href="/register" className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
              I Understand - Start Free Trial
            </Link>
          </div>
        </main>
      </div>
    </>
  );
};

export default BetaTerms;
