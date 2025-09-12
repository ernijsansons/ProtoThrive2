'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDownIcon, 
  UserCircleIcon, 
  MagnifyingGlassIcon as SearchIcon, 
  SparklesIcon 
} from '@heroicons/react/24/outline';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [thriveProgress, setThriveProgress] = useState(73); // Example progress
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animated progress arc for Thrive pill
  const circumference = 2 * Math.PI * 16;
  const strokeDasharray = `${(thriveProgress / 100) * circumference} ${circumference}`;

  const headerVariants = {
    default: {
      background: 'rgba(10, 10, 11, 0.8)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(0, 210, 255, 0.2)',
    },
    scrolled: {
      background: 'rgba(10, 10, 11, 0.95)',
      backdropFilter: 'blur(30px)',
      borderBottom: '1px solid rgba(0, 210, 255, 0.4)',
      boxShadow: '0 0 20px rgba(0, 210, 255, 0.1)',
    },
  };

  const logoVariants = {
    hover: {
      scale: 1.05,
      textShadow: '0 0 20px var(--neon-blue-primary)',
      transition: { duration: 0.3 },
    },
  };

  const thriveVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { duration: 0.5, delay: 0.2 }
    },
    hover: {
      scale: 1.1,
      boxShadow: '0 0 30px rgba(0, 255, 136, 0.4)',
      transition: { duration: 0.3 },
    },
  };

  const chatVariants = {
    focus: {
      scale: 1.02,
      boxShadow: '0 0 25px rgba(0, 210, 255, 0.3)',
      borderColor: 'var(--neon-blue-primary)',
      transition: { duration: 0.3 },
    },
  };

  const dropdownVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: { duration: 0.2 },
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
    },
  };

  return (
    <motion.header
      initial="default"
      animate={isScrolled ? 'scrolled' : 'default'}
      variants={headerVariants}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: ProtoThrive Logo */}
          <motion.div
            variants={logoVariants}
            whileHover="hover"
            className="flex items-center space-x-3"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-gradient-neon-mix flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-neon-mix rounded-lg blur opacity-30 animate-neon-pulse"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-elite bg-gradient-neon-mix bg-clip-text text-transparent animate-gradient-shift">
                ProtoThrive
              </h1>
              <p className="text-xs text-neon-blue-light/80">Elite Platform</p>
            </div>
          </motion.div>

          {/* Center: AI Chat Bar */}
          <motion.div 
            className="flex-1 max-w-2xl mx-4 sm:mx-8"
            whileFocus="focus"
            variants={chatVariants}
          >
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-neon-blue-primary/60" />
              </div>
              <motion.input
                type="text"
                placeholder="Ask AI anything..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="input-elite w-full pl-10 pr-4 py-3 bg-dark-secondary/40 backdrop-blur-lg border-2 border-neon-blue-primary/30 rounded-full text-text-primary placeholder-text-muted focus:border-neon-blue-primary focus:ring-2 focus:ring-neon-blue-primary/20 transition-all duration-300"
                whileFocus={{
                  scale: 1.02,
                  boxShadow: '0 0 25px rgba(0, 210, 255, 0.3)',
                }}
              />
              {chatInput && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <button className="w-8 h-8 rounded-full bg-gradient-blue flex items-center justify-center hover:shadow-glow-blue transition-all duration-300">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Right: Thrive Progress Pill + Profile Dropdown */}
          <div className="flex items-center space-x-4">
            
            {/* Thrive Progress Pill */}
            <motion.div
              variants={thriveVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-full bg-dark-secondary/60 border border-neon-green-primary/30 backdrop-blur-lg"
            >
              <div className="relative w-8 h-8">
                {/* Background circle */}
                <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="rgba(0, 255, 136, 0.2)"
                    strokeWidth="2"
                  />
                  {/* Progress circle */}
                  <motion.circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="var(--neon-green-primary)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={strokeDasharray}
                    initial={{ strokeDasharray: `0 ${circumference}` }}
                    animate={{ strokeDasharray }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className="filter drop-shadow-lg"
                    style={{ filter: 'drop-shadow(0 0 4px var(--neon-green-primary))' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-neon-green-primary">
                    {thriveProgress}
                  </span>
                </div>
              </div>
              <span className="text-sm font-medium text-neon-green-light">Thrive</span>
            </motion.div>

            {/* Profile Dropdown */}
            <div className="relative">
              <motion.button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-2 rounded-full hover:bg-dark-hover/50 transition-colors duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-blue flex items-center justify-center overflow-hidden">
                  <UserCircleIcon className="w-6 h-6 text-white" />
                </div>
                <motion.div
                  animate={{ rotate: isProfileOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="hidden sm:block"
                >
                  <ChevronDownIcon className="w-4 h-4 text-text-secondary" />
                </motion.div>
              </motion.button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="absolute right-0 mt-2 w-56 rounded-lg bg-dark-secondary/95 backdrop-blur-xl border border-neon-blue-primary/30 shadow-glow-blue overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-neon-blue-primary/20">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-blue flex items-center justify-center">
                          <UserCircleIcon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">Elite User</p>
                          <p className="text-sm text-text-muted">user@protothrive.com</p>
                        </div>
                      </div>
                    </div>
                    <div className="py-2">
                      {[
                        { label: 'Dashboard', icon: '📊' },
                        { label: 'Projects', icon: '🚀' },
                        { label: 'Settings', icon: '⚙️' },
                        { label: 'Analytics', icon: '📈' },
                      ].map((item, index) => (
                        <motion.button
                          key={item.label}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-dark-hover/50 transition-colors duration-200"
                          whileHover={{ x: 4 }}
                        >
                          <span className="text-lg">{item.icon}</span>
                          <span className="text-text-primary">{item.label}</span>
                        </motion.button>
                      ))}
                      <div className="border-t border-neon-blue-primary/20 mt-2 pt-2">
                        <motion.button
                          className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-red-500/10 transition-colors duration-200"
                          whileHover={{ x: 4 }}
                        >
                          <span className="text-lg">🚪</span>
                          <span className="text-red-400">Sign Out</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {isProfileOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsProfileOpen(false)}
        />
      )}
    </motion.header>
  );
};

export default Header;