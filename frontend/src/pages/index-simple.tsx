import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const LandingPageSimple = () => {
  const [email, setEmail] = useState('');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert(`Thanks! We'll notify you when ProtoThrive launches. (Demo: ${email})`);
      setEmail('');
    }
  };

  return (
    <>
      <Head>
        <title>ProtoThrive - See Your Code. Ship 60% Faster.</title>
        <meta name="description" content="AI agents transform visual roadmaps into production-ready code. Build faster with intelligent automation." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Beta Notice Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2 text-center">
          <span className="text-amber-900 text-sm font-medium">
            ⚠️ Beta Software: Features and pricing subject to change.{' '}
            <Link href="/beta-terms" className="underline hover:text-amber-700 transition-colors">
              Learn more
            </Link>
          </span>
        </div>
      </div>

      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-10 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900">ProtoThrive</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">BETA</span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-8">
                <Link href="#features" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                  Features
                </Link>
                <Link href="#how-it-works" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                  How It Works
                </Link>
                <Link href="/pricing" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                  Pricing
                </Link>
                <Link href="/login" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Start Free Trial
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <button className="md:hidden p-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/50 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main>
          {/* Hero Section */}
          <section className="pt-20 pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
            <div className="max-w-7xl mx-auto">
              <div className="text-center max-w-4xl mx-auto mb-16">
                {/* Hero Headline */}
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
                  See Your Code.{' '}
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Ship 60% Faster.
                  </span>
                </h1>

                {/* Hero Subheadline */}
                <p className="text-xl sm:text-2xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto">
                  AI agents transform visual roadmaps into production-ready code.
                  <br className="hidden sm:block" />
                  Drag nodes, watch magic happen.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                  <Link
                    href="/register"
                    className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-bold rounded-xl shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    Start Building Free
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  <Link
                    href="/demo"
                    className="group w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 text-lg font-bold rounded-xl border-2 border-gray-300 hover:border-gray-400 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-6V7a3 3 0 00-3-3H6a3 3 0 00-3 3v1.5" />
                    </svg>
                    Try Interactive Demo
                  </Link>
                </div>

                {/* Trust Signals */}
                <p className="text-sm text-gray-500 flex items-center justify-center gap-2 flex-wrap">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  No credit card required
                  <span className="text-gray-300">•</span>
                  14-day free trial
                  <span className="text-gray-300">•</span>
                  Cancel anytime
                </p>
              </div>

              {/* Hero Visual */}
              <div className="max-w-6xl mx-auto">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-8">
                  <div className="aspect-video bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 font-semibold">Interactive Demo Coming Soon</p>
                      <p className="text-gray-500 text-sm mt-2">Visual Roadmap → AI Processing → Production Code</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Social Proof Bar */}
          <section className="py-12 bg-gray-50 border-y border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">275+</div>
                  <div className="text-gray-600 text-sm font-medium">Edge Locations</div>
                  <div className="text-xs text-gray-500 mt-1">Powered by Cloudflare</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">99.99%</div>
                  <div className="text-gray-600 text-sm font-medium">Uptime SLA</div>
                  <div className="text-xs text-gray-500 mt-1">Enterprise-grade reliability</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">&lt;10ms</div>
                  <div className="text-gray-600 text-sm font-medium">Global Latency</div>
                  <div className="text-xs text-gray-500 mt-1">Lightning fast worldwide</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">14</div>
                  <div className="text-gray-600 text-sm font-medium">AI Agents</div>
                  <div className="text-xs text-gray-500 mt-1">Working in parallel</div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
                  Everything you need to ship faster
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  From visual planning to production deployment, all in one platform
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Feature 1: Visual Roadmaps */}
                <div className="group p-8 bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-2xl transition-all hover:-translate-y-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Visual Roadmaps</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Drag nodes, connect dependencies, see your project structure at a glance.
                    2D and 3D views with React Flow and Spline.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Drag-and-drop node editor</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Real-time collaboration</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Template library</span>
                    </li>
                  </ul>
                </div>

                {/* Feature 2: AI Agents */}
                <div className="group p-8 bg-white rounded-2xl border-2 border-gray-200 hover:border-purple-500 hover:shadow-2xl transition-all hover:-translate-y-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">14 AI Agents</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Specialized agents for planning, coding, testing, security, and deployment.
                    Working in parallel to accelerate every phase.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Code generation & review</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Automated testing (98% coverage)</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Security auditing & deployment</span>
                    </li>
                  </ul>
                </div>

                {/* Feature 3: Thrive Score */}
                <div className="group p-8 bg-white rounded-2xl border-2 border-gray-200 hover:border-green-500 hover:shadow-2xl transition-all hover:-translate-y-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Thrive Score™</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Real-time project health metric combining completion, quality, and velocity.
                    Know exactly where you stand at all times.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Dynamic calculation</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Predictive analytics</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Actionable insights</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
                  From idea to production in 3 steps
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Designed for speed, built for scale
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                    1
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Create Visual Roadmap</h3>
                  <p className="text-gray-600">
                    Drag nodes, connect dependencies. Use templates or start from scratch.
                    Your visual blueprint is ready in minutes.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                    2
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">AI Agents Get to Work</h3>
                  <p className="text-gray-600">
                    14 specialized agents analyze, plan, code, test, and secure.
                    Watch progress in real-time as they work in parallel.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                    3
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Deploy to Production</h3>
                  <p className="text-gray-600">
                    One-click deployment to Cloudflare's global edge network.
                    Your app is live in 275+ locations worldwide.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-600">
            <div className="max-w-4xl mx-auto text-center">
              <svg className="w-16 h-16 text-white mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
                Ready to ship 60% faster?
              </h2>
              <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                Join developers building the future with AI-powered visual development
              </p>
              <Link
                href="/register"
                className="inline-block px-12 py-5 bg-white hover:bg-gray-50 text-gray-900 text-xl font-bold rounded-xl shadow-2xl hover:shadow-white/50 transition-all transform hover:scale-105"
              >
                Start Free Trial →
              </Link>
              <p className="text-blue-100 mt-6 text-sm">
                No credit card required • Cancel anytime
              </p>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              <div>
                <h3 className="text-white font-semibold mb-4">Product</h3>
                <ul className="space-y-3">
                  <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                  <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                  <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Company</h3>
                <ul className="space-y-3">
                  <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                  <li><a href="https://github.com" className="hover:text-white transition-colors">GitHub</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Legal</h3>
                <ul className="space-y-3">
                  <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                  <li><Link href="/beta-terms" className="hover:text-white transition-colors">Beta Terms</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Trust</h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>SOC 2 Type II Ready</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>99.99% Uptime SLA</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-white font-bold">ProtoThrive</span>
              </div>
              <div className="text-sm">
                © 2025 ProtoThrive. All rights reserved.
              </div>
              <div className="text-sm">
                Powered by <span className="text-orange-500 font-semibold">Cloudflare</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPageSimple;

