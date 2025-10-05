import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import {
  BookOpenIcon,
  CodeBracketIcon,
  RocketLaunchIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  CubeTransparentIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  PlayIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function Docs() {
  const [searchQuery, setSearchQuery] = useState('');

  const documentationSections = [
    {
      title: 'Getting Started',
      icon: RocketLaunchIcon,
      description: 'Quick start guide to get you up and running with ProtoThrive',
      links: [
        { label: 'Installation', href: '#installation' },
        { label: 'First Roadmap', href: '#first-roadmap' },
        { label: 'Basic Concepts', href: '#concepts' }
      ],
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'API Reference',
      icon: CodeBracketIcon,
      description: 'Complete API documentation with examples and code snippets',
      links: [
        { label: 'Authentication', href: '#api-auth' },
        { label: 'Roadmap Endpoints', href: '#api-roadmaps' },
        { label: 'AI Agents', href: '#api-agents' }
      ],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'AI Agents',
      icon: CpuChipIcon,
      description: 'Learn about our 14 specialized AI development agents',
      links: [
        { label: 'Agent Overview', href: '#agents-overview' },
        { label: 'Orchestration', href: '#orchestration' },
        { label: 'Custom Agents', href: '#custom-agents' }
      ],
      color: 'from-green-500 to-teal-500'
    },
    {
      title: 'Visual Roadmaps',
      icon: CubeTransparentIcon,
      description: 'Master the visual roadmap builder and 3D capabilities',
      links: [
        { label: 'Canvas Controls', href: '#canvas' },
        { label: 'Node Types', href: '#nodes' },
        { label: 'Templates', href: '#templates' }
      ],
      color: 'from-orange-500 to-red-500'
    },
    {
      title: 'Security & Compliance',
      icon: ShieldCheckIcon,
      description: 'Security best practices and compliance documentation',
      links: [
        { label: 'Security Overview', href: '#security' },
        { label: 'OWASP Compliance', href: '#owasp' },
        { label: 'Data Protection', href: '#data-protection' }
      ],
      color: 'from-indigo-500 to-purple-500'
    },
    {
      title: 'Tutorials',
      icon: AcademicCapIcon,
      description: 'Step-by-step tutorials for common use cases',
      links: [
        { label: 'Build a SaaS App', href: '#tutorial-saas' },
        { label: 'Deploy to Production', href: '#tutorial-deploy' },
        { label: 'Team Collaboration', href: '#tutorial-team' }
      ],
      color: 'from-pink-500 to-rose-500'
    }
  ];

  const quickStartSteps = [
    {
      step: 1,
      title: 'Create Your Account',
      description: 'Sign up for a free ProtoThrive account to get started',
      code: '// No code required - just visit protothrive.com/register'
    },
    {
      step: 2,
      title: 'Install CLI Tools',
      description: 'Install the ProtoThrive CLI for local development',
      code: 'npm install -g @protothrive/cli'
    },
    {
      step: 3,
      title: 'Create Your First Project',
      description: 'Initialize a new ProtoThrive project',
      code: 'protothrive init my-project\ncd my-project\nprotothrive dev'
    },
    {
      step: 4,
      title: 'Build Your Roadmap',
      description: 'Open the visual builder and start creating',
      code: '// Access the builder at http://localhost:3000/roadmap/new'
    }
  ];

  const apiExamples = [
    {
      title: 'Authentication',
      description: 'Authenticate and get an access token',
      code: `const response = await fetch('https://api.protothrive.com/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'your_password'
  })
});

const { token } = await response.json();`
    },
    {
      title: 'Create Roadmap',
      description: 'Create a new roadmap programmatically',
      code: `const roadmap = await fetch('https://api.protothrive.com/roadmaps', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${token}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'My New Project',
    description: 'AI-powered development roadmap',
    template: 'saas-starter'
  })
});`
    }
  ];

  const filteredSections = documentationSections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Documentation - ProtoThrive</title>
        <meta name="description" content="ProtoThrive Documentation - API reference, guides, tutorials, and resources for the AI-powered development platform." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
        {/* Header */}
        <header className="border-b border-gray-800">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <Link href="/" className="inline-flex items-center text-purple-400 hover:text-purple-300">
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Home
              </Link>

              <div className="flex items-center gap-4">
                <Link href="/roadmap/new" className="text-gray-400 hover:text-white transition">
                  Start Building
                </Link>
                <Link href="/dashboard" className="text-gray-400 hover:text-white transition">
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Documentation
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Everything you need to build with ProtoThrive's AI-powered development platform
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search documentation..."
                className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Quick Start Guide */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <PlayIcon className="w-8 h-8 mr-3 text-purple-500" />
            Quick Start Guide
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {quickStartSteps.map((step) => (
              <div key={step.step} className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <div className="flex items-start mb-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">
                    {step.step}
                  </span>
                  <div className="ml-4 flex-1">
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-gray-400 mb-4">{step.description}</p>
                    <pre className="bg-black/50 border border-gray-700 rounded p-3 text-sm overflow-x-auto">
                      <code className="text-green-400">{step.code}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Documentation Sections Grid */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <BookOpenIcon className="w-8 h-8 mr-3 text-purple-500" />
            Documentation Sections
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.title} className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-purple-500 transition group">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${section.color} p-2 mb-4`}>
                    <Icon className="w-full h-full text-white" />
                  </div>

                  <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-400 transition">
                    {section.title}
                  </h3>
                  <p className="text-gray-400 mb-4">{section.description}</p>

                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <Link href={link.href} className="text-purple-400 hover:text-purple-300 flex items-center">
                          <ArrowRightIcon className="w-4 h-4 mr-2" />
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* API Examples */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <CodeBracketIcon className="w-8 h-8 mr-3 text-purple-500" />
            API Examples
          </h2>

          <div className="grid lg:grid-cols-2 gap-6">
            {apiExamples.map((example) => (
              <div key={example.title} className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-2">{example.title}</h3>
                <p className="text-gray-400 mb-4">{example.description}</p>
                <pre className="bg-black/50 border border-gray-700 rounded p-4 overflow-x-auto">
                  <code className="text-green-400 text-sm">{example.code}</code>
                </pre>
              </div>
            ))}
          </div>
        </section>

        {/* Resources Section */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <DocumentTextIcon className="w-8 h-8 mr-3 text-purple-500" />
            Additional Resources
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <Link href="https://github.com/protothrive" className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-purple-500 transition">
              <h3 className="text-xl font-semibold mb-2">GitHub Repository</h3>
              <p className="text-gray-400">Access our open-source components and contribute to the platform</p>
            </Link>

            <Link href="#video-tutorials" className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-purple-500 transition">
              <h3 className="text-xl font-semibold mb-2">Video Tutorials</h3>
              <p className="text-gray-400">Watch step-by-step video guides for common workflows</p>
            </Link>

            <Link href="#community" className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-purple-500 transition">
              <h3 className="text-xl font-semibold mb-2">Community Forum</h3>
              <p className="text-gray-400">Join our community to ask questions and share knowledge</p>
            </Link>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Build?</h2>
            <p className="text-xl mb-6">Start creating your first AI-powered roadmap today</p>
            <Link href="/roadmap/new" className="inline-flex items-center px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition">
              Get Started
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}