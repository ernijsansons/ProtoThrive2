import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { CheckIcon, SparklesIcon, RocketLaunchIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Starter',
      tagline: 'Perfect for getting started',
      price: { monthly: 0, yearly: 0 },
      color: 'gray',
      gradient: 'from-gray-500 to-gray-600',
      features: [
        '3 active roadmaps',
        '5 AI agent requests/month',
        'Basic visual editor',
        'Community support',
        '1GB storage',
        'Public roadmaps only'
      ],
      cta: 'Start Free',
      popular: false
    },
    {
      name: 'Professional',
      tagline: 'For growing teams',
      price: { monthly: 29, yearly: 290 },
      color: 'blue',
      gradient: 'from-blue-600 to-purple-600',
      features: [
        'Unlimited roadmaps',
        '500 AI agent requests/month',
        'Advanced visual editor',
        'Priority support',
        '100GB storage',
        'Private roadmaps',
        'Team collaboration',
        'Advanced analytics',
        'Custom templates'
      ],
      cta: 'Start Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      tagline: 'For large organizations',
      price: { monthly: 99, yearly: 990 },
      color: 'purple',
      gradient: 'from-purple-600 to-indigo-600',
      features: [
        'Everything in Professional',
        'Unlimited AI requests',
        'Custom integrations',
        'Dedicated support',
        'Unlimited storage',
        'Advanced security',
        'SLA guarantee',
        'Custom branding',
        'API access'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  const yearlyDiscount = 0.17; // 17% discount for yearly

  return (
    <>
      <Head>
        <title>Pricing - ProtoThrive</title>
        <meta name="description" content="Simple, transparent pricing for teams of all sizes. Start free and scale as you grow." />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-600 py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Choose the perfect plan for your team. All plans include core features with no hidden fees.
            </p>
            
            {/* Billing Toggle */}
            <div className="inline-flex bg-white/10 backdrop-blur-sm rounded-xl p-1 mb-8">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-gray-900 shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Yearly
                <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto px-4 -mt-10">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`bg-white rounded-3xl shadow-xl border-2 transition-all duration-300 transform hover:-translate-y-2 relative ${
                  plan.popular 
                    ? 'border-blue-500 scale-105 z-10' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${plan.gradient} rounded-2xl flex items-center justify-center`}>
                      {index === 0 && <SparklesIcon className="w-8 h-8 text-white" />}
                      {index === 1 && <RocketLaunchIcon className="w-8 h-8 text-white" />}
                      {index === 2 && <ShieldCheckIcon className="w-8 h-8 text-white" />}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.tagline}</p>
                    
                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-end justify-center">
                        <span className="text-5xl font-bold text-gray-900">
                          ${billingCycle === 'yearly' && plan.price.yearly > 0 
                            ? Math.round(plan.price.yearly / 12) 
                            : plan.price.monthly}
                        </span>
                        <span className="text-gray-500 ml-2 mb-1">
                          {plan.price.monthly === 0 ? '' : '/month'}
                        </span>
                      </div>
                      {billingCycle === 'yearly' && plan.price.yearly > 0 && (
                        <div className="text-sm text-gray-500 mt-1">
                          Billed annually (${plan.price.yearly}/year)
                        </div>
                      )}
                      {billingCycle === 'yearly' && plan.price.monthly > 0 && (
                        <div className="text-sm text-green-600 font-semibold">
                          Save ${Math.round(plan.price.monthly * 12 * yearlyDiscount)} per year
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Link
                    href={plan.name === 'Enterprise' ? '/contact' : '/register'}
                    className={`w-full inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:-translate-y-0.5 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600">
              Everything you need to know about ProtoThrive pricing
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                question: "Can I change plans anytime?",
                answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and we'll prorate the billing."
              },
              {
                question: "What happens to my data if I cancel?",
                answer: "Your data remains accessible for 30 days after cancellation. You can export all your roadmaps and projects during this period."
              },
              {
                question: "Do you offer refunds?",
                answer: "Yes, we offer a 30-day money-back guarantee for all paid plans. No questions asked."
              },
              {
                question: "Is there a free trial?",
                answer: "Our Starter plan is free forever. For paid plans, we offer a 14-day free trial with full access to all features."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of developers building faster with ProtoThrive
            </p>
            <Link 
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-all duration-200 transform hover:-translate-y-1 shadow-2xl"
            >
              Start Free Trial
            </Link>
            <p className="text-white/70 text-sm mt-4">No credit card required • 30-day money-back guarantee</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PricingPage;