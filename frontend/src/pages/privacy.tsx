import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

/**
 * Privacy Policy Page
 * GDPR and CCPA compliant privacy policy
 * Transparent about data collection and usage
 */
const PrivacyPolicy = () => {
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
            Privacy Policy
          </h1>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '3rem 2rem'
      }}>
        {/* Privacy Commitment */}
        <div style={{
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem'
        }}>
          <ShieldCheckIcon style={{ width: '1.5rem', height: '1.5rem', color: '#22c55e', flexShrink: 0 }} />
          <div>
            <h2 style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: '#22c55e',
              marginBottom: '0.5rem'
            }}>
              Our Privacy Commitment
            </h2>
            <p style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
              We take your privacy seriously. This policy explains what data we collect,
              how we use it, and your rights regarding your personal information.
            </p>
          </div>
        </div>

        <div style={{
          fontSize: '0.875rem',
          color: '#9ca3af',
          marginBottom: '2rem'
        }}>
          <strong>Effective Date:</strong> September 22, 2024<br />
          <strong>Last Updated:</strong> September 22, 2024
        </div>

        {/* Privacy Sections */}
        <div style={{ lineHeight: '1.8' }}>
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              1. Information We Collect
            </h2>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '1rem', marginBottom: '0.5rem' }}>
              1.1 Information You Provide
            </h3>
            <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
              <li>Account information (email, username, password)</li>
              <li>Profile information (name, company, role)</li>
              <li>Project data (roadmaps, tasks, notes)</li>
              <li>Communication preferences</li>
              <li>Feedback and support requests</li>
            </ul>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '1rem', marginBottom: '0.5rem' }}>
              1.2 Information Collected Automatically
            </h3>
            <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
              <li>Usage data (features used, time spent)</li>
              <li>Device information (browser type, OS)</li>
              <li>IP address and approximate location</li>
              <li>Cookies and similar technologies</li>
              <li>Performance and error logs</li>
            </ul>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '1rem', marginBottom: '0.5rem' }}>
              1.3 Beta Testing Data
            </h3>
            <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
              <li>Feature usage patterns</li>
              <li>Bug reports and crash data</li>
              <li>Performance metrics</li>
              <li>User feedback and suggestions</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              2. How We Use Your Information
            </h2>
            <ul style={{ marginLeft: '2rem' }}>
              <li>Provide and improve the Service</li>
              <li>Personalize your experience</li>
              <li>Communicate with you about the Service</li>
              <li>Send important updates and notifications</li>
              <li>Analyze usage patterns to improve features</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              3. Information Sharing
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              We do not sell your personal information. We may share your information only:
            </p>
            <ul style={{ marginLeft: '2rem' }}>
              <li>With your consent</li>
              <li>With service providers who assist our operations</li>
              <li>To comply with legal obligations</li>
              <li>To protect rights, safety, and property</li>
              <li>In connection with a business transaction (merger, acquisition)</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              4. Data Security
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              We implement appropriate technical and organizational measures to protect your data:
            </p>
            <ul style={{ marginLeft: '2rem' }}>
              <li>Encryption in transit and at rest</li>
              <li>Regular security audits</li>
              <li>Access controls and authentication</li>
              <li>Employee training on data protection</li>
              <li>Incident response procedures</li>
            </ul>
            <div style={{
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '0.25rem',
              padding: '0.75rem',
              marginTop: '1rem',
              fontSize: '0.875rem'
            }}>
              <strong>Beta Notice:</strong> As beta software, security features are still being enhanced.
              Please do not store sensitive or regulated data during the beta period.
            </div>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              5. Your Rights
            </h2>
            <p style={{ marginBottom: '1rem' }}>You have the right to:</p>
            <ul style={{ marginLeft: '2rem' }}>
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and data</li>
              <li>Export your data in a portable format</li>
              <li>Opt-out of marketing communications</li>
              <li>Restrict processing of your data</li>
              <li>Object to certain uses of your data</li>
            </ul>
            <p style={{ marginTop: '1rem' }}>
              To exercise these rights, contact us at privacy@protothrive.com
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              6. Cookies and Tracking
            </h2>
            <p style={{ marginBottom: '1rem' }}>We use cookies and similar technologies for:</p>
            <ul style={{ marginLeft: '2rem' }}>
              <li>Authentication and security</li>
              <li>Remembering your preferences</li>
              <li>Analytics and performance monitoring</li>
              <li>Feature testing and improvements</li>
            </ul>
            <p style={{ marginTop: '1rem' }}>
              You can control cookies through your browser settings, though some features may not work properly.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              7. Data Retention
            </h2>
            <p>
              We retain your information for as long as necessary to provide the Service and comply with legal obligations.
              When you delete your account, we will delete or anonymize your personal information within 30 days,
              except as required by law.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              8. Children's Privacy
            </h2>
            <p>
              ProtoThrive is not intended for children under 13. We do not knowingly collect information from children.
              If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              9. International Data Transfers
            </h2>
            <p>
              Your information may be transferred to and processed in countries other than your own.
              We ensure appropriate safeguards are in place for such transfers.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              10. Changes to This Policy
            </h2>
            <p>
              We may update this policy from time to time. We will notify you of significant changes
              via email or through the Service. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              11. Contact Us
            </h2>
            <p>
              For privacy-related questions or concerns:<br /><br />
              <strong>Email:</strong> privacy@protothrive.com<br />
              <strong>Data Protection Officer:</strong> dpo@protothrive.com<br />
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              12. California Privacy Rights
            </h2>
            <p>
              California residents have additional rights under the CCPA, including the right to know
              what personal information is collected, used, shared, or sold. For more information or
              to exercise your rights, contact us at privacy@protothrive.com.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              13. European Privacy Rights
            </h2>
            <p>
              If you are in the European Economic Area, you have rights under the GDPR, including
              the right to data portability and the right to lodge a complaint with your local
              data protection authority.
            </p>
          </section>
        </div>

        {/* Footer Notice */}
        <div style={{
          marginTop: '3rem',
          paddingTop: '2rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            This privacy policy was last updated on September 22, 2024.<br />
            ProtoThrive is committed to protecting your privacy and being transparent about our data practices.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;