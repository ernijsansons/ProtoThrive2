import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

/**
 * Terms of Service Page
 * Legally compliant terms for beta software
 * Based on TERMS_OF_SERVICE.md
 */
const TermsOfService = () => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0b',
      color: '#e5e7eb',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(10, 10, 11, 0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '2rem'
        }}>
          <Link href="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#9ca3af',
            textDecoration: 'none',
            fontSize: '0.875rem',
            transition: 'color 0.2s'
          }}>
            <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
            Back to Home
          </Link>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Terms of Service
          </h1>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '3rem 2rem'
      }}>
        {/* Beta Notice */}
        <div style={{
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1rem',
            fontWeight: 'bold',
            color: '#60a5fa',
            marginBottom: '0.5rem'
          }}>
            ⚠️ BETA SOFTWARE NOTICE
          </h2>
          <p style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
            ProtoThrive is currently in beta testing. The software is provided "AS IS" without warranties.
            Features, pricing, and availability may change without notice.
            Service interruptions and data loss may occur.
          </p>
        </div>

        <div style={{
          fontSize: '0.875rem',
          color: '#9ca3af',
          marginBottom: '2rem'
        }}>
          <strong>Effective Date:</strong> September 22, 2024<br />
          <strong>Version:</strong> 1.0 Beta
        </div>

        {/* Terms Sections */}
        <div style={{ lineHeight: '1.8' }}>
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              1. Acceptance of Terms
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              By accessing or using ProtoThrive ("Service"), you agree to be bound by these Terms of Service ("Terms").
              If you disagree with any part of these terms, you do not have permission to access the Service.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              2. Description of Service
            </h2>
            <p style={{ marginBottom: '0.5rem' }}>ProtoThrive provides:</p>
            <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
              <li>3D project visualization tools</li>
              <li>AI-assisted code generation (subject to usage limits)</li>
              <li>Collaborative project management features</li>
              <li>Data storage and synchronization</li>
            </ul>
            <p style={{ fontStyle: 'italic', color: '#fbbf24' }}>
              All features are subject to change during the beta period.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              3. No WARRANTIES or Guarantees
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS.
              We expressly disclaim all warranties of any kind, including but not limited to:
            </p>
            <ul style={{ marginLeft: '2rem' }}>
              <li>Accuracy of AI-generated content</li>
              <li>Specific performance metrics or response times</li>
              <li>Uptime or availability guarantees</li>
              <li>Data retention or backup</li>
              <li>Fitness for a particular purpose</li>
              <li>Security or compliance certifications</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              4. AI Features Disclaimer
            </h2>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '1rem', marginBottom: '0.5rem' }}>
              4.1 Accuracy
            </h3>
            <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
              <li>AI-generated code and suggestions are not guaranteed to be error-free</li>
              <li>All AI output should be reviewed and tested before use</li>
              <li>We are not responsible for any issues arising from AI-generated content</li>
            </ul>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '1rem', marginBottom: '0.5rem' }}>
              4.2 Usage Limits
            </h3>
            <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
              <li>AI features are subject to usage quotas and rate limits</li>
              <li>Costs may vary based on AI model selection and usage</li>
              <li>Budget controls are estimates and may not prevent all overages</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              5. Limitation of Liability
            </h2>
            <p style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
              IN NO EVENT SHALL PROTOTHRIVE BE LIABLE FOR:
            </p>
            <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
              <li>Any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, data, use, goodwill, or other intangible losses</li>
              <li>Damages exceeding $100 USD or the amount paid by you in the past 12 months</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              6. User Responsibilities
            </h2>
            <p style={{ marginBottom: '0.5rem' }}>You agree to:</p>
            <ul style={{ marginLeft: '2rem' }}>
              <li>Provide accurate account information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Use the Service in compliance with all applicable laws</li>
              <li>Not reverse engineer or attempt to extract source code</li>
              <li>Not use the Service for illegal or harmful purposes</li>
              <li>Not misrepresent our relationship or make false claims about the Service</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              7. Beta Period Specific Terms
            </h2>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '1rem', marginBottom: '0.5rem' }}>
              7.1 Duration
            </h3>
            <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
              <li>Beta period duration is at our discretion</li>
              <li>Service may be discontinued with 30 days notice</li>
            </ul>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '1rem', marginBottom: '0.5rem' }}>
              7.2 Pricing
            </h3>
            <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
              <li>Beta pricing is promotional and temporary</li>
              <li>Prices will change after beta period</li>
              <li>No refunds for beta period payments</li>
            </ul>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '1rem', marginBottom: '0.5rem' }}>
              7.3 Data Migration
            </h3>
            <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
              <li>We do not guarantee data migration from beta to production</li>
              <li>Export your data regularly</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              8. Contact Information
            </h2>
            <p>
              For questions about these Terms:<br />
              Email: legal@protothrive.com
            </p>
          </section>
        </div>

        {/* Acceptance Notice */}
        <div style={{
          marginTop: '3rem',
          paddingTop: '2rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '0.875rem',
            fontWeight: 'bold',
            marginBottom: '1rem'
          }}>
            BY USING PROTOTHRIVE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD,
            AND AGREE TO BE BOUND BY THESE TERMS.
          </p>
          <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            Last Updated: September 22, 2024
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;