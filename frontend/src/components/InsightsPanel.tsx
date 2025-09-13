import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
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
  isMobile?: boolean;
  isTablet?: boolean;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ className = '', isMobile: isOnMobile = false, isTablet = false }) => {
  console.log('Thermonuclear Elite InsightsPanel Rendered');
  
  const { 
    insightsPanel: { isExpanded, position, activeTab },
    toggleInsightsPanel,
    setInsightsPanelPosition,
    setInsightsPanelTab
  } = useStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Mobile touch gesture state
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchCurrentY, setTouchCurrentY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Horizontal swipe state for tab navigation
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchCurrentX, setTouchCurrentX] = useState<number | null>(null);
  const [isSwipingHorizontal, setIsSwipingHorizontal] = useState(false);

  // Auto-switch to bottom position on mobile
  useEffect(() => {
    if ((isOnMobile || isTablet) && position === 'sidebar') {
      setInsightsPanelPosition('bottom');
    }
  }, [isOnMobile, isTablet, position, setInsightsPanelPosition]);

  // Consolidated body scroll lock using shared hook
  const { isScrollLocked, activeLockCount } = useBodyScrollLock({
    lockId: 'insights-panel',
    isLocked: (isOnMobile || isTablet) && position === 'bottom' && isExpanded,
    onLockChange: (locked) => {
      console.log(`InsightsPanel scroll lock ${locked ? 'activated' : 'deactivated'}. Active locks: ${activeLockCount}`);
    }
  });

  // Enhanced mobile touch gesture handlers for bottom sheet and tab navigation
  const handleTouchStart = (event: React.TouchEvent) => {
    if (!isOnMobile && !isTablet) return;
    
    const touch = event.touches[0];
    setTouchStartY(touch.clientY);
    setTouchCurrentY(touch.clientY);
    setTouchStartX(touch.clientX);
    setTouchCurrentX(touch.clientX);
    setIsDragging(true);
    setIsSwipingHorizontal(false);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (!isOnMobile && !isTablet || !isDragging || touchStartY === null || touchStartX === null) return;
    
    const touch = event.touches[0];
    setTouchCurrentY(touch.clientY);
    setTouchCurrentX(touch.clientX);
    
    const deltaY = Math.abs(touch.clientY - touchStartY);
    const deltaX = Math.abs(touch.clientX - touchStartX);
    
    // Determine gesture type based on direction
    if (deltaX > deltaY && deltaX > 20 && !isSwipingHorizontal) {
      // Horizontal swipe detected - tab navigation
      setIsSwipingHorizontal(true);
      event.preventDefault(); // Prevent scrolling during horizontal swipe
    } else if (deltaY > deltaX && touch.clientY > touchStartY && !isSwipingHorizontal) {
      // Vertical swipe down detected - panel collapse
      event.preventDefault(); // Prevent scrolling when dragging the panel down
    }
  };

  const handleTouchEnd = () => {
    if (!isOnMobile && !isTablet || !isDragging || touchStartY === null || touchStartX === null) return;
    
    const deltaY = touchCurrentY !== null ? touchCurrentY - touchStartY : 0;
    const deltaX = touchCurrentX !== null ? touchCurrentX - touchStartX : 0;
    const threshold = 80; // Pixels to trigger gesture
    
    if (isSwipingHorizontal) {
      // Handle horizontal swipe for tab navigation
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          // Swiped right - go to previous tab
          handleTabSwipe('right');
        } else {
          // Swiped left - go to next tab  
          handleTabSwipe('left');
        }
      }
    } else {
      // Handle vertical swipe for panel collapse
      if (deltaY > threshold && isExpanded) {
        toggleInsightsPanel();
      }
    }
    
    // Reset all touch states
    setTouchStartY(null);
    setTouchCurrentY(null);
    setTouchStartX(null);
    setTouchCurrentX(null);
    setIsDragging(false);
    setIsSwipingHorizontal(false);
  };

  // Swipe gesture for tab switching on mobile
  const handleTabSwipe = (direction: 'left' | 'right') => {
    if (!isOnMobile && !isTablet) return;
    
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    let newIndex = currentIndex;
    
    if (direction === 'left' && currentIndex < tabs.length - 1) {
      newIndex = currentIndex + 1;
    } else if (direction === 'right' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    }
    
    if (newIndex !== currentIndex) {
      setInsightsPanelTab(tabs[newIndex].id);
    }
  };

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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: isDragging && touchCurrentY && touchStartY && touchCurrentY > touchStartY 
              ? `translateY(${Math.max(0, touchCurrentY - touchStartY)}px)` 
              : 'translateY(0px)'
          }}
        >
          <div className="h-full bg-dark-secondary/95 backdrop-blur-xl border-t border-neon-blue-primary/30 flex flex-col">
            {/* Enhanced Prominent Mobile Drag Handle - Production Ready */}
            {(isOnMobile || isTablet) && (
              <div className="flex flex-col items-center py-4 border-b border-neon-blue-primary/20 bg-gradient-to-b from-dark-secondary/80 to-transparent relative">
                {/* Main Drag Handle with proper touch area (44x44) */}
                <motion.button
                  role="button"
                  aria-label={isExpanded ? "Drag to collapse insights" : "Drag to expand insights"}
                  aria-describedby="drag-handle-instructions"
                  tabIndex={0}
                  className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] p-3 cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-neon-blue-primary focus:ring-offset-2 focus:ring-offset-dark-secondary rounded-lg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleInsightsPanel();
                    }
                  }}
                  animate={{
                    backgroundColor: isDragging 
                      ? 'rgba(0, 210, 255, 0.1)' 
                      : isSwipingHorizontal 
                        ? 'rgba(0, 255, 136, 0.1)' 
                        : 'rgba(0, 0, 0, 0)'
                  }}
                  whileHover={{ 
                    backgroundColor: 'rgba(0, 210, 255, 0.05)',
                    scale: 1.02
                  }}
                  whileTap={{ 
                    scale: 0.98,
                    backgroundColor: 'rgba(0, 210, 255, 0.15)'
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Visual drag handle bar */}
                  <motion.div
                    animate={{
                      backgroundColor: isDragging 
                        ? 'var(--neon-blue-primary)' 
                        : isSwipingHorizontal 
                          ? 'var(--neon-green-primary)' 
                          : 'var(--neon-blue-primary)',
                      boxShadow: isDragging 
                        ? '0 0 20px var(--neon-blue-primary), 0 0 40px rgba(0, 210, 255, 0.3)' 
                        : isSwipingHorizontal 
                          ? '0 0 20px var(--neon-green-primary), 0 0 40px rgba(0, 255, 136, 0.3)' 
                          : '0 0 12px rgba(0, 210, 255, 0.4)'
                    }}
                    transition={{ duration: 0.2 }}
                    className="w-20 h-1.5 rounded-full relative mb-2"
                  >
                    {/* Enhanced grip texture */}
                    <div className="absolute inset-0 flex items-center justify-center space-x-1">
                      <div className="w-1 h-0.5 bg-white/60 rounded-full"></div>
                      <div className="w-1 h-0.5 bg-white/60 rounded-full"></div>
                      <div className="w-1 h-0.5 bg-white/60 rounded-full"></div>
                      <div className="w-1 h-0.5 bg-white/60 rounded-full"></div>
                    </div>
                    
                    {/* Pulsing effect when dragging */}
                    {isDragging && (
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="absolute inset-0 bg-current rounded-full opacity-30"
                      />
                    )}
                  </motion.div>
                  
                  {/* Clear drag indicator text */}
                  <motion.div
                    id="drag-handle-instructions"
                    initial={{ opacity: 0.7 }}
                    animate={{ 
                      opacity: isDragging ? 1 : isSwipingHorizontal ? 1 : 0.7,
                      color: isDragging 
                        ? 'var(--neon-blue-primary)' 
                        : isSwipingHorizontal 
                          ? 'var(--neon-green-primary)' 
                          : 'var(--text-muted)'
                    }}
                    className="text-xs font-medium tracking-wide text-center px-2"
                  >
                    {isDragging 
                      ? '↓ Release to close' 
                      : isSwipingHorizontal 
                        ? '↔ Swipe to switch tabs' 
                        : '↑ Drag to expand • ↔ Swipe tabs'
                    }
                  </motion.div>
                </motion.button>
                
                {/* Visual feedback dots */}
                <div className="flex items-center space-x-1.5 mt-2 pointer-events-none">
                  {[0, 1, 2].map((index) => (
                    <motion.div
                      key={index}
                      animate={{
                        scale: isDragging ? [1, 1.2, 1] : 1,
                        backgroundColor: isDragging 
                          ? 'var(--neon-blue-primary)' 
                          : isSwipingHorizontal 
                            ? 'var(--neon-green-primary)' 
                            : 'var(--text-muted)'
                      }}
                      transition={{ 
                        duration: 0.6, 
                        repeat: isDragging ? Infinity : 0,
                        delay: index * 0.1 
                      }}
                      className="w-1.5 h-1.5 rounded-full opacity-60"
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Mobile Header */}
            <div className={`flex items-center justify-between border-b border-neon-blue-primary/20 ${
              (isOnMobile || isTablet) ? 'px-3 py-2' : 'px-4 py-3'
            }`}>
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