import React from 'react';
import ReactDOM from 'react-dom';
import { render, RenderOptions, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';

// Enhanced test utilities for complex component testing
export const createMockUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  provider: 'google' as const,
  uid: 'test-uid',
});

export const createMockNotification = (overrides = {}) => ({
  id: 'test-notification-id',
  message: 'Test notification message',
  type: 'info' as const,
  priority: 'medium' as const,
  timestamp: Date.now(),
  read: false,
  ...overrides,
});

export const createMockRoadmap = (overrides = {}) => ({
  id: 'test-roadmap-id',
  title: 'Test Roadmap',
  description: 'Test roadmap description',
  nodes: [
    { id: 'node-1', label: 'Start', type: 'start', position: { x: 0, y: 0 } },
    { id: 'node-2', label: 'Middle', type: 'task', position: { x: 100, y: 100 } },
    { id: 'node-3', label: 'End', type: 'end', position: { x: 200, y: 200 } },
  ],
  edges: [
    { id: 'edge-1', source: 'node-1', target: 'node-2' },
    { id: 'edge-2', source: 'node-2', target: 'node-3' },
  ],
  ...overrides,
});

// Mock providers for testing
const TestProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider defaultTheme="dark" defaultEliteMode={true}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
};

// Enhanced render function with built-in user event
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  const user = userEvent.setup();
  return {
    user,
    ...render(ui, { wrapper: TestProviders, ...options }),
  };
};

// Helper to wait for animations to complete
export const waitForAnimations = () => new Promise(resolve => setTimeout(resolve, 500));

// Helper to mock timers for animation testing
export const setupAnimationMocks = () => {
  jest.useFakeTimers();
  return {
    advanceTime: (ms: number) => {
      jest.advanceTimersByTime(ms);
      return new Promise(resolve => setTimeout(resolve, 0));
    },
    cleanup: () => {
      jest.useRealTimers();
    },
  };
};

// Mock fetch for API testing
export const createMockFetch = (response: any) => {
  return jest.fn().mockResolvedValue({
    ok: true,
    json: async () => response,
    text: async () => JSON.stringify(response),
  });
};

// Helper for testing keyboard navigation
export const testKeyboardNavigation = async (user: ReturnType<typeof userEvent.setup>) => {
  const focusableElements = screen.getAllByRole('button').concat(
    screen.queryAllByRole('link'),
    screen.queryAllByRole('textbox'),
    screen.queryAllByRole('combobox'),
  );

  for (const element of focusableElements) {
    await user.tab();
    expect(element).toHaveFocus();
  }
};

// Helper for testing accessibility
export const getAccessibilityViolations = async (container: HTMLElement) => {
  // Mock implementation for accessibility testing
  // In production, this would use @axe-core/react
  console.log('Mock accessibility check for container:', container.tagName);
  return Promise.resolve([]);
};

export * from '@testing-library/react';
export { screen, userEvent };