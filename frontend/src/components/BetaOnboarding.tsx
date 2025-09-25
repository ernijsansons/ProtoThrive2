/**
 * Beta User Onboarding Flow
 * Guides beta testers through ProtoThrive setup with progressive disclosure
 *
 * Ref: CLAUDE.md Phase 4 - Beta Launch Preparation - User Onboarding
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<OnboardingStepProps>;
  completed?: boolean;
}

interface OnboardingStepProps {
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
}

// Step Components
const WelcomeStep: React.FC<OnboardingStepProps> = ({ onNext, isFirst }) => {
  const { user } = useAuth();

  return (
    <div className="text-center space-y-6">
      <div className="text-6xl mb-4">🚀</div>
      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
        Welcome to ProtoThrive Beta!
      </h1>
      <p className="text-xl text-gray-300 max-w-2xl mx-auto">
        You're one of the first to experience the future of development roadmapping.
        Let's get you set up in just 3 minutes.
      </p>
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 max-w-md mx-auto">
        <p className="text-sm text-gray-400">Beta Tester</p>
        <p className="font-semibold text-white">{user?.email || 'developer@protothrive.com'}</p>
      </div>
      <motion.button
        onClick={onNext}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all"
      >
        Let's Begin →
      </motion.button>
    </div>
  );
};

const PreferencesStep: React.FC<OnboardingStepProps> = ({ onNext, onBack }) => {
  const [preferences, setPreferences] = useState({
    projectType: 'web_platform',
    experienceLevel: 'intermediate',
    aiAssistance: true,
    notifications: true
  });

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    localStorage.setItem('betaPreferences', JSON.stringify(preferences));
    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Customize Your Experience</h2>
        <p className="text-gray-300">Tell us about your development preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Type */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Primary Project Type</h3>
          <div className="space-y-2">
            {[
              { value: 'web_platform', label: 'Web Platform', icon: '🌐' },
              { value: 'mobile_app', label: 'Mobile App', icon: '📱' },
              { value: 'api_service', label: 'API Service', icon: '🔧' },
              { value: 'saas_mvp', label: 'SaaS MVP', icon: '💼' }
            ].map(option => (
              <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="projectType"
                  value={option.value}
                  checked={preferences.projectType === option.value}
                  onChange={(e) => handlePreferenceChange('projectType', e.target.value)}
                  className="text-blue-500"
                />
                <span className="text-2xl">{option.icon}</span>
                <span className="text-white">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Experience Level */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Experience Level</h3>
          <div className="space-y-2">
            {[
              { value: 'beginner', label: 'New to Development', icon: '🌱' },
              { value: 'intermediate', label: 'Some Experience', icon: '🚀' },
              { value: 'expert', label: 'Seasoned Developer', icon: '⚡' }
            ].map(option => (
              <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="experienceLevel"
                  value={option.value}
                  checked={preferences.experienceLevel === option.value}
                  onChange={(e) => handlePreferenceChange('experienceLevel', e.target.value)}
                  className="text-blue-500"
                />
                <span className="text-2xl">{option.icon}</span>
                <span className="text-white">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* AI Assistance */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">AI Features</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <span className="text-white block">AI Roadmap Generation</span>
                  <span className="text-gray-400 text-sm">Auto-generate project steps</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.aiAssistance}
                onChange={(e) => handlePreferenceChange('aiAssistance', e.target.checked)}
                className="text-blue-500"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📧</span>
                <div>
                  <span className="text-white block">Beta Updates</span>
                  <span className="text-gray-400 text-sm">Get notified of new features</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.notifications}
                onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                className="text-blue-500"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <motion.button
          onClick={onBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-2 border border-gray-600 rounded-lg text-gray-300 hover:border-gray-500 transition-colors"
        >
          ← Back
        </motion.button>
        <motion.button
          onClick={handleNext}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold text-white shadow-lg"
        >
          Save Preferences →
        </motion.button>
      </div>
    </div>
  );
};

const FirstRoadmapStep: React.FC<OnboardingStepProps> = ({ onNext, onBack, isLast }) => {
  const [vision, setVision] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const store = useStore();

  const handleGenerate = async () => {
    if (!vision.trim()) return;

    setIsGenerating(true);
    try {
      // await generateRoadmap(vision, 'web_platform', true);
      setTimeout(() => {
        setIsGenerating(false);
        onNext();
      }, 2000);
    } catch (error) {
      setIsGenerating(false);
      console.error('Demo roadmap generation failed:', error);
    }
  };

  const sampleVisions = [
    "Build a task management web app with team collaboration",
    "Create a personal finance tracker with budget insights",
    "Develop an e-commerce store with payment integration",
    "Build a social media platform for developers"
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Create Your First Roadmap</h2>
        <p className="text-gray-300">Describe your project idea and watch the magic happen</p>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-6">
        <label className="block text-white font-semibold mb-3">Project Vision</label>
        <textarea
          value={vision}
          onChange={(e) => setVision(e.target.value)}
          placeholder="Describe your project idea in a few sentences..."
          className="w-full h-32 bg-gray-700 text-white rounded-lg p-4 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
          disabled={isGenerating}
        />

        {/* Sample Ideas */}
        <div className="mt-4">
          <p className="text-gray-400 text-sm mb-2">Need inspiration? Try one of these:</p>
          <div className="grid grid-cols-1 gap-2">
            {sampleVisions.map((sample, index) => (
              <button
                key={index}
                onClick={() => setVision(sample)}
                className="text-left p-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                disabled={isGenerating}
              >
                "{sample}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {isGenerating && (
        <div className="text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-blue-400">Generating your roadmap...</span>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-6">
        <motion.button
          onClick={onBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-2 border border-gray-600 rounded-lg text-gray-300 hover:border-gray-500 transition-colors"
          disabled={isGenerating}
        >
          ← Back
        </motion.button>
        <motion.button
          onClick={handleGenerate}
          disabled={!vision.trim() || isGenerating}
          whileHover={{ scale: !vision.trim() || isGenerating ? 1 : 1.05 }}
          whileTap={{ scale: !vision.trim() || isGenerating ? 1 : 0.95 }}
          className={`px-8 py-3 rounded-lg font-semibold shadow-lg transition-all ${
            vision.trim() && !isGenerating
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-xl'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLast ? 'Complete Setup 🎉' : 'Generate Roadmap →'}
        </motion.button>
      </div>
    </div>
  );
};

const BetaOnboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome',
      description: 'Welcome to ProtoThrive Beta',
      component: WelcomeStep
    },
    {
      id: 'preferences',
      title: 'Preferences',
      description: 'Set your preferences',
      component: PreferencesStep
    },
    {
      id: 'first-roadmap',
      title: 'First Roadmap',
      description: 'Create your first roadmap',
      component: FirstRoadmapStep
    }
  ];

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('betaOnboardingCompleted');
    if (!hasCompletedOnboarding) {
      setIsVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete onboarding
      localStorage.setItem('betaOnboardingCompleted', 'true');
      setIsVisible(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('betaOnboardingCompleted', 'true');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gray-900/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900/90 backdrop-blur-md rounded-2xl border border-gray-700 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="border-b border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="text-2xl">🧪</div>
                <div>
                  <h1 className="text-xl font-bold text-white">Beta Setup</h1>
                  <p className="text-gray-400 text-sm">Step {currentStep + 1} of {steps.length}</p>
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
              >
                Skip Setup
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CurrentStepComponent
                  onNext={handleNext}
                  onBack={handleBack}
                  isFirst={currentStep === 0}
                  isLast={currentStep === steps.length - 1}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BetaOnboarding;