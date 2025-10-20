import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  CheckCircleIcon,
  XMarkIcon,
  SparklesIcon,
  BoltIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const plans = [
    {
      name: 'Free',
      tagline: 'For individuals exploring AI development',
      price: { monthly: 0, yearly: 0 },
      icon: SparklesIcon,
      color: 'gray',
      gradient: 'from-gray-600 to-gray-700',
      features: [
        { name: '1 active roadmap', included: true },
        { name: '5 AI agent requests/month', included: true },
        { name: 'Basic visual editor', included: true },
        { name: 'Community support', included: true },
        { name: 'Export to JSON', included: true },
        { name: 'Code generation', included: false },
        { name: 'Advanced AI agents', included: false },
        { name: 'Team collaboration', included: false },
        { name: 'Priority support', included: false },
      ],
      cta: 'Start Free',
      popular: false
    },
    {
      name: 'Pro',
      tagline: 'For developers shipping products faster',
      price: { monthly: 29, yearly: 290 },
      icon: BoltIcon,
      color: 'blue',
      gradient: 'from-blue-600 to-purple-600',
      features: [
        { name: 'Unlimited roadmaps', included: true },
        { name: '500 AI agent requests/month', included: true },
        { name: 'Advanced visual editor (2D/3D)', included: true },
        { name: 'All 14 AI agents', included: true },
        { name: 'Code generation & review', included: true },
        { name: 'Automated testing (98% coverage)', included: true },
        { name: 'Security auditing', included: true },
        { name: 'Email support (24h response)', included: true },
        { name: 'Team collaboration (up to 3)', included: false },
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      tagline: 'For teams building at scale',
      price: { monthly: 99, yearly: 990 },
      icon: RocketLaunchIcon,
      color: 'purple',
      gradient: 'from-purple-600 to-pink-600',
      features: [
        { name: 'Everything in Pro, plus:', included: true },
        { name: 'Unlimited AI agent requests', included: true },
        { name: 'Unlimited team members', included: true },
        { name: 'SSO & SAML authentication', included: true },
        { name: 'Custom AI agent training', included: true },
        { name: 'Dedicated account manager', included: true },
        { name: 'Priority support (1h response)', included: true },
        { name: 'SLA guarantee (99.9% uptime)', included: true },
        { name: 'Custom integrations', included: true },
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  const faqs = [
    {
      question: 'What is ProtoThrive?',
      answer: 'ProtoThrive is an AI-first development platform that transforms visual roadmaps into production-ready code. Our 14 specialized AI agents handle everything from planning to deployment, helping you ship 60% faster.'
    },
    {
      question: 'How does the free trial work?',
      answer: 'All paid plans come with a 14-day free trial. No credit card required. You get full access to all features during the trial period, and you can cancel anytime before it ends.'
    },
    {
      question: 'What are AI agent requests?',
      answer: 'Each time you ask an AI agent to perform a task (generate code, review, test, deploy, etc.), that counts as one request. Pro plan includes 500 requests/month, which is typically enough for 3-5 medium projects.'
    },
    {
      question: 'Can I change plans later?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you get immediate access to new features. When downgrading, changes take effect at the end of your current billing cycle.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express) via Stripe. Enterprise customers can also pay by invoice with NET-30 terms.'
    },
    {
      question: 'Is my code secure?',
      answer: 'Absolutely. We use bank-level encryption (AES-256), have SOC 2 Type II certification, and never train our AI models on your proprietary code. Enterprise plans include SSO and custom security policies.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Yes. If you\'re not satisfied within the first 30 days, we offer a full refund, no questions asked. Just contact support@protothrive.com.'
    },
    {
      question: 'What happens to my data if I cancel?',
      answer: 'You retain full access to export all your roadmaps and generated code for 30 days after cancellation. After that, data is permanently deleted per our privacy policy.'
    }
  ];

  const yearlyDiscount = (plan: typeof plans[0]) => {
    if (plan.price.yearly === 0) return 0;
    const monthlyTotal = plan.price.monthly * 12;
    return Math.round(((monthlyTotal - plan.price.yearly) / monthlyTotal) * 100);
  };

  return (
    <>
      <Head>
        <title>Pricing - ProtoThrive</title>
        <meta name="description" content="Simple, transparent pricing for AI-powered development. Start free, scale as you grow." />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Header */}
        <header className="w-full py-6 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="inline-flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-gray-900 font-bold text-xl">ProtoThrive</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">BETA</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm">
                Sign In
              </Link>
              <Link href="/register" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all text-sm">
                Get Started
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Start free, scale as you grow. All plans include core features.<br />
              <span className="text-blue-600 font-semibold">14-day free trial</span> on paid plans. No credit card required.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-white rounded-full p-1 shadow-md border border-gray-200">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full font-semibold text-sm transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full font-semibold text-sm transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                  Save 17%
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              const price = billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;
              const savings = yearlyDiscount(plan);

              return (
                <div
                  key={index}
                  className={`relative bg-white rounded-2xl shadow-xl border-2 transition-all hover:shadow-2xl hover:-translate-y-2 ${
                    plan.popular
                      ? 'border-blue-600 ring-4 ring-blue-600 ring-opacity-20'
                      : 'border-gray-200'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                        🔥 MOST POPULAR
                      </span>
                    </div>
                  )}

                  <div className="p-8">
                    {/* Icon & Name */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${plan.gradient} rounded-xl flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                        <p className="text-sm text-gray-600">{plan.tagline}</p>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-extrabold text-gray-900">
                          ${price}
                        </span>
                        <span className="text-gray-600">
                          /{billingCycle === 'monthly' ? 'mo' : 'year'}
                        </span>
                      </div>
                      {billingCycle === 'yearly' && savings > 0 && (
                        <p className="text-sm text-green-600 font-semibold mt-1">
                          Save ${plan.price.monthly * 12 - plan.price.yearly}/year ({savings}% off)
                        </p>
                      )}
                    </div>

                    {/* CTA Button */}
                    <Link
                      href={plan.name === 'Enterprise' ? '/contact' : '/register'}
                      className={`block w-full py-3 px-6 rounded-lg font-semibold text-center transition-all transform hover:scale-105 shadow-lg hover:shadow-xl ${
                        plan.popular
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                    >
                      {plan.cta}
                    </Link>

                    {/* Features */}
                    <div className="mt-8 space-y-3">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          {feature.included ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XMarkIcon className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={`text-sm ${feature.included ? 'text-gray-900' : 'text-gray-400'}`}>
                            {feature.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Compare All Features
            </h2>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">Free</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-blue-600">Pro</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-purple-600">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    { feature: 'Active Roadmaps', free: '1', pro: 'Unlimited', enterprise: 'Unlimited' },
                    { feature: 'AI Agent Requests/Month', free: '5', pro: '500', enterprise: 'Unlimited' },
                    { feature: 'Visual Editor', free: 'Basic', pro: '2D/3D Advanced', enterprise: '2D/3D Advanced' },
                    { feature: 'AI Agents', free: '3 basic', pro: 'All 14', enterprise: 'All 14 + Custom' },
                    { feature: 'Code Generation', free: false, pro: true, enterprise: true },
                    { feature: 'Automated Testing', free: false, pro: true, enterprise: true },
                    { feature: 'Security Auditing', free: false, pro: true, enterprise: true },
                    { feature: 'Team Members', free: '1', pro: '3', enterprise: 'Unlimited' },
                    { feature: 'Support', free: 'Community', pro: 'Email (24h)', enterprise: 'Priority (1h)' },
                    { feature: 'SSO/SAML', free: false, pro: false, enterprise: true },
                    { feature: 'SLA Guarantee', free: false, pro: false, enterprise: '99.9%' },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{row.feature}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">
                        {typeof row.free === 'boolean' ? (
                          row.free ? <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" /> : <XMarkIcon className="w-5 h-5 text-gray-300 mx-auto" />
                        ) : (
                          row.free
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-900 font-semibold">
                        {typeof row.pro === 'boolean' ? (
                          row.pro ? <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" /> : <XMarkIcon className="w-5 h-5 text-gray-300 mx-auto" />
                        ) : (
                          row.pro
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-900 font-semibold">
                        {typeof row.enterprise === 'boolean' ? (
                          row.enterprise ? <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" /> : <XMarkIcon className="w-5 h-5 text-gray-300 mx-auto" />
                        ) : (
                          row.enterprise
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-900">{faq.question}</span>
                    <QuestionMarkCircleIcon className={`w-5 h-5 text-blue-600 transform transition-transform ${openFAQ === index ? 'rotate-180' : ''}`} />
                  </button>
                  {openFAQ === index && (
                    <div className="px-6 pb-4 text-gray-600">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Build 60% Faster?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Start your free trial today. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="px-8 py-4 bg-white hover:bg-gray-100 text-blue-600 font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 text-lg"
              >
                Start Free Trial
              </Link>
              <Link
                href="/demo"
                className="px-8 py-4 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all border-2 border-white text-lg"
              >
                Try Interactive Demo
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 text-center bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto">
            <p className="text-sm text-gray-600 mb-4">
              Questions? Email us at{' '}
              <a href="mailto:sales@protothrive.com" className="text-blue-600 hover:underline font-semibold">
                sales@protothrive.com
              </a>
            </p>
            <p className="text-sm text-gray-500">
              © 2025 ProtoThrive. All rights reserved. |{' '}
              <Link href="/terms" className="hover:underline">Terms</Link>
              {' '}·{' '}
              <Link href="/privacy" className="hover:underline">Privacy</Link>
              {' '}·{' '}
              <Link href="/beta-terms" className="hover:underline">Beta Terms</Link>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default PricingPage;
