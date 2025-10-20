import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import {
  AcademicCapIcon,
  EyeIcon,
  SwatchIcon,
  CpuChipIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  PaintBrushIcon,
  SparklesIcon,
  LightBulbIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
  BeakerIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface DesignPrinciple {
  id: string;
  name: string;
  description: string;
  category: 'layout' | 'color' | 'typography' | 'spacing' | 'accessibility' | 'interaction' | 'design';
  importance: 'low' | 'medium' | 'high' | 'critical';
  examples: string[];
  checkFunction: (element: HTMLElement) => boolean;
}

interface UIAnalysis {
  id: string;
  element: string;
  issues: UIIssue[];
  suggestions: UISuggestion[];
  score: number;
  timestamp: Date;
}

interface UIIssue {
  id: string;
  type: 'accessibility' | 'usability' | 'design' | 'performance' | 'responsive';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  element?: string;
  fix?: {
    description: string;
    code?: string;
    action?: () => void;
  };
}

interface UISuggestion {
  id: string;
  category: 'improvement' | 'optimization' | 'enhancement' | 'best_practice';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  preview?: string;
  implementation?: {
    description: string;
    code?: string;
    action?: () => void;
  };
}

interface CoachingSession {
  id: string;
  topic: string;
  duration: number;
  startTime: Date;
  interactions: number;
  completed: boolean;
  score?: number;
}

interface AdaptiveUICoachProps {
  className?: string;
  enableRealTimeAnalysis?: boolean;
  enableAutoSuggestions?: boolean;
  enableAccessibilityCheck?: boolean;
  enableResponsiveAnalysis?: boolean;
  coachingMode?: 'passive' | 'active' | 'proactive';
  expertiseLevel?: 'beginner' | 'intermediate' | 'advanced';
  focusAreas?: string[];
}

const AdaptiveUICoach: React.FC<AdaptiveUICoachProps> = ({
  className = '',
  enableRealTimeAnalysis = true,
  enableAutoSuggestions = true,
  enableAccessibilityCheck = true,
  enableResponsiveAnalysis = true,
  coachingMode = 'active',
  expertiseLevel = 'intermediate',
  focusAreas = ['accessibility', 'usability', 'design']
}) => {
  const { nodes, edges, mode, updateMetrics } = useStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'suggestions' | 'coaching' | 'principles'>('analysis');
  const [currentAnalysis, setCurrentAnalysis] = useState<UIAnalysis | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<UIAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [coachingSession, setCoachingSession] = useState<CoachingSession | null>(null);
  const [designPrinciples] = useState<DesignPrinciple[]>([
    {
      id: 'contrast',
      name: 'Color Contrast',
      description: 'Ensure sufficient contrast between text and background colors',
      category: 'accessibility',
      importance: 'critical',
      examples: ['Use WCAG AA compliant contrast ratios (4.5:1 for normal text)', 'Test with color blindness simulators'],
      checkFunction: (element) => {
        const styles = getComputedStyle(element);
        // Simplified contrast check
        return styles.color !== styles.backgroundColor;
      }
    },
    {
      id: 'spacing',
      name: 'Consistent Spacing',
      description: 'Use consistent spacing patterns throughout the interface',
      category: 'layout',
      importance: 'high',
      examples: ['Use 8pt grid system', 'Maintain consistent margins and padding'],
      checkFunction: (element) => {
        // Simplified spacing check
        return true; // Would implement proper spacing analysis
      }
    },
    {
      id: 'touch-targets',
      name: 'Touch Target Size',
      description: 'Ensure interactive elements are large enough for touch interaction',
      category: 'accessibility',
      importance: 'high',
      examples: ['Minimum 44x44px for touch targets', 'Adequate spacing between clickable elements'],
      checkFunction: (element) => {
        const rect = element.getBoundingClientRect();
        return rect.width >= 44 && rect.height >= 44;
      }
    },
    {
      id: 'hierarchy',
      name: 'Visual Hierarchy',
      description: 'Create clear visual hierarchy to guide user attention',
      category: 'design',
      importance: 'high',
      examples: ['Use size, color, and spacing to create hierarchy', 'Limit to 3-4 levels of hierarchy'],
      checkFunction: (element) => {
        // Would implement hierarchy analysis
        return true;
      }
    }
  ]);

  const analysisIntervalRef = useRef<NodeJS.Timeout>();
  const observerRef = useRef<MutationObserver>();

  // Initialize real-time analysis
  useEffect(() => {
    if (enableRealTimeAnalysis) {
      // Set up periodic analysis
      analysisIntervalRef.current = setInterval(() => {
        if (coachingMode === 'proactive') {
          runUIAnalysis();
        }
      }, 10000); // Every 10 seconds

      // Set up DOM mutation observer
      observerRef.current = new MutationObserver((mutations) => {
        if (mutations.length > 0 && enableAutoSuggestions) {
          debounceAnalysis();
        }
      });

      observerRef.current.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });

      return () => {
        if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
        if (observerRef.current) observerRef.current.disconnect();
      };
    }
  }, [enableRealTimeAnalysis, coachingMode, enableAutoSuggestions]);

  // Debounced analysis function
  const debounceAnalysis = useCallback(() => {
    clearTimeout(analysisIntervalRef.current);
    analysisIntervalRef.current = setTimeout(() => {
      runUIAnalysis();
    }, 2000);
  }, []);

  // Run comprehensive UI analysis
  const runUIAnalysis = useCallback(async () => {
    if (isAnalyzing) return;

    setIsAnalyzing(true);

    try {
      // Simulate analysis delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const analysis = await analyzeCurrentUI();
      setCurrentAnalysis(analysis);
      setAnalysisHistory(prev => [analysis, ...prev.slice(0, 9)]); // Keep last 10

      // Update metrics with available metric
      updateMetrics({
        agentActivity: Math.round(analysis.score * 100)
      });
    } catch (error) {
      console.error('UI Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, updateMetrics]);

  // Analyze current UI state
  const analyzeCurrentUI = async (): Promise<UIAnalysis> => {
    const issues: UIIssue[] = [];
    const suggestions: UISuggestion[] = [];

    // Accessibility Analysis
    if (enableAccessibilityCheck) {
      // Simulate accessibility checks
      if (Math.random() > 0.7) {
        issues.push({
          id: `a11y_${Date.now()}`,
          type: 'accessibility',
          severity: 'high',
          title: 'Missing Alt Text',
          description: 'Some images are missing alternative text for screen readers.',
          element: 'img[src]',
          fix: {
            description: 'Add descriptive alt attributes to all images',
            code: '<img src="image.jpg" alt="Descriptive text about the image" />',
            action: () => {
              console.log('Highlighting images without alt text');
            }
          }
        });
      }

      if (Math.random() > 0.6) {
        issues.push({
          id: `contrast_${Date.now()}`,
          type: 'accessibility',
          severity: 'medium',
          title: 'Low Color Contrast',
          description: 'Some text elements may not meet WCAG contrast requirements.',
          element: '.text-muted',
          fix: {
            description: 'Increase contrast ratio to at least 4.5:1 for normal text',
            action: () => {
              console.log('Highlighting low contrast elements');
            }
          }
        });
      }
    }

    // Design Analysis
    if (focusAreas.includes('design')) {
      if (Math.random() > 0.5) {
        suggestions.push({
          id: `design_${Date.now()}`,
          category: 'improvement',
          title: 'Enhance Visual Hierarchy',
          description: 'Consider using more distinct font sizes to improve content hierarchy.',
          impact: 'medium',
          effort: 'low',
          implementation: {
            description: 'Apply progressive font scaling based on content importance',
            code: `
.heading-primary { font-size: 2rem; }
.heading-secondary { font-size: 1.5rem; }
.heading-tertiary { font-size: 1.25rem; }
            `
          }
        });
      }

      if (Math.random() > 0.6) {
        suggestions.push({
          id: `spacing_${Date.now()}`,
          category: 'best_practice',
          title: 'Implement Consistent Spacing',
          description: 'Use a consistent spacing system for better visual rhythm.',
          impact: 'high',
          effort: 'medium',
          implementation: {
            description: 'Adopt an 8pt grid system for all spacing decisions',
            code: `
/* Base spacing unit */
--spacing-unit: 8px;
--spacing-xs: calc(var(--spacing-unit) * 1);  /* 8px */
--spacing-sm: calc(var(--spacing-unit) * 2);  /* 16px */
--spacing-md: calc(var(--spacing-unit) * 3);  /* 24px */
--spacing-lg: calc(var(--spacing-unit) * 4);  /* 32px */
            `
          }
        });
      }
    }

    // Responsive Analysis
    if (enableResponsiveAnalysis) {
      if (Math.random() > 0.7) {
        issues.push({
          id: `responsive_${Date.now()}`,
          type: 'responsive',
          severity: 'medium',
          title: 'Mobile Optimization',
          description: 'Some elements may not be optimized for mobile devices.',
          fix: {
            description: 'Implement responsive breakpoints and mobile-first design',
            code: `
@media (max-width: 768px) {
  .container { padding: 1rem; }
  .text-lg { font-size: 1rem; }
}
            `
          }
        });
      }
    }

    // Performance suggestions
    if (Math.random() > 0.8) {
      suggestions.push({
        id: `performance_${Date.now()}`,
        category: 'optimization',
        title: 'Optimize Animation Performance',
        description: 'Consider using transform and opacity for smoother animations.',
        impact: 'medium',
        effort: 'low',
        implementation: {
          description: 'Use GPU-accelerated properties for animations',
          code: `
/* Instead of animating width/height */
.slow { transition: width 0.3s ease; }

/* Use transform for better performance */
.fast { transition: transform 0.3s ease; }
          `
        }
      });
    }

    // Calculate overall UI score
    const totalIssues = issues.length;
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;

    const score = Math.max(0, 100 - (criticalIssues * 25) - (highIssues * 15) - (totalIssues * 5));

    return {
      id: `analysis_${Date.now()}`,
      element: 'document',
      issues,
      suggestions,
      score: score / 100,
      timestamp: new Date()
    };
  };

  // Start coaching session
  const startCoachingSession = (topic: string) => {
    const session: CoachingSession = {
      id: `session_${Date.now()}`,
      topic,
      duration: 0,
      startTime: new Date(),
      interactions: 0,
      completed: false
    };

    setCoachingSession(session);
    console.log(`Starting coaching session: ${topic}`);
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'neon-pink';
      case 'high': return 'neon-orange';
      case 'medium': return 'neon-blue-primary';
      case 'low': return 'neon-green-primary';
      default: return 'text-muted';
    }
  };

  // Get impact color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'neon-green-primary';
      case 'medium': return 'neon-blue-primary';
      case 'low': return 'neon-purple';
      default: return 'text-muted';
    }
  };

  const renderAnalysisTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-neon-blue-primary">UI Analysis</h3>
        <motion.button
          onClick={runUIAnalysis}
          disabled={isAnalyzing}
          className="px-3 py-1 bg-neon-blue-primary/20 text-neon-blue-primary rounded-lg text-xs hover:bg-neon-blue-primary/30 transition-colors disabled:opacity-50"
          whileTap={{ scale: 0.95 }}
        >
          {isAnalyzing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <ArrowPathIcon className="w-4 h-4" />
            </motion.div>
          ) : (
            'Analyze'
          )}
        </motion.button>
      </div>

      {currentAnalysis ? (
        <div className="space-y-4">
          {/* Overall Score */}
          <div className="p-3 rounded-lg bg-dark-tertiary/30 border border-neon-green-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary">UI Quality Score</span>
              <span className={`text-lg font-bold text-${
                currentAnalysis.score > 0.8 ? 'neon-green-primary' :
                currentAnalysis.score > 0.6 ? 'neon-blue-primary' :
                currentAnalysis.score > 0.4 ? 'neon-orange' : 'neon-pink'
              }`}>
                {Math.round(currentAnalysis.score * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-dark-tertiary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${currentAnalysis.score * 100}%` }}
                className={`h-full bg-gradient-to-r ${
                  currentAnalysis.score > 0.8 ? 'from-neon-green-primary to-neon-blue-primary' :
                  currentAnalysis.score > 0.6 ? 'from-neon-blue-primary to-neon-purple' :
                  currentAnalysis.score > 0.4 ? 'from-neon-orange to-neon-pink' : 'from-neon-pink to-red-500'
                }`}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Issues */}
          {currentAnalysis.issues.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-neon-orange mb-2">Issues Found</h4>
              <div className="space-y-2">
                {currentAnalysis.issues.map((issue) => (
                  <motion.div
                    key={issue.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-lg border bg-${getSeverityColor(issue.severity)}/10 border-${getSeverityColor(issue.severity)}/30`}
                  >
                    <div className="flex items-start space-x-2">
                      <ExclamationTriangleIcon className={`w-4 h-4 text-${getSeverityColor(issue.severity)} mt-0.5`} />
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-text-primary">{issue.title}</h5>
                        <p className="text-xs text-text-muted mb-2">{issue.description}</p>
                        {issue.fix && (
                          <div className="space-y-2">
                            <p className="text-xs text-text-primary">{issue.fix.description}</p>
                            {issue.fix.code && (
                              <pre className="text-xs bg-dark-tertiary/50 p-2 rounded overflow-x-auto">
                                <code>{issue.fix.code}</code>
                              </pre>
                            )}
                            {issue.fix.action && (
                              <button
                                onClick={issue.fix.action}
                                className="text-xs px-2 py-1 bg-neon-blue-primary/20 text-neon-blue-primary rounded hover:bg-neon-blue-primary/30 transition-colors"
                              >
                                Fix Issue
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <BeakerIcon className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <p className="text-sm text-text-muted">Run analysis to get UI insights</p>
        </div>
      )}
    </div>
  );

  const renderSuggestionsTab = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-neon-green-primary">AI Suggestions</h3>

      {currentAnalysis?.suggestions.length ? (
        <div className="space-y-3">
          {currentAnalysis.suggestions.map((suggestion) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg border bg-${getImpactColor(suggestion.impact)}/10 border-${getImpactColor(suggestion.impact)}/30`}
            >
              <div className="flex items-start space-x-2">
                <LightBulbIcon className={`w-4 h-4 text-${getImpactColor(suggestion.impact)} mt-0.5`} />
                <div className="flex-1">
                  <h5 className="text-sm font-medium text-text-primary">{suggestion.title}</h5>
                  <p className="text-xs text-text-muted mb-2">{suggestion.description}</p>

                  <div className="flex items-center space-x-4 mb-2">
                    <span className="text-xs text-text-muted">
                      Impact: <span className={`text-${getImpactColor(suggestion.impact)}`}>{suggestion.impact}</span>
                    </span>
                    <span className="text-xs text-text-muted">
                      Effort: <span className="text-text-primary">{suggestion.effort}</span>
                    </span>
                  </div>

                  {suggestion.implementation && (
                    <div className="space-y-2">
                      <p className="text-xs text-text-primary">{suggestion.implementation.description}</p>
                      {suggestion.implementation.code && (
                        <pre className="text-xs bg-dark-tertiary/50 p-2 rounded overflow-x-auto">
                          <code>{suggestion.implementation.code}</code>
                        </pre>
                      )}
                      {suggestion.implementation.action && (
                        <button
                          onClick={suggestion.implementation.action}
                          className="text-xs px-2 py-1 bg-neon-green-primary/20 text-neon-green-primary rounded hover:bg-neon-green-primary/30 transition-colors"
                        >
                          Apply Suggestion
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <SparklesIcon className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <p className="text-sm text-text-muted">No suggestions available yet</p>
        </div>
      )}
    </div>
  );

  const renderCoachingTab = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-neon-purple">Coaching Sessions</h3>

      <div className="grid grid-cols-2 gap-2">
        {[
          { id: 'accessibility', title: 'Accessibility', icon: <EyeIcon className="w-4 h-4" /> },
          { id: 'responsive', title: 'Responsive', icon: <DevicePhoneMobileIcon className="w-4 h-4" /> },
          { id: 'performance', title: 'Performance', icon: <CpuChipIcon className="w-4 h-4" /> },
          { id: 'design', title: 'Design System', icon: <SwatchIcon className="w-4 h-4" /> }
        ].map((topic) => (
          <motion.button
            key={topic.id}
            onClick={() => startCoachingSession(topic.title)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-3 bg-dark-tertiary/30 border border-neon-purple/20 rounded-lg hover:border-neon-purple/40 transition-all duration-200 text-left"
          >
            <div className="flex items-center space-x-2 mb-1">
              <div className="text-neon-purple">{topic.icon}</div>
              <span className="text-sm font-medium text-text-primary">{topic.title}</span>
            </div>
            <p className="text-xs text-text-muted">Interactive coaching session</p>
          </motion.button>
        ))}
      </div>

      {coachingSession && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-neon-purple/10 border border-neon-purple/30 rounded-lg"
        >
          <h4 className="text-sm font-bold text-neon-purple mb-2">
            Active Session: {coachingSession.topic}
          </h4>
          <p className="text-xs text-text-muted mb-3">
            Learn best practices and get real-time feedback on your design decisions.
          </p>
          <div className="flex items-center space-x-2">
            <button className="text-xs px-3 py-1 bg-neon-purple/20 text-neon-purple rounded hover:bg-neon-purple/30 transition-colors">
              Continue
            </button>
            <button
              onClick={() => setCoachingSession(null)}
              className="text-xs px-3 py-1 bg-text-muted/20 text-text-muted rounded hover:bg-text-muted/30 transition-colors"
            >
              End Session
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );

  const renderPrinciplesTab = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-neon-blue-primary">Design Principles</h3>

      <div className="space-y-3">
        {designPrinciples.map((principle) => (
          <motion.div
            key={principle.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`p-3 rounded-lg border border-${
              principle.importance === 'critical' ? 'neon-pink' :
              principle.importance === 'high' ? 'neon-orange' :
              principle.importance === 'medium' ? 'neon-blue-primary' : 'neon-green-primary'
            }/20 bg-dark-tertiary/30`}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-medium text-text-primary">{principle.name}</h4>
              <span className={`text-xs px-2 py-1 rounded-full bg-${
                principle.importance === 'critical' ? 'neon-pink' :
                principle.importance === 'high' ? 'neon-orange' :
                principle.importance === 'medium' ? 'neon-blue-primary' : 'neon-green-primary'
              }/20 text-${
                principle.importance === 'critical' ? 'neon-pink' :
                principle.importance === 'high' ? 'neon-orange' :
                principle.importance === 'medium' ? 'neon-blue-primary' : 'neon-green-primary'
              }`}>
                {principle.importance}
              </span>
            </div>

            <p className="text-xs text-text-muted mb-2">{principle.description}</p>

            <div className="space-y-1">
              {principle.examples.map((example, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <CheckCircleIcon className="w-3 h-3 text-neon-green-primary mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-text-primary">{example}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const tabs = [
    { id: 'analysis', label: 'Analysis', icon: <ChartBarIcon className="w-4 h-4" /> },
    { id: 'suggestions', label: 'Suggestions', icon: <LightBulbIcon className="w-4 h-4" /> },
    { id: 'coaching', label: 'Coaching', icon: <AcademicCapIcon className="w-4 h-4" /> },
    { id: 'principles', label: 'Principles', icon: <SwatchIcon className="w-4 h-4" /> }
  ];

  return (
    <div className={`${className}`}>
      {/* Coach Toggle Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-12 h-12 rounded-full bg-gradient-to-r from-neon-purple to-neon-pink flex items-center justify-center shadow-glow-purple"
      >
        <PaintBrushIcon className="w-6 h-6 text-white" />
      </motion.button>

      {/* Coach Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute bottom-16 right-0 w-80 h-96 bg-dark-secondary/95 backdrop-blur-xl border border-neon-purple/30 rounded-lg shadow-glow-purple z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neon-purple/20">
              <div className="flex items-center space-x-2">
                <PaintBrushIcon className="w-5 h-5 text-neon-purple" />
                <h3 className="text-sm font-bold text-neon-purple">UI Coach</h3>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-neon-purple/20">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                  className={`flex-1 flex items-center justify-center space-x-1 py-2 px-1 transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'text-neon-purple border-b-2 border-neon-purple bg-neon-purple/10'
                      : 'text-text-muted hover:text-neon-purple'
                  }`}
                >
                  {tab.icon}
                  <span className="text-xs hidden sm:block">{tab.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'analysis' && renderAnalysisTab()}
                  {activeTab === 'suggestions' && renderSuggestionsTab()}
                  {activeTab === 'coaching' && renderCoachingTab()}
                  {activeTab === 'principles' && renderPrinciplesTab()}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdaptiveUICoach;