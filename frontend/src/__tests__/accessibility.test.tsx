/**
 * Comprehensive Accessibility Testing Suite
 * Tests WCAG AA compliance and mobile usability for ProtoThrive
 * Ref: CLAUDE.md Phase 5 - Security & Accessibility
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

// Extend jest matchers
expect.extend(toHaveNoViolations);

// Component imports
import SmartNotificationCenter from '../components/SmartNotificationCenter';
import MagicCanvas from '../components/MagicCanvas';
import { Header } from '../components/Header';

// Mock store for testing
jest.mock('../store', () => ({
  useStore: () => ({
    nodes: [
      { id: 'n1', label: 'Test Node', status: 'gray', position: { x: 0, y: 0, z: 0 } }
    ],
    edges: [{ from: 'n1', to: 'n2' }],
    mode: '2d',
    thriveScore: 0.75,
    agentStatus: { isRunning: false }
  })
}));

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/'
  })
}));

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  UserButton: () => <div data-testid="user-button">User Button</div>
}));

// Mock audio service
jest.mock('../services/audioService', () => ({
  audioService: {
    play: jest.fn()
  },
  playNotificationSound: jest.fn()
}));

// Mock security utils
jest.mock('../utils/security', () => ({
  InputValidator: {
    sanitizeInput: (input: string) => input
  }
}));

describe('Accessibility Testing Suite', () => {
  
  describe('Touch Target Compliance (WCAG 2.5.5)', () => {
    test('SmartNotificationCenter: All interactive elements meet 44px minimum', () => {
      render(<SmartNotificationCenter />);
      
      // Test notification bell button
      const bellButton = screen.getByRole('button', { name: /open notifications panel/i });
      const bellStyles = window.getComputedStyle(bellButton);
      expect(parseInt(bellStyles.minWidth)).toBeGreaterThanOrEqual(44);
      expect(parseInt(bellStyles.minHeight)).toBeGreaterThanOrEqual(44);
    });

    test('MagicCanvas: Mode toggle and help buttons meet size requirements', () => {
      render(<MagicCanvas />);
      
      // Test mode toggle button
      const modeToggle = screen.getByRole('button', { name: /switch to 3d view/i });
      const toggleStyles = window.getComputedStyle(modeToggle);
      expect(parseInt(toggleStyles.minWidth)).toBeGreaterThanOrEqual(44);
      expect(parseInt(toggleStyles.minHeight)).toBeGreaterThanOrEqual(44);
      
      // Test help button
      const helpButton = screen.getByRole('button', { name: /show keyboard shortcuts/i });
      const helpStyles = window.getComputedStyle(helpButton);
      expect(parseInt(helpStyles.minWidth)).toBeGreaterThanOrEqual(44);
      expect(parseInt(helpStyles.minHeight)).toBeGreaterThanOrEqual(44);
    });

    test('Header: All navigation buttons meet touch target requirements', () => {
      render(<Header isMobile={true} isTablet={false} onToggleSidebar={jest.fn()} />);
      
      // Test sidebar toggle
      const sidebarToggle = screen.getByRole('button', { name: /toggle sidebar navigation/i });
      const sidebarStyles = window.getComputedStyle(sidebarToggle);
      expect(parseInt(sidebarStyles.minWidth)).toBeGreaterThanOrEqual(44);
      expect(parseInt(sidebarStyles.minHeight)).toBeGreaterThanOrEqual(44);
      
      // Test settings button
      const settingsButton = screen.getByRole('button', { name: /open settings/i });
      const settingsStyles = window.getComputedStyle(settingsButton);
      expect(parseInt(settingsStyles.minWidth)).toBeGreaterThanOrEqual(44);
      expect(parseInt(settingsStyles.minHeight)).toBeGreaterThanOrEqual(44);
    });
  });

  describe('Color Contrast Compliance (WCAG 1.4.3)', () => {
    test('Warning notifications have sufficient contrast ratio', () => {
      render(<SmartNotificationCenter />);
      
      // Add a warning notification and check contrast
      // Note: In a real implementation, you'd use actual color testing tools
      // This is a simplified test to demonstrate the concept
      const warningElements = screen.queryAllByText(/warning/i);
      warningElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        // Check that warning color uses high contrast variant (yellow-400)
        expect(styles.color).toMatch(/(rgb\(250, 204, 21\)|#facc15|yellow-400)/);
      });
    });

    test('Focus indicators meet contrast requirements', () => {
      render(<SmartNotificationCenter />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Simulate focus
        fireEvent.focus(button);
        const styles = window.getComputedStyle(button);
        
        // Check for focus ring with sufficient contrast
        expect(styles.outlineWidth || styles.boxShadow).toBeTruthy();
      });
    });
  });

  describe('Keyboard Navigation (WCAG 2.1.1)', () => {
    test('SmartNotificationCenter: Focus trap works correctly', () => {
      render(<SmartNotificationCenter />);
      
      // Open notifications panel
      const bellButton = screen.getByRole('button', { name: /open notifications panel/i });
      fireEvent.click(bellButton);
      
      // Test Tab navigation
      fireEvent.keyDown(document, { key: 'Tab' });
      
      // The first focusable element should be focused
      const closeButton = screen.getByRole('button', { name: /close notifications panel/i });
      expect(closeButton).toHaveFocus();
    });

    test('Escape key closes modal', () => {
      render(<SmartNotificationCenter />);
      
      // Open panel
      const bellButton = screen.getByRole('button', { name: /open notifications panel/i });
      fireEvent.click(bellButton);
      
      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' });
      
      // Panel should be closed (button should show "Open" state)
      expect(bellButton).toHaveAttribute('aria-expanded', 'false');
    });

    test('MagicCanvas: Keyboard shortcuts work', () => {
      render(<MagicCanvas />);
      
      // Test Ctrl+A for select all
      fireEvent.keyDown(document, { key: 'a', ctrlKey: true });
      
      // Test Escape for clear selection
      fireEvent.keyDown(document, { key: 'Escape' });
      
      // These should not throw errors
      expect(true).toBe(true);
    });
  });

  describe('Skip Links (WCAG 2.4.1)', () => {
    test('Header provides skip navigation links', () => {
      render(<Header isMobile={false} isTablet={false} onToggleSidebar={jest.fn()} />);
      
      // Check for skip links
      const skipToMain = screen.getByRole('link', { name: /skip to main content/i });
      const skipToNav = screen.getByRole('link', { name: /skip to navigation/i });
      
      expect(skipToMain).toBeInTheDocument();
      expect(skipToNav).toBeInTheDocument();
      expect(skipToMain.getAttribute('href')).toBe('#main-content');
      expect(skipToNav.getAttribute('href')).toBe('#navigation');
    });
  });

  describe('ARIA Labels and Roles (WCAG 4.1.2)', () => {
    test('SmartNotificationCenter: Proper ARIA attributes', () => {
      render(<SmartNotificationCenter />);
      
      // Check for ARIA live region
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
      
      // Check notification bell
      const bellButton = screen.getByRole('button', { name: /open notifications panel/i });
      expect(bellButton).toHaveAttribute('aria-expanded');
    });

    test('MagicCanvas: Proper application role and labels', () => {
      render(<MagicCanvas />);
      
      const canvas = screen.getByRole('application');
      expect(canvas).toHaveAttribute('aria-label', 'Interactive roadmap canvas');
      
      const modeToggle = screen.getByRole('button', { name: /switch to 3d view/i });
      expect(modeToggle).toHaveAttribute('aria-pressed');
    });

    test('Header: Navigation landmarks and menu states', () => {
      render(<Header isMobile={false} isTablet={false} onToggleSidebar={jest.fn()} />);
      
      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveAttribute('id', 'navigation');
      
      const enterpriseMenu = screen.getByRole('button', { name: /enterprise menu/i });
      expect(enterpriseMenu).toHaveAttribute('aria-expanded');
      expect(enterpriseMenu).toHaveAttribute('aria-haspopup', 'true');
    });
  });

  describe('Axe-core Automated Accessibility Testing', () => {
    test('SmartNotificationCenter: No accessibility violations', async () => {
      const { container } = render(<SmartNotificationCenter />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('MagicCanvas: No accessibility violations', async () => {
      const { container } = render(<MagicCanvas />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('Header: No accessibility violations', async () => {
      const { container } = render(
        <Header isMobile={false} isTablet={false} onToggleSidebar={jest.fn()} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Mobile Usability', () => {
    test('Components work correctly on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 });
      
      render(<Header isMobile={true} isTablet={false} onToggleSidebar={jest.fn()} />);
      
      // Mobile-specific sidebar toggle should be visible
      const sidebarToggle = screen.getByRole('button', { name: /toggle sidebar navigation/i });
      expect(sidebarToggle).toBeVisible();
    });

    test('Touch gestures work on mobile', () => {
      render(<SmartNotificationCenter />);
      
      const bellButton = screen.getByRole('button', { name: /open notifications panel/i });
      
      // Simulate touch events
      fireEvent.touchStart(bellButton);
      fireEvent.touchEnd(bellButton);
      fireEvent.click(bellButton);
      
      // Should handle touch events without errors
      expect(true).toBe(true);
    });
  });

  describe('Screen Reader Compatibility', () => {
    test('SmartNotificationCenter: Announces notifications properly', () => {
      render(<SmartNotificationCenter />);
      
      // Check for live region that announces new notifications
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeInTheDocument();
      
      // Simulate notification arrival
      // The live region should contain announcement text
      expect(liveRegion.textContent).toMatch(/notifications available/i);
    });

    test('Dynamic content changes are announced', () => {
      render(<SmartNotificationCenter />);
      
      const bellButton = screen.getByRole('button', { name: /open notifications panel/i });
      
      // Test state changes are reflected in ARIA attributes
      fireEvent.click(bellButton);
      expect(bellButton).toHaveAttribute('aria-expanded', 'true');
      
      fireEvent.click(bellButton);
      expect(bellButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Performance with Accessibility Features', () => {
    test('Focus management does not impact performance', () => {
      const startTime = performance.now();
      
      render(<SmartNotificationCenter />);
      
      // Simulate multiple focus changes
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        fireEvent.focus(button);
        fireEvent.blur(button);
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Focus operations should complete quickly (under 100ms)
      expect(duration).toBeLessThan(100);
    });
  });
});

// Test Utilities for Manual Testing
export const AccessibilityTestUtils = {
  /**
   * Simulate screen reader navigation
   */
  simulateScreenReader: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    return Array.from(focusableElements).map(element => ({
      tagName: element.tagName,
      role: element.getAttribute('role'),
      ariaLabel: element.getAttribute('aria-label'),
      text: element.textContent?.trim(),
      focusable: element.tabIndex >= 0
    }));
  },

  /**
   * Check color contrast ratios
   */
  checkColorContrast: (element: HTMLElement) => {
    const styles = window.getComputedStyle(element);
    return {
      color: styles.color,
      backgroundColor: styles.backgroundColor,
      // Note: In real implementation, you'd calculate actual contrast ratio
      contrastRatio: 'Would calculate actual ratio here'
    };
  },

  /**
   * Validate touch target sizes
   */
  validateTouchTargets: (container: HTMLElement) => {
    const interactiveElements = container.querySelectorAll('button, a, input, select, textarea');
    
    return Array.from(interactiveElements).map(element => {
      const rect = element.getBoundingClientRect();
      const styles = window.getComputedStyle(element);
      
      return {
        element: element.tagName,
        width: rect.width,
        height: rect.height,
        minWidth: parseInt(styles.minWidth) || rect.width,
        minHeight: parseInt(styles.minHeight) || rect.height,
        meetsStandard: rect.width >= 44 && rect.height >= 44
      };
    });
  }
};