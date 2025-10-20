import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  PaintBrushIcon,
  RocketLaunchIcon,
  CursorArrowRippleIcon,
  EyeIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  targetSelector?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    type: 'click' | 'hover' | 'wait';
    duration?: number;
    element?: string;
  };
  content?: React.ReactNode;
}

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  steps?: OnboardingStep[];
}

const defaultSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to ProtoThrive! 🎉',
    description: 'Let\'s take a quick tour to get you started with AI-powered prototyping.',
    icon: SparklesIcon,
    position: 'center',
    content: (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
          <SparklesIcon className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-600">
          This interactive tutorial will show you the key features in just 3 minutes.
        </p>
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
          <span className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            3 min tutorial
          </span>
          <span className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Interactive guide
          </span>
        </div>
      </div>
    )
  },
  {
    id: 'canvas',
    title: 'Your Magic Canvas',
    description: 'This is where the magic happens! Create, edit, and visualize your prototypes in 2D or 3D.',
    icon: PaintBrushIcon,
    targetSelector: '[data-tutorial="canvas"]',
    position: 'right',
    action: {
      type: 'hover',
      element: '[data-tutorial="canvas"]'
    }
  },
  {
    id: 'mode-toggle',
    title: 'Switch Between Views',
    description: 'Toggle between 2D and 3D modes to get different perspectives on your project.',
    icon: EyeIcon,
    targetSelector: '[data-tutorial="mode-toggle"]',
    position: 'bottom',
    action: {
      type: 'click',
      element: '[data-tutorial="mode-toggle"]'
    }
  },
  {
    id: 'sidebar',
    title: 'Templates & Tools',
    description: 'Browse templates, manage your projects, and access powerful tools from the sidebar.',
    icon: Cog6ToothIcon,
    targetSelector: '[data-tutorial="sidebar"]',
    position: 'right',
    action: {
      type: 'hover',
      element: '[data-tutorial="sidebar"]'
    }
  },
  {
    id: 'insights',
    title: 'AI Insights Panel',
    description: 'Get real-time feedback, analytics, and AI-powered suggestions for your prototypes.',
    icon: CursorArrowRippleIcon,
    targetSelector: '[data-tutorial="insights"]',
    position: 'left',
    action: {
      type: 'hover',
      element: '[data-tutorial="insights"]'
    }
  },
  {
    id: 'complete',
    title: 'You\'re all set! 🚀',
    description: 'Ready to start building? Create your first prototype and let AI assist you every step of the way.',
    icon: RocketLaunchIcon,
    position: 'center',
    content: (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto">
          <RocketLaunchIcon className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-600">
          You now know the basics! Start with a template or create a new project from scratch.
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="font-semibold text-blue-900">💡 Pro Tip</div>
            <div className="text-blue-700">Use keyboard shortcuts for faster navigation</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="font-semibold text-purple-900">✨ AI Helper</div>
            <div className="text-purple-700">Ask AI for design suggestions anytime</div>
          </div>
        </div>
      </div>
    )
  }
];

const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  isOpen,
  onClose,
  onComplete,
  steps = defaultSteps
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [highlightElement, setHighlightElement] = useState<Element | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Handle opening/closing
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setCurrentStep(0);
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      document.body.style.overflow = '';
      setHighlightElement(null);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle step changes and element highlighting
  useEffect(() => {
    if (!isVisible || !currentStepData) return;

    // Clear previous highlight
    setHighlightElement(null);

    // If step has a target selector, find and highlight the element
    if (currentStepData.targetSelector) {
      const timer = setTimeout(() => {
        const element = document.querySelector(currentStepData.targetSelector!);
        if (element) {
          setHighlightElement(element);
          calculateTooltipPosition(element);

          // Scroll element into view if needed
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          });
        }
      }, 300); // Delay to allow for animations

      return () => clearTimeout(timer);
    }
  }, [currentStep, isVisible, currentStepData]);

  const calculateTooltipPosition = (element: Element) => {
    const rect = element.getBoundingClientRect();
    const position = currentStepData.position;

    let x = 0;
    let y = 0;

    switch (position) {
      case 'top':
        x = rect.left + rect.width / 2;
        y = rect.top - 20;
        break;
      case 'bottom':
        x = rect.left + rect.width / 2;
        y = rect.bottom + 20;
        break;
      case 'left':
        x = rect.left - 20;
        y = rect.top + rect.height / 2;
        break;
      case 'right':
        x = rect.right + 20;
        y = rect.top + rect.height / 2;
        break;
      case 'center':
        x = window.innerWidth / 2;
        y = window.innerHeight / 2;
        break;
    }

    setTooltipPosition({ x, y });
  };

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  const getHighlightStyle = () => {
    if (!highlightElement) return {};

    const rect = highlightElement.getBoundingClientRect();
    return {
      top: rect.top - 8,
      left: rect.left - 8,
      width: rect.width + 16,
      height: rect.height + 16,
    };
  };

  const getTooltipStyle = () => {
    const { x, y } = tooltipPosition;
    const position = currentStepData.position;

    let transform = '';
    switch (position) {
      case 'top':
        transform = 'translate(-50%, -100%)';
        break;
      case 'bottom':
        transform = 'translate(-50%, 0%)';
        break;
      case 'left':
        transform = 'translate(-100%, -50%)';
        break;
      case 'right':
        transform = 'translate(0%, -50%)';
        break;
      case 'center':
        transform = 'translate(-50%, -50%)';
        break;
    }

    return {
      left: x,
      top: y,
      transform,
    };
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm"
        style={{ margin: 0 }}
      >
        {/* Highlight overlay */}
        {highlightElement && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute border-4 border-blue-500 rounded-lg shadow-lg"
            style={{
              ...getHighlightStyle(),
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.5)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          className="absolute bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full mx-4"
          style={getTooltipStyle()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          <div className="p-6">
            {/* Header */}
            <div className="flex items-start mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <currentStepData.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {currentStepData.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {currentStepData.description}
                </p>
              </div>
            </div>

            {/* Custom content */}
            {currentStepData.content && (
              <div className="mb-6">
                {currentStepData.content}
              </div>
            )}

            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Step {currentStep + 1} of {steps.length}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(((currentStep + 1) / steps.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                {!isFirstStep && (
                  <motion.button
                    onClick={handlePrevious}
                    className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ChevronLeftIcon className="w-4 h-4 mr-1" />
                    Back
                  </motion.button>
                )}

                <motion.button
                  onClick={handleSkip}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Skip Tour
                </motion.button>
              </div>

              <motion.button
                onClick={handleNext}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isLastStep ? 'Get Started' : 'Next'}
                {!isLastStep && <ChevronRightIcon className="w-4 h-4 ml-1" />}
                {isLastStep && <RocketLaunchIcon className="w-4 h-4 ml-1" />}
              </motion.button>
            </div>
          </div>

          {/* Pointer arrow for non-center positions */}
          {currentStepData.position !== 'center' && (
            <div
              className={`absolute w-3 h-3 bg-white border transform rotate-45 ${
                currentStepData.position === 'top'
                  ? 'bottom-[-7px] left-1/2 -translate-x-1/2 border-b border-r border-gray-200'
                  : currentStepData.position === 'bottom'
                  ? 'top-[-7px] left-1/2 -translate-x-1/2 border-t border-l border-gray-200'
                  : currentStepData.position === 'left'
                  ? 'right-[-7px] top-1/2 -translate-y-1/2 border-t border-r border-gray-200'
                  : 'left-[-7px] top-1/2 -translate-y-1/2 border-b border-l border-gray-200'
              }`}
            />
          )}
        </motion.div>

        {/* Step indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {steps.map((_, index) => (
            <motion.div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index <= currentStep ? 'bg-white' : 'bg-white/30'
              }`}
              animate={{ scale: index === currentStep ? 1.2 : 1 }}
            />
          ))}
        </div>

        {/* Keyboard hints */}
        <div className="absolute bottom-8 right-8 text-white/70 text-sm space-y-1">
          <div className="flex items-center">
            <kbd className="px-2 py-1 bg-white/20 rounded text-xs mr-2">←</kbd>
            <span>Previous</span>
          </div>
          <div className="flex items-center">
            <kbd className="px-2 py-1 bg-white/20 rounded text-xs mr-2">→</kbd>
            <span>Next</span>
          </div>
          <div className="flex items-center">
            <kbd className="px-2 py-1 bg-white/20 rounded text-xs mr-2">Esc</kbd>
            <span>Skip</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Keyboard navigation hook
export const useOnboardingKeyboard = (
  isOpen: boolean,
  onNext: () => void,
  onPrevious: () => void,
  onClose: () => void
) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowRight':
        case ' ':
          event.preventDefault();
          onNext();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          onPrevious();
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onNext, onPrevious, onClose]);
};

export default OnboardingTutorial;