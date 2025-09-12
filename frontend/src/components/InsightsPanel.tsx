import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import ThriveGauge from './ThriveGauge';
import AgentChatInterface from './AgentChatInterface';
import MetricsCards from './MetricsCards';
import { 
  ChevronDownIcon,
  ChevronUpIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface InsightsPanelProps {
  className?: string;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ className = '' }) => {
  console.log('Thermonuclear Elite InsightsPanel Rendered');
  
  const { 
    insightsPanel: { isExpanded, position, activeTab },
    toggleInsightsPanel,
    setInsightsPanelPosition,
    setInsightsPanelTab
  } = useStore();

  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && position === 'sidebar') {
        setInsightsPanelPosition('bottom');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [position, setInsightsPanelPosition]);

  // Tab configurations
  const tabs = [
    {
      id: 'overview' as const,
      label: 'Overview',
      icon: <ChartBarIcon className="w-4 h-4" />,
      color: 'neon-green'
    },
    {
      id: 'chat' as const,
      label: 'AI Chat',
      icon: <ChatBubbleLeftRightIcon className="w-4 h-4" />,
      color: 'neon-blue'
    },
    {
      id: 'metrics' as const,
      label: 'Metrics',
      icon: <CpuChipIcon className="w-4 h-4" />,
      color: 'neon-purple'
    },
    {
      id: 'activity' as const,
      label: 'Activity',
      icon: <ClockIcon className="w-4 h-4" />,
      color: 'neon-orange'
    }
  ];

  const getTabColorClass = (color: string, isActive: boolean) => {
    const colorMap = {
      'neon-green': isActive ? 'text-neon-green-primary border-neon-green-primary bg-neon-green-primary/10' : 'text-text-muted hover:text-neon-green-light',
      'neon-blue': isActive ? 'text-neon-blue-primary border-neon-blue-primary bg-neon-blue-primary/10' : 'text-text-muted hover:text-neon-blue-light',
      'neon-purple': isActive ? 'text-neon-purple border-neon-purple bg-neon-purple/10' : 'text-text-muted hover:text-neon-purple',
      'neon-orange': isActive ? 'text-neon-orange border-neon-orange bg-neon-orange/10' : 'text-text-muted hover:text-neon-orange'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap['neon-blue'];
  };

  // Panel animations
  const panelVariants = {
    sidebar: {
      hidden: { x: '100%', opacity: 0 },
      visible: { x: 0, opacity: 1 },
      collapsed: { x: 'calc(100% - 60px)', opacity: 0.8 }
    },
    bottom: {
      hidden: { y: '100%', opacity: 0 },
      visible: { y: 0, opacity: 1 },
      collapsed: { y: 'calc(100% - 60px)', opacity: 0.8 }
    }
  };

  const contentVariants = {
    enter: {
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    center: {
      opacity: 1,
      y: 0,
      scale: 1
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="flex justify-center">
              <ThriveGauge size="large" showLabel={true} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-dark-tertiary/30 border border-neon-green-primary/20 text-center">
                <div className="text-sm font-bold text-neon-green-primary">73%</div>
                <div className="text-xs text-text-muted">Health Score</div>
              </div>
              <div className="p-3 rounded-lg bg-dark-tertiary/30 border border-neon-blue-primary/20 text-center">
                <div className="text-sm font-bold text-neon-blue-primary">Active</div>
                <div className="text-xs text-text-muted">Status</div>
              </div>
            </div>
          </div>
        );
      case 'chat':
        return <AgentChatInterface />;
      case 'metrics':
        return <MetricsCards />;
      case 'activity':
        return (
          <div className="space-y-4">
            <div className="text-center py-8">
              <ClockIcon className="w-12 h-12 text-neon-orange mx-auto mb-3" />
              <h3 className="text-sm font-medium text-neon-orange mb-2">Activity Timeline</h3>
              <p className="text-xs text-text-muted">Recent project activities and updates</p>
            </div>
            <div className="space-y-3">
              {[
                { time: '2m ago', action: 'AI generated component structure', type: 'success' },
                { time: '5m ago', action: 'User updated project settings', type: 'info' },
                { time: '12m ago', action: 'Deployment completed successfully', type: 'success' },
                { time: '18m ago', action: 'Code review initiated', type: 'warning' }
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-dark-tertiary/30 border border-neon-blue-primary/20"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'success' ? 'bg-neon-green-primary' :
                    activity.type === 'warning' ? 'bg-neon-orange' : 'bg-neon-blue-primary'
                  }`} />
                  <div className="flex-1">
                    <div className="text-xs text-text-primary">{activity.action}</div>
                    <div className="text-xs text-text-muted">{activity.time}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isExpanded && position === 'sidebar') {
    return (
      <motion.div
        variants={panelVariants.sidebar}
        initial="collapsed"
        animate="collapsed"
        className="fixed top-16 right-0 h-[calc(100vh-4rem)] w-16 z-40"
      >
        <div className="h-full bg-dark-secondary/80 backdrop-blur-xl border-l border-neon-blue-primary/30 flex flex-col items-center py-4">
          <motion.button
            onClick={toggleInsightsPanel}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 rounded-full bg-gradient-blue flex items-center justify-center hover:shadow-glow-blue transition-all duration-300"
          >
            <ChartBarIcon className="w-6 h-6 text-white" />
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      {/* Mobile/Bottom Panel */}
      {position === 'bottom' && (
        <motion.div
          variants={panelVariants.bottom}
          initial="hidden"
          animate={isExpanded ? "visible" : "collapsed"}
          className={`fixed bottom-0 left-0 right-0 z-50 ${
            isExpanded ? 'h-[60vh]' : 'h-16'
          } transition-all duration-300`}
        >
          <div className="h-full bg-dark-secondary/95 backdrop-blur-xl border-t border-neon-blue-primary/30 flex flex-col">
            {/* Mobile Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neon-blue-primary/20">
              <div className="flex items-center space-x-3">
                <motion.button
                  onClick={toggleInsightsPanel}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-8 h-8 rounded-full bg-gradient-blue flex items-center justify-center"
                >
                  {isExpanded ? <ChevronDownIcon className="w-5 h-5 text-white" /> : <ChevronUpIcon className="w-5 h-5 text-white" />}
                </motion.button>
                <h2 className="text-sm font-bold text-neon-blue-primary">Elite Insights</h2>
              </div>
              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={() => setInsightsPanelPosition('sidebar')}
                  whileHover={{ scale: 1.05 }}
                  className="w-8 h-8 rounded-full bg-dark-tertiary/50 flex items-center justify-center border border-neon-blue-primary/30 hover:border-neon-blue-primary/60 transition-all duration-300"
                >
                  <ComputerDesktopIcon className="w-4 h-4 text-neon-blue-light" />
                </motion.button>
              </div>
            </div>
            
            {isExpanded && (
              <div className="flex-1 overflow-hidden">
                <div className="flex border-b border-neon-blue-primary/20">
                  {tabs.map((tab) => (
                    <motion.button
                      key={tab.id}
                      onClick={() => setInsightsPanelTab(tab.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 border-b-2 transition-all duration-300 ${
                        getTabColorClass(tab.color, activeTab === tab.id)
                      }`}
                    >
                      {tab.icon}
                      <span className="text-xs hidden sm:block">{tab.label}</span>
                    </motion.button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      variants={contentVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.3 }}
                    >
                      {renderTabContent()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Desktop Sidebar Panel */}
      {position === 'sidebar' && (
        <motion.div
          variants={panelVariants.sidebar}
          initial="hidden"
          animate={isExpanded ? "visible" : "hidden"}
          className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-80 z-40 ${className}`}
        >
          <div className="h-full bg-dark-secondary/95 backdrop-blur-xl border-l border-neon-blue-primary/30 flex flex-col shadow-glow-blue">
            {/* Desktop Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-neon-blue-primary/20">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-blue flex items-center justify-center">
                  <ChartBarIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-neon-blue-primary">Elite Insights</h2>
                  <p className="text-xs text-text-muted">Real-time project analytics</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={() => setInsightsPanelPosition('bottom')}
                  whileHover={{ scale: 1.05 }}
                  className="w-8 h-8 rounded-full bg-dark-tertiary/50 flex items-center justify-center border border-neon-blue-primary/30 hover:border-neon-blue-primary/60 transition-all duration-300"
                >
                  <DevicePhoneMobileIcon className="w-4 h-4 text-neon-blue-light" />
                </motion.button>
                <motion.button
                  onClick={toggleInsightsPanel}
                  whileHover={{ scale: 1.05 }}
                  className="w-8 h-8 rounded-full bg-dark-tertiary/50 flex items-center justify-center border border-neon-blue-primary/30 hover:border-neon-blue-primary/60 transition-all duration-300"
                >
                  <XMarkIcon className="w-4 h-4 text-neon-blue-light" />
                </motion.button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-neon-blue-primary/20">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setInsightsPanelTab(tab.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 flex items-center justify-center space-x-1 py-3 px-2 border-b-2 transition-all duration-300 ${
                    getTabColorClass(tab.color, activeTab === tab.id)
                  }`}
                >
                  {tab.icon}
                  <span className="text-xs">{tab.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  variants={contentVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}

      {/* Background Overlay for Mobile */}
      {position === 'bottom' && isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={toggleInsightsPanel}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        />
      )}
    </>
  );
};

export default InsightsPanel;