import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function Privacy() {
  const lastUpdated = 'January 4, 2025';

  return (
    <>
      <Head>
        <title>Privacy Policy - ProtoThrive</title>
        <meta name="description" content="ProtoThrive Privacy Policy - Learn how we collect, use, and protect your personal information." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Link href="/" className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-6">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Home
          </Link>

          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-gray-400 mb-8">Last updated: {lastUpdated}</p>

          <div className="space-y-8 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">1. Introduction</h2>
              <p className="mb-4">
                ProtoThrive ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-first SaaS platform for visual prototyping and automated development workflows.
              </p>
              <p>
                By using ProtoThrive, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this policy, please do not access or use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">2. Information We Collect</h2>

              <h3 className="text-xl font-medium mb-2 text-purple-400">Personal Data</h3>
              <ul className="list-disc list-inside mb-4 ml-4">
                <li>Name and email address when you create an account</li>
                <li>Payment information (processed securely through Stripe)</li>
                <li>Company information for business accounts</li>
                <li>Profile information you choose to provide</li>
              </ul>

              <h3 className="text-xl font-medium mb-2 text-purple-400">Usage Data</h3>
              <ul className="list-disc list-inside mb-4 ml-4">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Pages visited and time spent on pages</li>
                <li>Feature usage and interaction patterns</li>
                <li>Roadmap creation and modification history</li>
              </ul>

              <h3 className="text-xl font-medium mb-2 text-purple-400">Cookies and Tracking</h3>
              <p className="mb-4">
                We use cookies and similar tracking technologies to track activity on our service and store certain information. You can instruct your browser to refuse all cookies or indicate when a cookie is being sent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside ml-4">
                <li>To provide and maintain our service</li>
                <li>To notify you about changes to our service</li>
                <li>To provide customer support</li>
                <li>To gather analysis or valuable information to improve our service</li>
                <li>To monitor the usage of our service</li>
                <li>To detect, prevent and address technical issues</li>
                <li>To provide you with news, special offers, and general information about other goods, services, and events</li>
                <li>To improve our AI models and development automation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">4. Information Sharing and Disclosure</h2>
              <p className="mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information in the following situations:
              </p>
              <ul className="list-disc list-inside ml-4">
                <li><strong>Service Providers:</strong> We may share your information with third-party service providers who perform services on our behalf (e.g., Cloudflare, Stripe, OpenAI/Anthropic for AI processing)</li>
                <li><strong>Legal Requirements:</strong> We may disclose your information where required to do so by law or in response to valid requests by public authorities</li>
                <li><strong>Business Transfers:</strong> Your information may be transferred in connection with a merger, acquisition, or sale of assets</li>
                <li><strong>Consent:</strong> We may disclose your information for any other purpose with your consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">5. Data Security</h2>
              <p className="mb-4">
                We implement industry-standard security measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside ml-4">
                <li>End-to-end encryption for sensitive data</li>
                <li>Secure JWT authentication with refresh tokens</li>
                <li>Multi-tenant architecture with data isolation</li>
                <li>Regular security audits and OWASP compliance</li>
                <li>Secure data storage on Cloudflare's infrastructure</li>
                <li>Regular backups and disaster recovery procedures</li>
              </ul>
              <p className="mt-4">
                However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">6. Your Rights (GDPR/CCPA)</h2>
              <p className="mb-4">
                Depending on your location, you may have the following rights regarding your personal data:
              </p>
              <ul className="list-disc list-inside ml-4">
                <li><strong>Access:</strong> Request access to your personal data</li>
                <li><strong>Rectification:</strong> Request correction of inaccurate personal data</li>
                <li><strong>Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Restrict Processing:</strong> Request restriction of processing your personal data</li>
                <li><strong>Data Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Object:</strong> Object to our processing of your personal data</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent at any time where we rely on consent</li>
                <li><strong>Non-Discrimination:</strong> Not be discriminated against for exercising your privacy rights</li>
              </ul>
              <p className="mt-4">
                To exercise any of these rights, please contact us at privacy@protothrive.com.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">7. Cookies Policy</h2>
              <p className="mb-4">
                We use the following types of cookies:
              </p>
              <ul className="list-disc list-inside ml-4">
                <li><strong>Essential Cookies:</strong> Required for the operation of our service</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how you use our service</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                <li><strong>Security Cookies:</strong> Used for authentication and fraud prevention</li>
              </ul>
              <p className="mt-4">
                You can manage your cookie preferences through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">8. Children's Privacy</h2>
              <p>
                Our service is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">9. International Data Transfers</h2>
              <p>
                Your information may be transferred to and maintained on servers located outside of your state, province, country, or other governmental jurisdiction. We ensure that appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">10. Third-Party Services</h2>
              <p className="mb-4">
                Our service integrates with the following third-party services:
              </p>
              <ul className="list-disc list-inside ml-4">
                <li>Cloudflare (Infrastructure and CDN)</li>
                <li>Stripe (Payment Processing)</li>
                <li>OpenAI/Anthropic (AI Processing)</li>
                <li>GitHub (Code Repository and CI/CD)</li>
              </ul>
              <p className="mt-4">
                Each of these services has their own privacy policy governing the use of your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">11. Data Retention</h2>
              <p>
                We retain your personal information only for as long as necessary to provide you with our service and as described in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our agreements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">12. Changes to This Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">13. Contact Information</h2>
              <p className="mb-4">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="mb-2"><strong>Email:</strong> privacy@protothrive.com</p>
                <p className="mb-2"><strong>Support:</strong> support@protothrive.com</p>
                <p className="mb-2"><strong>Address:</strong> ProtoThrive Inc.</p>
                <p className="mb-2">Data Protection Officer</p>
                <p>Legal Department</p>
              </div>
            </section>

            <section className="border-t border-gray-700 pt-8 mt-8">
              <p className="text-sm text-gray-400">
                This privacy policy is effective as of {lastUpdated} and will remain in effect except with respect to any changes in its provisions in the future, which will be in effect immediately after being posted on this page.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}