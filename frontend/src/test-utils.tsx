import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

// Global mock for framer-motion to prevent DOM warnings
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, whileTap, initial, animate, exit, variants, transition, layout, layoutId, ...props }: any) =>
      <div {...props}>{children}</div>,
    button: ({ children, whileHover, whileTap, initial, animate, exit, variants, transition, layout, layoutId, ...props }: any) =>
      <button {...props}>{children}</button>,
    span: ({ children, whileHover, whileTap, initial, animate, exit, variants, transition, layout, layoutId, ...props }: any) =>
      <span {...props}>{children}</span>,
    p: ({ children, whileHover, whileTap, initial, animate, exit, variants, transition, layout, layoutId, ...props }: any) =>
      <p {...props}>{children}</p>,
    h1: ({ children, whileHover, whileTap, initial, animate, exit, variants, transition, layout, layoutId, ...props }: any) =>
      <h1 {...props}>{children}</h1>,
    h2: ({ children, whileHover, whileTap, initial, animate, exit, variants, transition, layout, layoutId, ...props }: any) =>
      <h2 {...props}>{children}</h2>,
    h3: ({ children, whileHover, whileTap, initial, animate, exit, variants, transition, layout, layoutId, ...props }: any) =>
      <h3 {...props}>{children}</h3>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
  useMotionValue: (initial: any) => ({ get: () => initial, set: jest.fn() }),
  useTransform: () => ({ get: () => 0 }),
}));

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root: Element | null = null;
  rootMargin: string = '';
  thresholds: ReadonlyArray<number> = [];

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}
  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: jest.fn(),
});

// Test wrapper with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider defaultTheme="dark" defaultEliteMode={true}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };