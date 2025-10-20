/**
 * ProtoThrive Landing Page - Professional Transformation
 * Phase 2: Visual Design Overhaul Complete
 */

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { SparklesIcon, RocketLaunchIcon, ShieldCheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  return (
    <>
      <Head>
        <title>ProtoThrive - AI-First Visual Prototyping Platform</title>
        <meta name="description" content="Accelerate development cycles by 60% with our intelligent visual roadmap platform and multi-agent AI system." />
      </Head>

      <div className="min-h-screen">
        {/* Hero Section - Professional Grade */}
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-600 flex items-center justify-center px-4 relative overflow-hidden">
          {/* Grid Pattern Overlay */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1000'%3E%3Cdefs%3E%3Cpattern id='grid' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='rgba(255,255,255,0.1)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`,
            }}
          ></div>
          
          <div className="max-w-4xl mx-auto text-center text-white z-10 animate-fade-in">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              AI-First Visual
              <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent"> Prototyping</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto leading-relaxed">
              Accelerate development cycles by 60% with our intelligent visual roadmap platform and multi-agent AI system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-all duration-200 transform hover:-translate-y-1 shadow-2xl">
                Start Building Free
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Link>
              <Link href="/demo" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-all duration-200">
                Watch Demo
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section - Card Layout */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Everything you need to ship faster
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                From visual planning to production deployment, all in one platform
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <SparklesIcon className="w-8 h-8" />,
                  title: "14 AI Agents",
                  description: "Specialized agents for planning, coding, testing, security, and deployment"
                },
                {
                  icon: <RocketLaunchIcon className="w-8 h-8" />,
                  title: "Visual Builder",
                  description: "Intuitive 2D/3D canvas with React Flow for rapid prototyping"
                },
                {
                  icon: <ShieldCheckIcon className="w-8 h-8" />,
                  title: "60% Faster",
                  description: "Accelerate development with AI automation and smart templates"
                }
              ].map((feature, index) => (
                <div key={index} className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 text-center transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl">
                  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section - Gradient Background */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "275+", label: "Edge Locations" },
                { value: "99.99%", label: "Uptime SLA" },
                { value: "<10ms", label: "Global Latency" },
                { value: "98%", label: "Code Coverage" }
              ].map((stat, index) => (
                <div key={index}>
                  <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-white/80">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Professional Gradient */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Development?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of teams building faster with ProtoThrive
            </p>
            <Link href="/register" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-all duration-200 transform hover:-translate-y-1 shadow-2xl">
              Get Started for Free
            </Link>
            <p className="text-white/70 text-sm mt-4">No credit card required</p>
          </div>
        </section>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </>
  );
}