/**
 * Beta User Feedback Collection System
 * Contextual feedback collection with sentiment analysis and feature request tracking
 *
 * Ref: CLAUDE.md Phase 4 - Beta Launch Preparation - Feedback System
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface FeedbackData {
  id: string;
  type: 'bug' | 'feature' | 'improvement' | 'general';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  context: {
    page: string;
    userAgent: string;
    timestamp: number;
    userId?: string;
    sessionId: string;
  };
  attachments?: File[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  rating?: number;
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: FeedbackData['type'];
  context?: Partial<FeedbackData['context']>;
}

const BetaFeedback: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  initialType = 'general',
  context
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<FeedbackData>>({
    type: initialType,
    severity: 'medium',
    category: '',
    title: '',
    description: '',
    rating: undefined
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const feedbackTypes = [
    { value: 'bug', label: '🐛 Bug Report', color: 'text-red-400' },
    { value: 'feature', label: '💡 Feature Request', color: 'text-green-400' },
    { value: 'improvement', label: '⚡ Improvement', color: 'text-blue-400' },
    { value: 'general', label: '💬 General Feedback', color: 'text-purple-400' }
  ];

  const severityLevels = [
    { value: 'low', label: 'Low', description: 'Minor issue, doesn\'t impact usage' },
    { value: 'medium', label: 'Medium', description: 'Affects some functionality' },
    { value: 'high', label: 'High', description: 'Major issue, impacts experience' },
    { value: 'critical', label: 'Critical', description: 'Blocks core functionality' }
  ];

  const categories = {
    bug: ['UI/UX', 'Performance', 'Data Loss', 'Authentication', 'Canvas', 'AI Generation'],
    feature: ['Canvas Tools', 'AI Features', 'Collaboration', 'Export/Import', 'Mobile Support', 'Integrations'],
    improvement: ['UI/UX', 'Performance', 'Workflow', 'Documentation', 'Accessibility', 'Mobile Experience'],
    general: ['Overall Experience', 'Documentation', 'Onboarding', 'Performance', 'Design', 'Concept']
  };

  useEffect(() => {
    if (isOpen) {
      setFormData({
        type: initialType,
        severity: 'medium',
        category: '',
        title: '',
        description: '',
        rating: undefined
      });
      setAttachments([]);
      setShowThankYou(false);
    }
  }, [isOpen, initialType]);

  const handleInputChange = (field: keyof FeedbackData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const analyzeSentiment = (text: string): 'positive' | 'neutral' | 'negative' => {
    const positiveWords = ['good', 'great', 'awesome', 'love', 'excellent', 'amazing', 'perfect', 'helpful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'broken', 'useless', 'frustrating', 'slow'];

    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  };

  const submitFeedback = async () => {
    if (!formData.title || !formData.description) return;

    setIsSubmitting(true);

    const feedbackPayload: FeedbackData = {
      id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: formData.type!,
      severity: formData.severity!,
      category: formData.category!,
      title: formData.title!,
      description: formData.description!,
      context: {
        page: context?.page || window.location.pathname,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        userId: user?.id,
        sessionId: context?.sessionId || sessionStorage.getItem('sessionId') || 'anonymous',
        ...context
      },
      sentiment: analyzeSentiment(formData.description!),
      rating: formData.rating,
      attachments
    };

    try {
      // Mock API call - replace with actual endpoint
      console.log('Beta Feedback Submission:', feedbackPayload);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Store locally for beta testing
      const existingFeedback = JSON.parse(localStorage.getItem('betaFeedback') || '[]');
      existingFeedback.push(feedbackPayload);
      localStorage.setItem('betaFeedback', JSON.stringify(existingFeedback));

      setShowThankYou(true);
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900/95 backdrop-blur-md rounded-xl border border-gray-700 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {showThankYou ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">🙏</div>
              <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
              <p className="text-gray-300">
                Your feedback helps make ProtoThrive better for everyone.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="border-b border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📝</span>
                    <div>
                      <h2 className="text-xl font-bold text-white">Beta Feedback</h2>
                      <p className="text-gray-400 text-sm">Help us improve ProtoThrive</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="p-6 space-y-6">
                {/* Feedback Type */}
                <div>
                  <label className="block text-white font-medium mb-3">Feedback Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {feedbackTypes.map(type => (
                      <button
                        key={type.value}
                        onClick={() => handleInputChange('type', type.value)}
                        className={`p-3 rounded-lg border transition-colors ${
                          formData.type === type.value
                            ? 'border-blue-500 bg-blue-500/20'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <span className={type.color}>{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-white font-medium mb-3">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select category...</option>
                    {categories[formData.type as keyof typeof categories]?.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Severity (for bugs) */}
                {formData.type === 'bug' && (
                  <div>
                    <label className="block text-white font-medium mb-3">Severity</label>
                    <div className="grid grid-cols-2 gap-2">
                      {severityLevels.map(level => (
                        <button
                          key={level.value}
                          onClick={() => handleInputChange('severity', level.value)}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            formData.severity === level.value
                              ? 'border-red-500 bg-red-500/20'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          <div className="font-medium text-white">{level.label}</div>
                          <div className="text-sm text-gray-400">{level.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rating (for general feedback) */}
                {formData.type === 'general' && (
                  <div>
                    <label className="block text-white font-medium mb-3">Overall Rating</label>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <button
                          key={rating}
                          onClick={() => handleInputChange('rating', rating)}
                          className={`text-2xl transition-colors ${
                            formData.rating && rating <= formData.rating
                              ? 'text-yellow-400'
                              : 'text-gray-600 hover:text-gray-400'
                          }`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-white font-medium mb-3">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Brief description of your feedback..."
                    className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    maxLength={100}
                  />
                  <div className="text-right text-xs text-gray-400 mt-1">
                    {formData.title?.length || 0}/100
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-white font-medium mb-3">
                    Description
                    {formData.type === 'bug' && (
                      <span className="text-sm font-normal text-gray-400 ml-2">
                        (Include steps to reproduce)
                      </span>
                    )}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder={
                      formData.type === 'bug'
                        ? "1. Go to...\n2. Click on...\n3. Expected: ... \n4. Actual: ..."
                        : "Describe your feedback in detail..."
                    }
                    className="w-full h-32 bg-gray-800 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                    maxLength={1000}
                  />
                  <div className="text-right text-xs text-gray-400 mt-1">
                    {formData.description?.length || 0}/1000
                  </div>
                </div>

                {/* File Attachments */}
                <div>
                  <label className="block text-white font-medium mb-3">
                    Attachments (Screenshots, logs, etc.)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.txt,.log,.json"
                    onChange={handleFileAttachment}
                    className="hidden"
                    id="file-attachment"
                  />
                  <label
                    htmlFor="file-attachment"
                    className="block w-full p-3 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-gray-500 transition-colors"
                  >
                    <span className="text-gray-400">Click to attach files or drag & drop</span>
                  </label>

                  {attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-800 rounded-lg p-2">
                          <span className="text-sm text-gray-300">{file.name}</span>
                          <button
                            onClick={() => removeAttachment(index)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Context Info */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-sm text-gray-400 mb-1">Context Information:</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Page: {context?.page || window.location.pathname}</div>
                    <div>User: {user?.email || 'Anonymous'}</div>
                    <div>Browser: {navigator.userAgent.split(' ')[0]}</div>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-600 rounded-lg text-gray-300 hover:border-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    onClick={submitFeedback}
                    disabled={!formData.title || !formData.description || isSubmitting}
                    whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                    className={`px-8 py-2 rounded-lg font-medium transition-all ${
                      formData.title && formData.description && !isSubmitting
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      'Submit Feedback'
                    )}
                  </motion.button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Quick Feedback Button Component
export const QuickFeedbackButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-colors z-40"
        title="Send Feedback"
      >
        <span className="text-xl">💬</span>
      </motion.button>

      <BetaFeedback
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};

export default BetaFeedback;