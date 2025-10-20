import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { SparklesIcon, RocketLaunchIcon, HeartIcon } from '@heroicons/react/24/outline';

const AboutPage = () => {
  return (
    <>
      <Head>
        <title>About ProtoThrive - Our Mission</title>
        <meta name="description" content="Learn about ProtoThrive's mission to revolutionize software development with AI-powered visual prototyping." />
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
            </Link>
            <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium text-sm">
              Back to Home
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              Building the Future of Development
            </h1>
            <p className="text-xl text-gray-600">
              Empowering developers to ship 60% faster with AI-powered visual prototyping
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <RocketLaunchIcon className="w-7 h-7 text-blue-600" />
              Our Mission
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ProtoThrive was born from a simple observation: developers spend too much time on repetitive tasks
              and not enough time building what matters. We believe AI should augment human creativity, not replace it.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Our platform combines visual roadmap management with 14 specialized AI agents to handle everything
              from planning to deployment, freeing developers to focus on innovation and solving hard problems.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <HeartIcon className="w-7 h-7 text-purple-600" />
              Our Values
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Developer First</h3>
                <p className="text-gray-600">Every feature is designed with developer experience in mind.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Transparency</h3>
                <p className="text-gray-600">Clear pricing, open roadmap, honest communication.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Quality Over Speed</h3>
                <p className="text-gray-600">We ship fast, but never compromise on code quality.</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Join 1,200+ Developers</h2>
            <p className="text-blue-100 mb-6">
              Start building faster today with our 14-day free trial
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-3 bg-white hover:bg-gray-100 text-blue-600 font-bold rounded-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
            >
              Get Started Free
            </Link>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-8 px-4 text-center bg-white border-t border-gray-200">
          <p className="text-sm text-gray-500">
            © 2025 ProtoThrive. All rights reserved.
          </p>
        </footer>
      </div>
    </>
  );
};

export default AboutPage;
