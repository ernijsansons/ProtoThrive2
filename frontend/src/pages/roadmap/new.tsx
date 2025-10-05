import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  ArrowLeftIcon,
  PlusIcon,
  RectangleGroupIcon,
  CubeTransparentIcon,
  RocketLaunchIcon,
  ShoppingCartIcon,
  BuildingOfficeIcon,
  CpuChipIcon,
  GlobeAltIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  features: string[];
  color: string;
}

export default function NewRoadmap() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [roadmapTitle, setRoadmapTitle] = useState('');
  const [roadmapDescription, setRoadmapDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const templates: Template[] = [
    {
      id: 'blank',
      name: 'Blank Canvas',
      description: 'Start with a clean slate and build your roadmap from scratch',
      icon: RectangleGroupIcon,
      category: 'General',
      features: ['Full customization', 'No predefined structure', 'Maximum flexibility'],
      color: 'from-gray-500 to-gray-600'
    },
    {
      id: 'saas-starter',
      name: 'SaaS Application',
      description: 'Complete template for building a Software as a Service application',
      icon: CubeTransparentIcon,
      category: 'Web Development',
      features: ['Authentication system', 'Subscription management', 'Dashboard layout', 'API structure'],
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'ecommerce',
      name: 'E-Commerce Platform',
      description: 'Build a full-featured online store with payment processing',
      icon: ShoppingCartIcon,
      category: 'Web Development',
      features: ['Product catalog', 'Shopping cart', 'Payment integration', 'Order management'],
      color: 'from-green-500 to-teal-500'
    },
    {
      id: 'startup-mvp',
      name: 'Startup MVP',
      description: 'Rapid prototype for validating your startup idea',
      icon: RocketLaunchIcon,
      category: 'Business',
      features: ['Landing page', 'User onboarding', 'Core features', 'Analytics setup'],
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'enterprise-app',
      name: 'Enterprise Application',
      description: 'Scalable architecture for large-scale business applications',
      icon: BuildingOfficeIcon,
      category: 'Enterprise',
      features: ['Multi-tenant architecture', 'SSO integration', 'Role-based access', 'Audit logging'],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'ai-powered',
      name: 'AI-Powered App',
      description: 'Template with AI/ML integration points and pipelines',
      icon: CpuChipIcon,
      category: 'AI/ML',
      features: ['Model integration', 'Data pipeline', 'Training workflow', 'API endpoints'],
      color: 'from-indigo-500 to-purple-500'
    },
    {
      id: 'api-service',
      name: 'API Service',
      description: 'RESTful or GraphQL API service with documentation',
      icon: GlobeAltIcon,
      category: 'Backend',
      features: ['Endpoint structure', 'Authentication', 'Rate limiting', 'API documentation'],
      color: 'from-yellow-500 to-orange-500'
    },
    {
      id: 'education-platform',
      name: 'Education Platform',
      description: 'Learning management system with courses and content',
      icon: AcademicCapIcon,
      category: 'Education',
      features: ['Course management', 'Student tracking', 'Content delivery', 'Assessment tools'],
      color: 'from-pink-500 to-rose-500'
    }
  ];

  const handleCreateRoadmap = async () => {
    if (!roadmapTitle.trim()) {
      setError('Please enter a title for your roadmap');
      return;
    }

    if (!selectedTemplate) {
      setError('Please select a template to get started');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      // Simulate API call to create roadmap
      const response = await fetch('/api/roadmaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth header if available
        },
        body: JSON.stringify({
          title: roadmapTitle,
          description: roadmapDescription,
          template: selectedTemplate
        })
      });

      if (response.ok) {
        const { id } = await response.json();
        router.push(`/roadmap/${id}`);
      } else {
        throw new Error('Failed to create roadmap');
      }
    } catch (err) {
      // For now, simulate successful creation
      console.log('Creating roadmap:', { title: roadmapTitle, template: selectedTemplate });
      // Generate a mock ID and redirect
      const mockId = Math.random().toString(36).substr(2, 9);
      router.push(`/roadmap/${mockId}`);
    }
  };

  return (
    <>
      <Head>
        <title>Create New Roadmap - ProtoThrive</title>
        <meta name="description" content="Create a new AI-powered development roadmap with ProtoThrive" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
        {/* Header */}
        <header className="border-b border-gray-800">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="inline-flex items-center text-purple-400 hover:text-purple-300">
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>

              <button
                onClick={handleCreateRoadmap}
                disabled={isCreating || !selectedTemplate || !roadmapTitle}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                {isCreating ? 'Creating...' : 'Create Roadmap'}
              </button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Title Section */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                Create New Roadmap
              </h1>
              <p className="text-xl text-gray-400">
                Choose a template and customize your development roadmap
              </p>
            </div>

            {/* Roadmap Details */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Roadmap Details</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={roadmapTitle}
                    onChange={(e) => setRoadmapTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="My Awesome Project"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    value={roadmapDescription}
                    onChange={(e) => setRoadmapDescription(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="Describe your project goals and objectives..."
                    rows={3}
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
                  {error}
                </div>
              )}
            </div>

            {/* Template Selection */}
            <div>
              <h2 className="text-2xl font-semibold mb-6">Choose a Template</h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => {
                  const Icon = template.icon;
                  const isSelected = selectedTemplate === template.id;

                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`text-left p-6 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'bg-purple-600/20 border-purple-500'
                          : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${template.color} p-2 mb-4`}>
                        <Icon className="w-full h-full text-white" />
                      </div>

                      <h3 className="text-lg font-semibold mb-1">{template.name}</h3>
                      <p className="text-sm text-gray-400 mb-1">{template.category}</p>
                      <p className="text-sm text-gray-300 mb-3">{template.description}</p>

                      <div className="space-y-1">
                        {template.features.slice(0, 3).map((feature, index) => (
                          <div key={index} className="flex items-center text-xs text-gray-400">
                            <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                            {feature}
                          </div>
                        ))}
                      </div>

                      {isSelected && (
                        <div className="mt-4 text-sm text-purple-400 font-medium">
                          Selected
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex items-center justify-between">
              <Link href="/dashboard" className="text-gray-400 hover:text-white transition">
                Cancel
              </Link>

              <button
                onClick={handleCreateRoadmap}
                disabled={isCreating || !selectedTemplate || !roadmapTitle}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                {isCreating ? 'Creating Roadmap...' : 'Create Roadmap'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}