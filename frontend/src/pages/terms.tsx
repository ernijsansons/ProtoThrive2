import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function Terms() {
  const lastUpdated = 'January 4, 2025';

  return (
    <>
      <Head>
        <title>Terms of Service - ProtoThrive</title>
        <meta name="description" content="ProtoThrive Terms of Service - Legal agreement for using our AI-powered visual prototyping platform." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Link href="/" className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-6">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Home
          </Link>

          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-gray-400 mb-8">Last updated: {lastUpdated}</p>

          <div className="space-y-8 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">1. Acceptance of Terms</h2>
              <p className="mb-4">
                By accessing or using ProtoThrive's AI-first SaaS platform for visual prototyping and automated development workflows ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, then you may not access the Service.
              </p>
              <p>
                These Terms apply to all visitors, users, and others who access or use the Service, including but not limited to registered users, paying customers, and trial users.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">2. Service Description</h2>
              <p className="mb-4">
                ProtoThrive provides an AI-powered platform that includes:
              </p>
              <ul className="list-disc list-inside ml-4 mb-4">
                <li>Visual roadmap creation and management tools</li>
                <li>AI-driven code generation and development assistance</li>
                <li>Multi-agent AI system with 14 specialized development agents</li>
                <li>Real-time collaboration features</li>
                <li>Template libraries and code snippet management</li>
                <li>Thrive Score analytics and project tracking</li>
                <li>Integration with third-party development tools and services</li>
              </ul>
              <p>
                We reserve the right to modify, suspend, or discontinue any part of the Service at any time with or without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">3. User Accounts</h2>

              <h3 className="text-xl font-medium mb-2 text-purple-400">3.1 Account Registration</h3>
              <p className="mb-4">
                To access certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc list-inside ml-4 mb-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Keep your password confidential and secure</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>

              <h3 className="text-xl font-medium mb-2 text-purple-400">3.2 Account Termination</h3>
              <p>
                We reserve the right to suspend or terminate your account at our sole discretion, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">4. User Conduct</h2>
              <p className="mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc list-inside ml-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon intellectual property rights of others</li>
                <li>Upload or transmit viruses, malware, or other harmful code</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Circumvent any security measures or access controls</li>
                <li>Use automated means to access the Service without permission</li>
                <li>Harvest or collect information about other users</li>
                <li>Engage in any activity that could damage our reputation</li>
                <li>Resell or redistribute the Service without authorization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">5. Intellectual Property Rights</h2>

              <h3 className="text-xl font-medium mb-2 text-purple-400">5.1 Our Intellectual Property</h3>
              <p className="mb-4">
                The Service and its original content, features, and functionality are owned by ProtoThrive and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>

              <h3 className="text-xl font-medium mb-2 text-purple-400">5.2 Your Content</h3>
              <p className="mb-4">
                You retain all rights to content you create using the Service ("User Content"). By using the Service, you grant us a worldwide, non-exclusive, royalty-free license to:
              </p>
              <ul className="list-disc list-inside ml-4 mb-4">
                <li>Host, store, and backup your User Content</li>
                <li>Display your User Content to you and authorized users</li>
                <li>Process your User Content through our AI systems</li>
                <li>Use anonymized data to improve our Service</li>
              </ul>

              <h3 className="text-xl font-medium mb-2 text-purple-400">5.3 AI-Generated Content</h3>
              <p>
                Content generated by our AI agents is provided under a license that permits commercial use. You are responsible for reviewing and validating all AI-generated content before use in production environments.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">6. Payment Terms</h2>

              <h3 className="text-xl font-medium mb-2 text-purple-400">6.1 Subscription Plans</h3>
              <p className="mb-4">
                Access to certain features requires a paid subscription. By subscribing, you agree to:
              </p>
              <ul className="list-disc list-inside ml-4 mb-4">
                <li>Pay all applicable fees according to your selected plan</li>
                <li>Provide accurate billing information</li>
                <li>Accept automatic renewal unless canceled</li>
                <li>Understand that fees are non-refundable except as required by law</li>
              </ul>

              <h3 className="text-xl font-medium mb-2 text-purple-400">6.2 Price Changes</h3>
              <p>
                We reserve the right to modify pricing with 30 days' notice. Continued use of the Service after price changes indicates acceptance of the new pricing.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">7. Service Availability and Support</h2>

              <h3 className="text-xl font-medium mb-2 text-purple-400">7.1 Availability</h3>
              <p className="mb-4">
                While we strive for 99.99% uptime, we do not guarantee uninterrupted access to the Service. We may perform maintenance, updates, or experience technical issues that affect availability.
              </p>

              <h3 className="text-xl font-medium mb-2 text-purple-400">7.2 Support</h3>
              <p>
                Technical support is provided according to your subscription tier. Enterprise customers receive priority support with guaranteed response times.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">8. Privacy and Data Protection</h2>
              <p className="mb-4">
                Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent to the collection and use of information as detailed in the Privacy Policy.
              </p>
              <p>
                We implement industry-standard security measures including end-to-end encryption, secure authentication, and regular security audits to protect your data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">9. Disclaimers and Warranties</h2>

              <h3 className="text-xl font-medium mb-2 text-purple-400">9.1 "As Is" Service</h3>
              <p className="mb-4">
                THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE.
              </p>

              <h3 className="text-xl font-medium mb-2 text-purple-400">9.2 AI-Generated Content Disclaimer</h3>
              <p>
                AI-generated content may contain errors or inaccuracies. You are solely responsible for reviewing, testing, and validating all AI-generated code and content before use.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">10. Limitation of Liability</h2>
              <p className="mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, PROTOTHRIVE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
              <p>
                IN NO EVENT SHALL OUR AGGREGATE LIABILITY EXCEED THE AMOUNTS ACTUALLY PAID BY YOU TO PROTOTHRIVE IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">11. Indemnification</h2>
              <p>
                You agree to defend, indemnify, and hold harmless ProtoThrive and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Your User Content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">12. Termination</h2>
              <p className="mb-4">
                Either party may terminate these Terms at any time. Upon termination:
              </p>
              <ul className="list-disc list-inside ml-4">
                <li>Your right to access and use the Service will immediately cease</li>
                <li>You must cease all use of the Service</li>
                <li>We may delete your account and User Content after 30 days</li>
                <li>All provisions that should survive termination will remain in effect</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">13. Dispute Resolution</h2>

              <h3 className="text-xl font-medium mb-2 text-purple-400">13.1 Arbitration</h3>
              <p className="mb-4">
                Any disputes arising from these Terms or the Service shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, except where prohibited by law.
              </p>

              <h3 className="text-xl font-medium mb-2 text-purple-400">13.2 Class Action Waiver</h3>
              <p>
                You agree to resolve disputes with us on an individual basis and waive your right to participate in class actions, class arbitrations, or representative actions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">14. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law principles. Any legal action or proceeding shall be brought exclusively in the courts located in Delaware.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">15. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will provide notice of material changes through the Service or via email. Your continued use of the Service after changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">16. General Provisions</h2>

              <h3 className="text-xl font-medium mb-2 text-purple-400">16.1 Entire Agreement</h3>
              <p className="mb-4">
                These Terms constitute the entire agreement between you and ProtoThrive regarding the Service and supersede all prior agreements and understandings.
              </p>

              <h3 className="text-xl font-medium mb-2 text-purple-400">16.2 Severability</h3>
              <p className="mb-4">
                If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.
              </p>

              <h3 className="text-xl font-medium mb-2 text-purple-400">16.3 Waiver</h3>
              <p className="mb-4">
                Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
              </p>

              <h3 className="text-xl font-medium mb-2 text-purple-400">16.4 Assignment</h3>
              <p>
                You may not assign or transfer these Terms without our prior written consent. We may assign our rights and obligations without restriction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">17. Contact Information</h2>
              <p className="mb-4">
                For questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="mb-2"><strong>Email:</strong> legal@protothrive.com</p>
                <p className="mb-2"><strong>Support:</strong> support@protothrive.com</p>
                <p className="mb-2"><strong>Address:</strong> ProtoThrive Inc.</p>
                <p className="mb-2">Legal Department</p>
                <p>Terms and Conditions Division</p>
              </div>
            </section>

            <section className="border-t border-gray-700 pt-8 mt-8">
              <p className="text-sm text-gray-400">
                By using ProtoThrive, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. These Terms are effective as of {lastUpdated}.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}