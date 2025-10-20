/**
 * Enhanced Header Component
 * Enterprise navigation with SSO integration and enhanced features
 * Ref: CLAUDE.md Phase 3 - Enterprise Features
 */

import React, { useState } from 'react';
import { UserButton } from "@clerk/nextjs";
import { Sparkles, Menu, Settings } from "lucide-react";
import {
  ChartBarIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  BellIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import Link from 'next/link';

interface HeaderProps {
  isMobile: boolean;
  isTablet: boolean;
  onToggleSidebar: () => void;
}

const enterpriseNavItems = [
  { href: '/analytics', label: 'Analytics', icon: ChartBarIcon },
  { href: '/enterprise', label: 'Enterprise', icon: BuildingOfficeIcon },
  { href: '/admin', label: 'Admin', icon: ShieldCheckIcon },
];

export function Header({ isMobile, isTablet, onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  const [showEnterpriseMenu, setShowEnterpriseMenu] = useState(false);

  return (
    <>
      {/* Skip Links for Accessibility */}
      <div className="sr-only">
        <a 
          href="#main-content" 
          className="absolute top-0 left-0 z-[9999] p-2 bg-neon-blue-primary text-white focus:not-sr-only focus:relative"
        >
          Skip to main content
        </a>
        <a 
          href="#navigation" 
          className="absolute top-0 left-20 z-[9999] p-2 bg-neon-blue-primary text-white focus:not-sr-only focus:relative"
        >
          Skip to navigation
        </a>
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-dark-secondary/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center space-x-4">
        {(isMobile || isTablet) && (
          <button
            onClick={onToggleSidebar}
            className="p-3 rounded-md hover:bg-dark-tertiary focus:outline-none focus:ring-2 focus:ring-neon-blue-primary min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Toggle sidebar navigation"
          >
            <Menu className="h-7 w-7 text-neon-blue-primary" />
          </button>
        )}
        <Sparkles className="h-8 w-8 text-neon-blue-primary animate-neon-glow" />
        <h1 className="text-2xl font-bold text-neon-blue-primary drop-shadow-lg">ProtoThrive</h1>

        {/* Enterprise Navigation */}
        {!isMobile && (
          <nav id="navigation" className="flex items-center space-x-6 ml-8">
            <Link href="/demo" className="text-text-secondary hover:text-neon-blue-primary transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
              Dashboard
            </Link>

            {/* Enterprise Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowEnterpriseMenu(!showEnterpriseMenu)}
                className="flex items-center space-x-1 text-text-secondary hover:text-neon-blue-primary transition-colors p-3 min-w-[44px] min-h-[44px] rounded focus:outline-none focus:ring-2 focus:ring-neon-blue-primary"
                aria-expanded={showEnterpriseMenu}
                aria-haspopup="true"
                aria-label="Enterprise menu"
              >
                <BuildingOfficeIcon className="h-5 w-5" />
                <span>Enterprise</span>
              </button>

              {showEnterpriseMenu && (
                <div className="absolute top-full left-0 mt-2 w-48 glass-elite border border-border rounded-lg shadow-lg z-50">
                  {enterpriseNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center space-x-2 px-4 py-2 text-text-secondary hover:text-neon-blue-primary hover:bg-dark-tertiary transition-colors first:rounded-t-lg last:rounded-b-lg"
                      onClick={() => setShowEnterpriseMenu(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
        )}
      </div>

      <div className="flex-1 mx-8">
        {/* Enhanced AI Chat Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Ask ProtoThrive AI anything..."
            className="w-full p-3 rounded-lg bg-dark-tertiary border border-border focus:outline-none focus:ring-2 focus:ring-neon-blue-primary focus:border-neon-blue-primary text-text-primary placeholder-text-muted"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-2 h-2 bg-neon-green-primary rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Enhanced Thrive Score */}
        <div className="flex items-center space-x-2 bg-dark-tertiary p-3 rounded-lg border border-border">
          <span className="text-sm text-text-muted">Thrive:</span>
          <div className="w-12 h-2 bg-dark-primary rounded-full relative overflow-hidden">
            <div
              className="absolute inset-0 bg-gradient-to-r from-neon-blue-primary to-neon-green-primary rounded-full transition-all duration-1000"
              style={{ width: '85%' }}
            ></div>
          </div>
          <span className="text-sm font-bold text-neon-green-primary">85%</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button 
            className="p-3 rounded-lg bg-dark-tertiary hover:bg-dark-secondary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-neon-blue-primary"
            aria-label="View notifications"
          >
            <BellIcon className="h-6 w-6 text-text-muted" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-neon-orange rounded-full" aria-hidden="true"></span>
          </button>
        </div>

        {/* Team Indicator */}
        <div className="flex items-center space-x-2 bg-dark-tertiary p-2 rounded-lg">
          <UserGroupIcon className="h-4 w-4 text-neon-purple" />
          <span className="text-xs text-text-muted">3 online</span>
        </div>

        {/* Settings Button */}
        <button
          onClick={() => router.push('/settings')}
          className="p-3 rounded-lg bg-dark-tertiary hover:bg-dark-secondary focus:outline-none focus:ring-2 focus:ring-neon-blue-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Settings"
          aria-label="Open settings"
        >
          <Settings className="h-6 w-6 text-text-muted hover:text-neon-blue-primary" />
        </button>

        {/* Enhanced Profile with Enterprise Features */}
        <div className="relative">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-9 h-9 border-2 border-neon-blue-primary rounded-lg",
                userButtonPopover: "bg-dark-secondary border border-border"
              }
            }}
          />
        </div>
      </div>
    </header>
    </>
  );
}
