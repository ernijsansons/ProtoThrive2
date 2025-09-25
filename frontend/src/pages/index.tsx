/**
 * ProtoThrive Landing Page - User Experience Testing
 * Legal compliance verified, beta status clear
 */

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

const LandingPage = () => {
  return (
    <>
      <Head>
        <title>ProtoThrive - AI-Powered Project Management (Beta)</title>
        <meta name="description" content="Beta software for project visualization and management. Features subject to change." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0b',
        color: '#e5e7eb',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        {/* Beta Notice - Legal Compliance */}
        <div style={{
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          padding: '1rem',
          textAlign: 'center',
          fontSize: '0.875rem'
        }}>
          <strong>🚧 Beta Software Notice:</strong> ProtoThrive is in beta. Features, pricing, and availability subject to change.
        </div>

        {/* Header */}
        <header style={{
          padding: '1rem 2rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            ProtoThrive
          </div>

          <nav style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <Link href="/test" style={{ color: '#e5e7eb', textDecoration: 'none' }}>Test Page</Link>
            <Link href="/login" style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontSize: '0.875rem'
            }}>
              Login
            </Link>
            <Link href="/signup" style={{
              backgroundColor: '#8b5cf6',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontSize: '0.875rem'
            }}>
              Sign Up
            </Link>
          </nav>
        </header>

        {/* Main Content */}
        <main style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
          {/* Hero Section */}
          <section style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              fontWeight: 'bold',
              marginBottom: '1.5rem',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: '1.2'
            }}>
              AI-Powered Project Visualization
            </h1>

            <p style={{
              fontSize: '1.25rem',
              color: '#9ca3af',
              marginBottom: '2rem',
              maxWidth: '600px',
              margin: '0 auto 2rem auto',
              lineHeight: '1.6'
            }}>
              Transform your project management with intelligent roadmaps and visual workflows.
              <br />
              <em style={{ fontSize: '1rem', color: '#6b7280' }}>
                *Beta version - features in active development
              </em>
            </p>

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '3rem'
            }}>
              <Link href="/signup" style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '1rem 2rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '1.125rem',
                display: 'inline-block',
                transition: 'all 0.2s'
              }}>
                Start Free Trial
              </Link>

              <Link href="/demo" style={{
                backgroundColor: 'transparent',
                color: '#3b82f6',
                padding: '1rem 2rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '1.125rem',
                border: '1px solid #3b82f6',
                display: 'inline-block'
              }}>
                View Demo
              </Link>
            </div>
          </section>

          {/* Features Grid */}
          <section style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginBottom: '4rem'
          }}>
            <div style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '0.5rem',
              padding: '2rem'
            }}>
              <h3 style={{ color: '#60a5fa', marginBottom: '1rem', fontSize: '1.25rem' }}>
                🎯 Smart Roadmaps
              </h3>
              <p style={{ lineHeight: '1.6', color: '#d1d5db' }}>
                AI-assisted project visualization with intelligent milestone tracking and progress analytics.
              </p>
            </div>

            <div style={{
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '0.5rem',
              padding: '2rem'
            }}>
              <h3 style={{ color: '#a78bfa', marginBottom: '1rem', fontSize: '1.25rem' }}>
                ⚡ Real-time Collaboration
              </h3>
              <p style={{ lineHeight: '1.6', color: '#d1d5db' }}>
                Live editing and updates with team synchronization across all project elements.
              </p>
            </div>

            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '0.5rem',
              padding: '2rem'
            }}>
              <h3 style={{ color: '#34d399', marginBottom: '1rem', fontSize: '1.25rem' }}>
                📊 Analytics Dashboard
              </h3>
              <p style={{ lineHeight: '1.6', color: '#d1d5db' }}>
                Comprehensive project metrics and performance insights with customizable reporting.
              </p>
            </div>
          </section>

          {/* Status Section */}
          <section style={{
            backgroundColor: 'rgba(55, 65, 81, 0.5)',
            border: '1px solid rgba(75, 85, 99, 0.3)',
            borderRadius: '0.5rem',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <h2 style={{ marginBottom: '1rem', color: '#f3f4f6' }}>Current Status</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginTop: '1.5rem'
            }}>
              <div>
                <div style={{ color: '#10b981', fontWeight: 'bold' }}>✅ Backend APIs</div>
                <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Fully operational</div>
              </div>
              <div>
                <div style={{ color: '#10b981', fontWeight: 'bold' }}>✅ Frontend Core</div>
                <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>JSX runtime fixed</div>
              </div>
              <div>
                <div style={{ color: '#10b981', fontWeight: 'bold' }}>✅ Legal Compliance</div>
                <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Beta disclaimers active</div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '2rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            marginBottom: '1rem',
            flexWrap: 'wrap'
          }}>
            <Link href="/terms" style={{ color: '#9ca3af', textDecoration: 'none' }}>
              Terms of Service
            </Link>
            <Link href="/privacy" style={{ color: '#9ca3af', textDecoration: 'none' }}>
              Privacy Policy
            </Link>
            <Link href="/health" style={{ color: '#9ca3af', textDecoration: 'none' }}>
              System Status
            </Link>
          </div>
          <p>
            © 2024 ProtoThrive. Beta software - All features subject to change.
          </p>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;