/**
 * Landing Page Footer Component
 * Optimized for accessibility and performance
 */

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const LandingFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer 
      className="border-t border-white/10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-8">
        {/* Links Section */}
        <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm">
          <Link 
            href="/terms"
            className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            aria-label="Terms of Service"
          >
            Terms of Service
          </Link>
          <Link 
            href="/privacy"
            className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            aria-label="Privacy Policy"
          >
            Privacy Policy
          </Link>
          <Link 
            href="/health"
            className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            aria-label="System Status"
          >
            System Status
          </Link>
          <a 
            href="https://github.com/protothrive"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            aria-label="GitHub Repository (opens in new tab)"
          >
            GitHub
          </a>
          <a 
            href="mailto:support@protothrive.com"
            className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            aria-label="Contact Support"
          >
            Support
          </a>
        </div>

        {/* Copyright Section */}
        <div className="text-center text-sm text-gray-500">
          <p className="mb-2">
            © {currentYear} ProtoThrive. All rights reserved.
          </p>
          <p className="text-xs">
            Beta software - Features and pricing subject to change without notice.
          </p>
        </div>

        {/* Accessibility Statement */}
        <div className="mt-6 text-center">
          <Link 
            href="/accessibility"
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            aria-label="Accessibility Statement"
          >
            Accessibility Statement
          </Link>
        </div>
      </div>
    </motion.footer>
  );
};

export default LandingFooter;