/**
 * Layout Component - Accessible Page Layout with WCAG 2.1 AA Compliance
 *
 * Features:
 * - Skip-to-content link for keyboard navigation
 * - Semantic HTML5 landmark regions (header, nav, main, footer)
 * - Proper ARIA roles and labels
 * - Focus management for main content
 *
 * Phase 3: Accessibility WCAG 2.1 AA Compliance
 */

import { ReactNode } from 'react';
import Link from 'next/link';

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export default function Layout({
  children,
  showHeader = true,
  showFooter = true
}: LayoutProps) {
  return (
    <>
      {/* Skip to main content link - WCAG 2.1 AA requirement */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Header - Banner landmark */}
      {showHeader && (
        <header role="banner" className="bg-white border-b border-gray-200">
          <nav
            role="navigation"
            aria-label="Main navigation"
            className="container mx-auto px-4 py-4"
          >
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="text-xl font-bold text-gray-900 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                aria-label="ProtoThrive Home"
              >
                ProtoThrive
              </Link>

              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </nav>
        </header>
      )}

      {/* Main Content - Main landmark */}
      <main
        role="main"
        id="main-content"
        tabIndex={-1}
        className="min-h-screen"
      >
        {children}
      </main>

      {/* Footer - Contentinfo landmark */}
      {showFooter && (
        <footer
          role="contentinfo"
          className="bg-gray-900 text-white py-12"
        >
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Company Info */}
              <div>
                <h2 className="text-lg font-bold mb-4">ProtoThrive</h2>
                <p className="text-gray-400 text-sm">
                  AI-first development platform for visual prototyping and rapid development.
                </p>
              </div>

              {/* Product Links */}
              <nav aria-label="Product navigation">
                <h2 className="text-lg font-bold mb-4">Product</h2>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/features"
                      className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                    >
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/pricing"
                      className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                    >
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/docs"
                      className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                    >
                      Documentation
                    </Link>
                  </li>
                </ul>
              </nav>

              {/* Company Links */}
              <nav aria-label="Company navigation">
                <h2 className="text-lg font-bold mb-4">Company</h2>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/about"
                      className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                    >
                      About
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/blog"
                      className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                    >
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                    >
                      Contact
                    </Link>
                  </li>
                </ul>
              </nav>

              {/* Legal Links */}
              <nav aria-label="Legal navigation">
                <h2 className="text-lg font-bold mb-4">Legal</h2>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/privacy"
                      className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/terms"
                      className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                    >
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/beta-terms"
                      className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                    >
                      Beta Terms
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Copyright */}
            <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
              <p>© {new Date().getFullYear()} ProtoThrive. All rights reserved.</p>
            </div>
          </div>
        </footer>
      )}
    </>
  );
}
