/**
 * Responsive Navigation Component with WCAG AA Compliance
 * Features: Mobile hamburger menu, keyboard navigation, ARIA labels, focus management
 */

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Menu, X, ChevronDown, Home, LayoutDashboard, BarChart3, Settings, HelpCircle, LogOut, LogIn, UserPlus } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
  requiresAuth?: boolean;
}

interface ResponsiveNavProps {
  isAuthenticated?: boolean;
  currentUser?: { name: string; email: string };
}

export const ResponsiveNav: React.FC<ResponsiveNavProps> = ({
  isAuthenticated = false,
  currentUser
}) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [focusedItemIndex, setFocusedItemIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navItemsRef = useRef<(HTMLElement | null)[]>([]);

  // Navigation items configuration
  const navItems: NavItem[] = [
    { label: t('nav.home'), href: '/', icon: Home },
    {
      label: t('nav.dashboard'),
      href: '/dashboard',
      icon: LayoutDashboard,
      requiresAuth: true
    },
    {
      label: t('nav.analytics'),
      href: '/analytics',
      icon: BarChart3,
      requiresAuth: true
    },
    {
      label: t('nav.settings'),
      href: '/settings',
      icon: Settings,
      requiresAuth: true,
      children: [
        { label: t('nav.profile'), href: '/settings/profile' },
        { label: t('nav.security'), href: '/settings/security' },
        { label: t('nav.preferences'), href: '/settings/preferences' }
      ]
    },
    { label: t('nav.help'), href: '/help', icon: HelpCircle }
  ];

  const authItems: NavItem[] = isAuthenticated
    ? [{ label: t('nav.logout'), href: '/logout', icon: LogOut }]
    : [
        { label: t('nav.login'), href: '/login', icon: LogIn },
        { label: t('nav.signup'), href: '/signup', icon: UserPlus }
      ];

  // Filter items based on authentication status
  const visibleNavItems = navItems.filter(item => !item.requiresAuth || isAuthenticated);
  const allItems = [...visibleNavItems, ...authItems];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setActiveDropdown(null);
        menuButtonRef.current?.focus();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isMobileMenuOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isMobileMenuOpen) return;

      const navItemElements = navItemsRef.current.filter(Boolean);
      const maxIndex = navItemElements.length - 1;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedItemIndex(prev => (prev < maxIndex ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedItemIndex(prev => (prev > 0 ? prev - 1 : maxIndex));
          break;
        case 'Home':
          e.preventDefault();
          setFocusedItemIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusedItemIndex(maxIndex);
          break;
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isMobileMenuOpen]);

  // Focus management
  useEffect(() => {
    if (focusedItemIndex >= 0 && navItemsRef.current[focusedItemIndex]) {
      navItemsRef.current[focusedItemIndex]?.focus();
    }
  }, [focusedItemIndex]);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
    if (!isMobileMenuOpen) {
      setTimeout(() => setFocusedItemIndex(0), 100);
    }
  };

  // Check if current route matches
  const isActive = (href: string) => router.pathname === href;

  return (
    <nav
      ref={menuRef}
      className="bg-gray-900 border-b border-gray-700"
      role="navigation"
      aria-label={t('navigation.mainMenu')}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-blue bg-clip-text text-transparent hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm px-2"
              aria-label={t('app.name') + ' - ' + t('nav.home')}
            >
              ProtoThrive
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {visibleNavItems.map(item => (
                <div key={item.href} className="relative">
                  {item.children ? (
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === item.href ? null : item.href)}
                      className={`
                        inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
                        ${isActive(item.href)
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }
                      `}
                      aria-expanded={activeDropdown === item.href}
                      aria-haspopup="true"
                    >
                      {item.icon && <item.icon className="w-4 h-4" />}
                      {item.label}
                      <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === item.href ? 'rotate-180' : ''}`} />
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className={`
                        inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
                        ${isActive(item.href)
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }
                      `}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                    >
                      {item.icon && <item.icon className="w-4 h-4" />}
                      {item.label}
                    </Link>
                  )}

                  {/* Dropdown menu */}
                  {item.children && activeDropdown === item.href && (
                    <div className="absolute z-10 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5">
                      <div className="py-1" role="menu" aria-orientation="vertical">
                        {item.children.map(child => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors focus:outline-none focus:bg-gray-700"
                            role="menuitem"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Auth buttons */}
              <div className="ml-4 flex items-center space-x-2">
                {authItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {item.icon && <item.icon className="w-4 h-4" />}
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              ref={menuButtonRef}
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileMenuOpen ? t('accessibility.closeMenu') : t('accessibility.openMenu')}
            >
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        id="mobile-menu"
        className={`md:hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-800">
          {allItems.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              ref={el => { navItemsRef.current[index] = el }}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium
                transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
                ${isActive(item.href)
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }
              `}
              onClick={() => setIsMobileMenuOpen(false)}
              aria-current={isActive(item.href) ? 'page' : undefined}
              tabIndex={isMobileMenuOpen ? 0 : -1}
            >
              {item.icon && <item.icon className="w-5 h-5" />}
              {item.label}
            </Link>
          ))}

          {/* User info in mobile menu */}
          {isAuthenticated && currentUser && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="px-3 py-2 text-sm text-gray-400">
                <div className="font-medium text-white">{currentUser.name}</div>
                <div className="text-xs">{currentUser.email}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default ResponsiveNav;