'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RocketLaunchIcon,
  CloudIcon,
  CpuChipIcon,
  CircleStackIcon,
  HeartIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  BookmarkIcon,
  ClockIcon,
  LinkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon as CheckCircleSolid,
  ExclamationTriangleIcon as ExclamationTriangleSolid
} from '@heroicons/react/24/solid';
import { useStore, type DeploymentStatus, type SystemStatus } from '@/store';

interface FooterProps {
  className?: string;
  isMobile?: boolean;
  isTablet?: boolean;
  onDeploy?: () => void;
  onSave?: () => void;
  onExport?: () => void;
  onShare?: () => void;
}

// Static class maps to prevent Tailwind purging in production
const buttonColorClasses = {
  'neon-blue': {
    border: 'border-neon-blue-primary/30 hover:border-neon-blue-primary',
    bg: 'hover:bg-neon-blue-primary/10',
    text: 'text-neon-blue-primary',
    textHover: 'group-hover:text-neon-blue-light'
  },
  'neon-green': {
    border: 'border-neon-green-primary/30 hover:border-neon-green-primary',
    bg: 'hover:bg-neon-green-primary/10',
    text: 'text-neon-green-primary',
    textHover: 'group-hover:text-neon-green-light'
  },
  'neon-purple': {
    border: 'border-neon-purple/30 hover:border-neon-purple',
    bg: 'hover:bg-neon-purple/10',
    text: 'text-neon-purple',
    textHover: 'group-hover:text-neon-purple'
  }
};

const statusColorClasses = {
  healthy: 'text-neon-green-primary',
  warning: 'text-neon-orange',
  error: 'text-red-400',
  offline: 'text-text-muted'
};

const Footer: React.FC<FooterProps> = ({
  className = '',
  isMobile = false,
  isTablet = false,
  onDeploy,
  onSave,
  onExport,
  onShare
}) => {
  // Use Zustand store instead of local state
  const {
    footer: {
      deploymentStatus,
      isDeploying,
      deployProgress,
      systemStatus,
      buildInfo,
      showBuildInfo
    },
    setDeploymentStatus,
    setDeployProgress,
    updateSystemStatus,
    toggleBuildInfo,
    triggerDeploy,
    handleSave,
    handleExport,
    handleShare
  } = useStore();

  // Fix hydration issues with hasMounted pattern
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Simulate real-time status updates using store
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly update AI agents status to simulate activity
      const agentStatuses: SystemStatus[] = ['healthy', 'warning'];
      const randomStatus = agentStatuses[Math.floor(Math.random() * agentStatuses.length)];
      
      updateSystemStatus({
        aiAgents: randomStatus,
        overall: randomStatus === 'warning' ? 'warning' : 'healthy'
      });
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [updateSystemStatus]);

  const handleDeploy = async () => {
    if (isDeploying) return;
    
    // Use store action for deployment
    await triggerDeploy();
    onDeploy?.();
  };

  const getStatusColor = (status: SystemStatus): string => {
    return statusColorClasses[status];
  };

  const getStatusIcon = (status: SystemStatus, size = 'w-4 h-4') => {
    switch (status) {
      case 'healthy': 
        return <CheckCircleSolid className={`${size} text-neon-green-primary`} />;
      case 'warning': 
        return <ExclamationTriangleSolid className={`${size} text-neon-orange`} />;
      case 'error': 
        return <ExclamationTriangleSolid className={`${size} text-red-400`} />;
      case 'offline': 
        return <div className={`${size.replace('w-4 h-4', 'w-3 h-3')} bg-text-muted rounded-full`} />;
    }
  };

  const getDeployButtonContent = () => {
    switch (deploymentStatus) {
      case 'building':
        return (
          <>
            <ArrowPathIcon className="w-5 h-5 animate-spin" />
            <span>Building... {deployProgress}%</span>
          </>
        );
      case 'deployed':
        return (
          <>
            <CheckCircleIcon className="w-5 h-5" />
            <span>Deployed!</span>
          </>
        );
      case 'error':
        return (
          <>
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span>Deploy Failed</span>
          </>
        );
      default:
        return (
          <>
            <RocketLaunchIcon className="w-5 h-5" />
            <span>Deploy Now</span>
          </>
        );
    }
  };

  const deployButtonVariants = {
    ready: {
      background: 'linear-gradient(135deg, var(--neon-blue-primary) 0%, var(--neon-green-primary) 100%)',
      boxShadow: '0 0 20px rgba(0, 210, 255, 0.3)',
      scale: 1
    },
    building: {
      background: 'linear-gradient(135deg, var(--neon-orange) 0%, var(--neon-blue-primary) 100%)',
      boxShadow: '0 0 30px rgba(255, 102, 0, 0.4)',
      scale: 1.05
    },
    deployed: {
      background: 'linear-gradient(135deg, var(--neon-green-primary) 0%, var(--neon-green-secondary) 100%)',
      boxShadow: '0 0 25px rgba(0, 255, 136, 0.4)',
      scale: 1.02
    },
    error: {
      background: 'linear-gradient(135deg, #ff4444 0%, #cc2222 100%)',
      boxShadow: '0 0 20px rgba(255, 68, 68, 0.3)',
      scale: 1
    }
  };

  const statusIndicators = [
    { key: 'canvas', label: 'Canvas', icon: CloudIcon, status: systemStatus.canvas },
    { key: 'aiAgents', label: 'AI Agents', icon: CpuChipIcon, status: systemStatus.aiAgents },
    { key: 'database', label: 'Database', icon: CircleStackIcon, status: systemStatus.database },
  ];

  const quickActions = [
    { key: 'save', label: 'Save', icon: BookmarkIcon, onClick: onSave || handleSave, color: 'neon-blue' as keyof typeof buttonColorClasses },
    { key: 'export', label: 'Export', icon: ArrowDownTrayIcon, onClick: onExport || handleExport, color: 'neon-green' as keyof typeof buttonColorClasses },
    { key: 'share', label: 'Share', icon: ShareIcon, onClick: onShare || handleShare, color: 'neon-purple' as keyof typeof buttonColorClasses },
  ];

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed bottom-0 left-0 right-0 z-40 bg-dark-secondary/95 backdrop-blur-xl border-t border-neon-blue-primary/30 safe-area-inset-bottom ${className}`}
    >
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-2' : 'px-4 sm:px-6 lg:px-8'}`}>
        <div className={`flex items-center ${isMobile ? 'justify-center h-12' : 'justify-between h-16'} relative`}>
          
          {/* Mobile: Just Deploy Button */}
          {isMobile ? (
            <motion.button
              onClick={handleDeploy}
              disabled={isDeploying}
              className={`flex items-center space-x-3 px-8 py-3 rounded-full text-white font-semibold transition-all duration-300 disabled:cursor-not-allowed overflow-hidden relative ${
                isMobile ? 'text-base min-h-[48px] min-w-[48px]' : 'text-sm'
              }`}
              variants={deployButtonVariants}
              animate={deploymentStatus}
              whileHover={!isDeploying ? { scale: 1.05 } : {}}
              whileTap={!isDeploying ? { scale: 0.95 } : {}}
            >
              {/* Progress bar for building state */}
              {deploymentStatus === 'building' && (
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: `${deployProgress}%` }}
                  className="absolute left-0 top-0 h-full bg-white/20 rounded-full"
                />
              )}
              
              <div className="flex items-center space-x-3 relative z-10">
                {getDeployButtonContent()}
              </div>
            </motion.button>
          ) : (
            <>
              {/* Desktop: Left: System Status Indicators */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
                    systemStatus.overall === 'healthy' ? 'bg-neon-green-primary/20' : 'bg-neon-orange/20'
                  }`}>
                    {getStatusIcon(systemStatus.overall, 'w-3 h-3')}
                  </div>
                  <span className="text-sm font-medium text-text-primary hidden sm:block">
                    System Status
                  </span>
                </div>
                
                <div className="hidden md:flex items-center space-x-3">
                  {statusIndicators.map(({ key, label, icon: Icon, status }) => (
                    <motion.div
                      key={key}
                      className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-dark-tertiary/50 border border-neon-blue-primary/20"
                      whileHover={{ scale: 1.05 }}
                      title={`${label}: ${status}`}
                    >
                      <Icon className="w-3 h-3 text-text-muted" />
                      <span className="text-xs text-text-muted hidden lg:block">{label}</span>
                      {getStatusIcon(status, 'w-3 h-3')}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Desktop: Center: Deploy Button */}
              <div className="absolute left-1/2 transform -translate-x-1/2">
                <motion.button
                  onClick={handleDeploy}
                  disabled={isDeploying}
                  className="flex items-center space-x-2 px-6 py-3 rounded-full text-white font-semibold text-sm transition-all duration-300 disabled:cursor-not-allowed overflow-hidden relative"
                  variants={deployButtonVariants}
                  animate={deploymentStatus}
                  whileHover={!isDeploying ? { scale: 1.1 } : {}}
                  whileTap={!isDeploying ? { scale: 0.95 } : {}}
                >
                  {/* Progress bar for building state */}
                  {deploymentStatus === 'building' && (
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: `${deployProgress}%` }}
                      className="absolute left-0 top-0 h-full bg-white/20 rounded-full"
                    />
                  )}
                  
                  <div className="flex items-center space-x-2 relative z-10">
                    {getDeployButtonContent()}
                  </div>
                </motion.button>
              </div>
            </>
          )}

          {/* Right: Quick Actions & Build Info */}
          <div className="flex items-center space-x-3">
            {/* Quick Actions */}
            <div className="hidden sm:flex items-center space-x-2">
              {quickActions.map(({ key, label, icon: Icon, onClick, color }) => {
                const colorClasses = buttonColorClasses[color];
                return (
                  <motion.button
                    key={key}
                    onClick={onClick}
                    className={`p-2 rounded-lg border ${colorClasses.border} ${colorClasses.bg} transition-all duration-200 group`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={label}
                  >
                    <Icon className={`w-4 h-4 ${colorClasses.text} ${colorClasses.textHover}`} />
                  </motion.button>
                );
              })}
            </div>

            {/* Build Info Toggle */}
            <motion.button
              onClick={toggleBuildInfo}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-neon-blue-primary/30 hover:border-neon-blue-primary hover:bg-neon-blue-primary/10 transition-all duration-200 group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ClockIcon className="w-4 h-4 text-neon-blue-primary group-hover:text-neon-blue-light" />
              <span className="text-xs text-neon-blue-primary group-hover:text-neon-blue-light hidden lg:block">
                v{buildInfo.version}
              </span>
            </motion.button>
          </div>
        </div>

        {/* Build Info Dropdown */}
        <AnimatePresence>
          {showBuildInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-neon-blue-primary/20 py-4 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-neon-blue-primary font-medium">Build Information</p>
                  <p className="text-text-muted">Version: {buildInfo.version}</p>
                  <p className="text-text-muted">Build ID: {buildInfo.buildId}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-neon-green-primary font-medium">Last Updated</p>
                  {hasMounted ? (
                    <>
                      <p className="text-text-muted">
                        {buildInfo.lastUpdated.toLocaleString()}
                      </p>
                      <p className="text-text-muted">
                        {Math.floor((Date.now() - buildInfo.lastUpdated.getTime()) / 60000)} minutes ago
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-text-muted">Loading...</p>
                      <p className="text-text-muted">Calculating...</p>
                    </>
                  )}
                </div>

                {buildInfo.deploymentUrl && (
                  <div className="space-y-1">
                    <p className="text-neon-purple font-medium">Deployment</p>
                    <a 
                      href={buildInfo.deploymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-neon-blue-primary hover:text-neon-blue-light transition-colors"
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span className="truncate max-w-[200px]">{buildInfo.deploymentUrl}</span>
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Quick Actions Overlay */}
      <div className="sm:hidden fixed bottom-20 right-4 flex flex-col space-y-2">
        {quickActions.map(({ key, label, icon: Icon, onClick, color }, index) => {
          const colorClasses = buttonColorClasses[color];
          return (
            <motion.button
              key={key}
              onClick={onClick}
              className={`p-3 rounded-full bg-dark-secondary/95 backdrop-blur-xl border ${colorClasses.border} ${colorClasses.bg} transition-all duration-200 shadow-lg min-w-[48px] min-h-[48px] flex items-center justify-center`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
            >
              <Icon className={`w-5 h-5 ${colorClasses.text}`} />
            </motion.button>
          );
        })}
      </div>
    </motion.footer>
  );
};

export default Footer;