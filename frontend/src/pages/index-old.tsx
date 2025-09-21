import { Header } from '@/components/Header';
import InsightsPanel from '@/components/InsightsPanel';
import EliteSidebar from '@/components/EliteSidebar';
import { Footer } from '@/components/Footer';
import {useStore} from '@/store';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useOnboardingKeyboard } from '@/components/OnboardingTutorial';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import dynamic from 'next/dynamic';

// Import bulletproof components directly
import LandingRebuilt from './landing-rebuilt';
import DashboardRebuilt from './dashboard-rebuilt';
const ContextualAIAssistant = dynamic(() => import('@/components/ContextualAIAssistant'), { ssr: false });

// Type definitions
interface Template {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  description: string;
}

interface RoadmapItem {
  id: string;
  name: string;
  type: string;
  icon: string;
  status: string;
}

const Dashboard = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const {
    isOnboardingOpen,
    shouldShowOnboarding,
    startOnboarding,
    completeOnboarding,
    closeOnboarding
  } = useOnboarding();
  const {
    toggleMode,
    fetchRoadmap,
    mode,
    triggerDeploy,
    handleSave,
    handleExport,
    handleShare
  } = useStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedRoadmapItem, setSelectedRoadmapItem] = useState<RoadmapItem | null>(null);
  
  // Mobile responsiveness states - hydration-safe initialization
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [showMobileInsights, setShowMobileInsights] = useState(false);

  // Auto-save functionality
  const { isSaving, manualSave, lastSaved } = useAutoSave({
    interval: 30000, // Auto-save every 30 seconds
    debounceDelay: 3000, // Debounce for 3 seconds after changes
    onSave: () => {
      toast.success('Changes saved', {
        duration: 2000,
        position: 'bottom-right',
      });
    },
    onError: (error) => {
      toast.error('Failed to save changes', {
        description: error.message,
        duration: 4000,
        position: 'bottom-right',
      });
    }
  });

  // Hydration-safe mobile detection
  const checkMobileLayout = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const mobile = window.innerWidth < 768;
    const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    setIsMobile(mobile);
    setIsTablet(tablet);
    
    // Auto-collapse sidebar on mobile
    if (mobile) {
      setIsSidebarCollapsed(true);
      setIsSidebarOpen(false);
    }
  }, []);

  // Consolidated body scroll lock using shared hook for sidebar and mobile insights
  const { isScrollLocked, activeLockCount } = useBodyScrollLock('dashboard-modals', isSidebarOpen || showMobileInsights);

  // Onboarding keyboard navigation
  useOnboardingKeyboard(isOnboardingOpen, () => {}, () => {}, closeOnboarding);

  // Authentication check - redirect to landing page for unauthenticated users
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Show landing page instead of redirecting to login
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  // Hydration-safe effect for mobile detection
  useEffect(() => {
    checkMobileLayout();

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobileLayout);
      return () => window.removeEventListener('resize', checkMobileLayout);
    }
  }, [checkMobileLayout]);

  useEffect(() => {
    // Only fetch roadmap if authenticated
    if (isAuthenticated) {
      fetchRoadmap('uuid-thermo-1');
    }
  }, [fetchRoadmap, isAuthenticated]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading ProtoThrive...</div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  if (!isAuthenticated) {
    return <LandingRebuilt />;
  }

  // Show bulletproof dashboard for authenticated users
  return <DashboardRebuilt />;
};

export default Dashboard;
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  // Touch gesture handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX;
    
    // Swipe right to open sidebar (only on mobile)
    if (isMobile && deltaX > 100 && touchStartX < 50) {
      setIsSidebarOpen(true);
    }
    // Swipe left to close sidebar (only on mobile)
    else if (isMobile && deltaX < -100 && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
    
    setTouchStartX(null);
  };

  const handleMobileInsightsToggle = () => {
    setShowMobileInsights(!showMobileInsights);
  };

  // Close sidebar when clicking overlay on mobile
  const handleOverlayClick = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    console.log('Template selected:', template);
    // Here you could integrate with your canvas or store
  };

  const handleRoadmapItemSelect = (item: RoadmapItem) => {
    setSelectedRoadmapItem(item);
    console.log('Roadmap item selected:', item);
    // Here you could navigate or update the view
  };


  return (
    <div 
      className="min-h-screen bg-dark-primary"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Header 
        isMobile={isMobile}
        isTablet={isTablet}
        onToggleSidebar={handleToggleSidebar}
      />
      
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={handleOverlayClick}
          />
        )}
      </AnimatePresence>
      
      <div className="flex pt-16 h-screen pb-16 relative">
        {/* Elite Sidebar - Enhanced for Mobile */}
        <motion.div
          data-tutorial="sidebar"
          className={`
            ${isMobile
              ? 'fixed left-0 top-16 bottom-16 z-50 w-80'
              : 'relative'
            }
          `}
          initial={false}
          animate={{
            x: isMobile
              ? (isSidebarOpen ? 0 : -320)
              : 0
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30
          }}
        >
          <EliteSidebar
            isCollapsed={isMobile ? false : isSidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
            onTemplateSelect={handleTemplateSelect}
            onRoadmapItemSelect={handleRoadmapItemSelect}
            isMobile={isMobile}
            isOpen={isSidebarOpen}
          />
        </motion.div>

        {/* Main Content Area - Mobile Responsive */}
        <motion.main 
          className={`
            flex-1 overflow-hidden
            ${isMobile ? 'w-full' : ''}
            ${!isMobile && !isSidebarCollapsed ? 'ml-80' : ''}
            ${!isMobile && isSidebarCollapsed ? 'ml-16' : ''}
          `}
          animate={{
            marginLeft: isMobile ? 0 : (isSidebarCollapsed ? 64 : 320),
          }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 30 
          }}
        >
          <div className={`
            h-full overflow-y-auto pb-20
            ${isMobile ? 'p-2' : 'p-4'}
          `}>
            {/* Mobile Action Button */}
            {isMobile && (
              <motion.button
                onClick={handleMobileInsightsToggle}
                className="fixed top-20 right-4 z-30 btn-elite text-xs px-3 py-2 bg-dark-secondary/90 backdrop-blur-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {showMobileInsights ? '🎨 Canvas' : '📊 Insights'}
              </motion.button>
            )}
            
            {/* Elite Canvas Layout - Responsive Stacking */}
            <div className={`
              ${isMobile 
                ? 'flex flex-col gap-3 h-full' 
                : isTablet 
                  ? 'flex flex-col gap-4 h-full'
                  : 'flex flex-row gap-6 h-full'
              }
            `}>
              {/* Main Canvas Area - Responsive */}
              <motion.div
                data-tutorial="canvas"
                className={`
                  ${isMobile
                    ? `${showMobileInsights ? 'hidden' : 'flex-grow'} min-h-[500px]`
                    : isTablet
                      ? 'flex-grow min-h-[400px]'
                      : 'flex-grow lg:w-[70%] min-h-[600px]'
                  }
                  bg-dark-secondary/50 rounded-xl border border-neon-blue-primary/20 backdrop-blur-sm
                  ${isMobile ? 'p-2' : 'p-4'}
                `}
                layout
                transition={{ duration: 0.3 }}
              >
                <div className={`
                  flex items-center justify-between mb-4
                  ${isMobile ? 'flex-col gap-2' : ''}
                `}>
                  <h2 className={`
                    font-bold text-elite bg-gradient-neon-mix bg-clip-text text-transparent
                    ${isMobile ? 'text-base' : 'text-lg'}
                  `}>
                    Elite Magic Canvas
                  </h2>
                  <div className="flex items-center space-x-2">
                    <motion.button
                      data-tutorial="mode-toggle"
                      onClick={toggleMode}
                      className={`
                        btn-elite
                        ${isMobile ? 'text-xs px-3 py-1' : 'text-sm px-4 py-2'}
                      `}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {mode === '2d' ? '🎯 3D' : '🔮 2D'}
                    </motion.button>
                  </div>
                </div>
                <div className={`
                  ${isMobile ? 'h-[calc(100%-80px)]' : 'h-[calc(100%-60px)]'}
                `}>
                  <MagicCanvas 
                    className="w-full h-full" 
                    isMobile={isMobile}
                    isTablet={isTablet}
                  />
                </div>
              </motion.div>

              {/* Insights Panel - Responsive */}
              <motion.div
                data-tutorial="insights"
                className={`
                  ${isMobile
                    ? `${showMobileInsights ? 'flex-grow' : 'hidden'} min-h-[500px]`
                    : isTablet
                      ? 'flex-shrink-0 min-h-[400px]'
                      : 'flex-shrink-0 lg:w-[30%] min-h-[600px]'
                  }
                  bg-dark-secondary/50 rounded-xl border border-neon-green-primary/20 backdrop-blur-sm
                  ${isMobile ? 'p-2' : 'p-4'}
                `}
                layout
                transition={{ duration: 0.3 }}
              >
                <h2 className={`
                  font-bold text-neon-green-primary mb-4
                  ${isMobile ? 'text-base' : 'text-lg'}
                `}>
                  Elite Insights
                </h2>
                <InsightsPanel isMobile={isMobile} isTablet={isTablet} />
                
                {/* Selected Template Info */}
                {selectedTemplate && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 rounded-lg bg-neon-blue-primary/10 border border-neon-blue-primary/30"
                  >
                    <h3 className="text-sm font-bold text-neon-blue-primary mb-2">
                      Selected Template
                    </h3>
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{selectedTemplate.thumbnail}</span>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {selectedTemplate.name}
                        </p>
                        <p className="text-xs text-text-muted">
                          {selectedTemplate.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Selected Roadmap Item Info */}
                {selectedRoadmapItem && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 rounded-lg bg-neon-green-primary/10 border border-neon-green-primary/30"
                  >
                    <h3 className="text-sm font-bold text-neon-green-primary mb-2">
                      Selected Roadmap Item
                    </h3>
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{selectedRoadmapItem.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {selectedRoadmapItem.name}
                        </p>
                        <p className="text-xs text-text-muted">
                          Status: {selectedRoadmapItem.status}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Additional Content Row - Mobile Responsive */}
            <motion.div 
              className={`
                ${isMobile ? 'mt-3' : 'mt-6'}
                grid gap-4
                ${isMobile 
                  ? 'grid-cols-1' 
                  : isTablet 
                    ? 'grid-cols-2'
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }
              `}
              layout
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="card-elite"
                whileHover={{ scale: isMobile ? 1 : 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className={`
                  font-bold text-neon-blue-primary mb-2
                  ${isMobile ? 'text-base' : 'text-lg'}
                `}>Quick Actions</h3>
                <div className="space-y-2">
                  <motion.button 
                    className={`btn-elite w-full ${isMobile ? 'text-xs' : 'text-sm'}`}
                    whileTap={{ scale: 0.95 }}
                  >
                    New Project
                  </motion.button>
                  <motion.button 
                    className={`btn-elite w-full ${isMobile ? 'text-xs' : 'text-sm'}`}
                    whileTap={{ scale: 0.95 }}
                  >
                    Import Template
                  </motion.button>
                  <motion.button
                    onClick={startOnboarding}
                    className={`btn-elite w-full ${isMobile ? 'text-xs' : 'text-sm'} bg-gradient-to-r from-blue-500 to-purple-600 text-white`}
                    whileTap={{ scale: 0.95 }}
                  >
                    📚 Take Tour
                  </motion.button>
                </div>
              </motion.div>
              
              <motion.div 
                className="card-elite"
                whileHover={{ scale: isMobile ? 1 : 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className={`
                  font-bold text-neon-green-primary mb-2
                  ${isMobile ? 'text-base' : 'text-lg'}
                `}>Recent Activity</h3>
                <div className={`
                  space-y-2 text-text-muted
                  ${isMobile ? 'text-xs' : 'text-sm'}
                `}>
                  <p>✅ Updated wireframes</p>
                  <p>🔄 In progress: High-Fi Mockups</p>
                  <p>📊 Completed user research</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="card-elite"
                whileHover={{ scale: isMobile ? 1 : 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className={`
                  font-bold text-neon-purple mb-2
                  ${isMobile ? 'text-base' : 'text-lg'}
                `}>Collaboration</h3>
                <div className={`
                  space-y-2
                  ${isMobile ? 'text-xs' : 'text-sm'}
                `}>
                  <p className="text-text-primary">Team Members: 5</p>
                  <p className="text-text-primary">Active Sessions: 2</p>
                  <p className="text-text-primary">Last Sync: 2 min ago</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.main>
      </div>
      
      {/* Elite Footer */}
      <Footer
        isMobile={isMobile}
        isTablet={isTablet}
        onDeploy={triggerDeploy}
        onSave={handleSave}
        onExport={handleExport}
        onShare={handleShare}
      />

      {/* Onboarding Tutorial */}
      <OnboardingTutorial
        isOpen={isOnboardingOpen}
        onClose={closeOnboarding}
        onComplete={completeOnboarding}
      />

      {/* Contextual AI Assistant - Only show when authenticated */}
      {isAuthenticated && (
        <ContextualAIAssistant
          className="z-50"
          defaultPosition={isMobile ? 'bottom-left' : 'bottom-right'}
          enableContextualPositioning={true}
          maxMessages={3}
          autoActivate={true}
        />
      )}

      {/* Toast notifications */}
      <Toaster richColors />

      {/* Auto-save indicator */}
      {isSaving && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-24 right-4 z-50 px-4 py-2 bg-blue-500/90 text-white rounded-lg backdrop-blur-sm"
        >
          <span className="flex items-center gap-2">
            <span className="animate-spin">⚡</span>
            Saving...
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
