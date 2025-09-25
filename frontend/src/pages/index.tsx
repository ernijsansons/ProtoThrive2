/**
 * ProtoThrive Landing Page - Optimized for Performance & Accessibility
 * WCAG 2.1 AA Compliant with Enhanced UX
 */

import React, { Suspense, lazy } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Target, BarChart3, CheckCircle } from 'lucide-react';

// Lazy load heavy components
const LandingFooter = lazy(() => import('../components/LandingFooter'));

// Animation variants for Framer Motion
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const LandingPage = () => {
  return (
    <>
      <Head>
        <title>ProtoThrive - AI-Powered Project Management (Beta)</title>
        <meta name="description" content="Transform your project management with AI-powered roadmaps and visual workflows. Beta software for innovative teams." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="ProtoThrive - AI-Powered Project Management" />
        <meta property="og:description" content="Transform your project management with AI-powered roadmaps and visual workflows." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://protothrive.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </Head>

      <div className="min-h-screen bg-gradient-dark text-text-primary font-elite">
        {/* Skip to main content for accessibility */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white p-2 rounded-md z-50">
          Skip to main content
        </a>

        {/* Beta Notice - Legal Compliance */}
        <div 
          role="alert"
          aria-live="polite"
          className="bg-blue-500/10 border border-blue-500/30 p-4 text-center text-sm"
        >
          <strong className="font-semibold">🚧 Beta Software Notice:</strong> ProtoThrive is in beta. Features, pricing, and availability subject to change.
        </div>

        {/* Header */}
        <header className="px-4 py-4 md:px-8 border-b border-white/10">
          <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
            <Link 
              href="/"
              className="text-2xl font-bold bg-gradient-blue bg-clip-text text-transparent hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm"
              aria-label="ProtoThrive Home"
            >
              ProtoThrive
            </Link>

            <nav 
              className="flex gap-4 md:gap-8 items-center flex-wrap"
              role="navigation"
              aria-label="Main navigation"
            >
              <Link 
                href="/test" 
                className="text-gray-300 hover:text-white transition-colors p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Test Page
              </Link>
              <Link 
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Login
              </Link>
              <Link 
                href="/signup"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Sign Up
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main id="main-content" className="px-4 py-16 md:px-8 max-w-7xl mx-auto">
          {/* Hero Section */}
          <motion.section 
            className="text-center mb-16"
            initial="initial"
            animate="animate"
            variants={staggerChildren}
          >
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-neon-mix bg-clip-text text-transparent leading-tight"
              variants={fadeInUp}
            >
              AI-Powered Project Visualization
            </motion.h1>

            <motion.p 
              className="text-xl text-gray-400 mb-2 max-w-2xl mx-auto leading-relaxed"
              variants={fadeInUp}
            >
              Transform your project management with intelligent roadmaps and visual workflows.
            </motion.p>
            
            <motion.p
              className="text-base text-gray-500 italic mb-8"
              variants={fadeInUp}
            >
              *Beta version - features in active development
            </motion.p>

            <motion.div 
              className="flex gap-4 justify-center flex-wrap"
              variants={fadeInUp}
            >
              <Link 
                href="/signup"
                className="group bg-gradient-blue hover:shadow-glow-blue text-white px-8 py-4 rounded-lg font-semibold text-lg inline-flex items-center gap-2 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/50"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link 
                href="/test"
                className="bg-transparent hover:bg-white/10 text-blue-400 px-8 py-4 rounded-lg font-semibold text-lg border-2 border-blue-400 inline-block transition-all focus:outline-none focus:ring-4 focus:ring-blue-400/50"
              >
                View Demo
              </Link>
            </motion.div>
          </motion.section>

          {/* Features Grid */}
          <motion.section 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerChildren}
          >
            <motion.article 
              className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-8 hover:bg-blue-500/20 transition-all hover:shadow-glow-blue group"
              variants={fadeInUp}
              whileHover={{ scale: 1.02 }}
              role="article"
              aria-labelledby="smart-roadmaps"
            >
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-8 h-8 text-blue-400 group-hover:rotate-12 transition-transform" aria-hidden="true" />
                <h3 id="smart-roadmaps" className="text-blue-300 text-xl font-semibold">
                  Smart Roadmaps
                </h3>
              </div>
              <p className="leading-relaxed text-gray-300">
                AI-assisted project visualization with intelligent milestone tracking and progress analytics.
              </p>
            </motion.article>

            <motion.article 
              className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-8 hover:bg-purple-500/20 transition-all hover:shadow-glow-purple group"
              variants={fadeInUp}
              whileHover={{ scale: 1.02 }}
              role="article"
              aria-labelledby="real-time-collab"
            >
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-8 h-8 text-purple-400 group-hover:animate-pulse transition-transform" aria-hidden="true" />
                <h3 id="real-time-collab" className="text-purple-300 text-xl font-semibold">
                  Real-time Collaboration
                </h3>
              </div>
              <p className="leading-relaxed text-gray-300">
                Live editing and updates with team synchronization across all project elements.
              </p>
            </motion.article>

            <motion.article 
              className="bg-green-500/10 border border-green-500/30 rounded-lg p-8 hover:bg-green-500/20 transition-all hover:shadow-glow-green group"
              variants={fadeInUp}
              whileHover={{ scale: 1.02 }}
              role="article"
              aria-labelledby="analytics-dashboard"
            >
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-8 h-8 text-green-400 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <h3 id="analytics-dashboard" className="text-green-300 text-xl font-semibold">
                  Analytics Dashboard
                </h3>
              </div>
              <p className="leading-relaxed text-gray-300">
                Comprehensive project metrics and performance insights with customizable reporting.
              </p>
            </motion.article>
          </motion.section>

          {/* Status Section */}
          <motion.section 
            className="bg-gray-700/50 border border-gray-600/30 rounded-lg p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            role="region"
            aria-labelledby="status-heading"
          >
            <h2 id="status-heading" className="text-2xl font-semibold mb-6 text-center text-gray-100">
              Current Status
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <motion.div 
                className="flex items-start gap-3"
                whileHover={{ x: 5 }}
              >
                <CheckCircle className="w-6 h-6 text-green-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-green-400 font-semibold">Backend APIs</div>
                  <div className="text-sm text-gray-400">Fully operational</div>
                </div>
              </motion.div>
              <motion.div 
                className="flex items-start gap-3"
                whileHover={{ x: 5 }}
              >
                <CheckCircle className="w-6 h-6 text-green-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-green-400 font-semibold">Frontend Core</div>
                  <div className="text-sm text-gray-400">Performance optimized</div>
                </div>
              </motion.div>
              <motion.div 
                className="flex items-start gap-3"
                whileHover={{ x: 5 }}
              >
                <CheckCircle className="w-6 h-6 text-green-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-green-400 font-semibold">Legal Compliance</div>
                  <div className="text-sm text-gray-400">Beta disclaimers active</div>
                </div>
              </motion.div>
            </div>
          </motion.section>
        </main>

        {/* Lazy loaded footer */}
        <Suspense fallback={
          <footer className="border-t border-white/10 p-8 text-center text-sm text-gray-500">
            Loading...
          </footer>
        }>
          <LandingFooter />
        </Suspense>
      </div>
    </>
  );
};

export default LandingPage;