/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  memoized,
  useExpensiveCalculation,
  useStableCallback,
  useIntersectionObserver,
  ErrorBoundary,
  usePerformanceMonitor
} from '../utils/performance';

// Mock performance.now for consistent testing
const mockPerformanceNow = jest.fn();
Object.defineProperty(window, 'performance', {
  value: {
    now: mockPerformanceNow
  }
});

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

describe('Performance Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformanceNow.mockReturnValue(1000);
  });

  describe('memoized', () => {
    const TestComponent = ({ value }: { value: number }) => (
      <div data-testid="test-component">{value}</div>
    );

    it('should memoize a component', () => {
      const MemoizedComponent = memoized(TestComponent);
      const { rerender } = render(<MemoizedComponent value={1} />);
      
      expect(screen.getByTestId('test-component')).toHaveTextContent('1');
      
      rerender(<MemoizedComponent value={2} />);
      expect(screen.getByTestId('test-component')).toHaveTextContent('2');
    });
  });

  describe('useExpensiveCalculation', () => {
    const TestComponent = ({ value }: { value: number }) => {
      const result = useExpensiveCalculation(() => {
        return value * 2;
      }, [value]);

      return <div data-testid="result">{result}</div>;
    };

    it('should calculate expensive values', () => {
      render(<TestComponent value={5} />);
      expect(screen.getByTestId('result')).toHaveTextContent('10');
    });

    it('should recalculate when dependencies change', () => {
      const { rerender } = render(<TestComponent value={5} />);
      expect(screen.getByTestId('result')).toHaveTextContent('10');
      
      rerender(<TestComponent value={10} />);
      expect(screen.getByTestId('result')).toHaveTextContent('20');
    });
  });

  describe('useStableCallback', () => {
    const TestComponent = ({ onAction }: { onAction: (value: number) => void }) => {
      const stableCallback = useStableCallback((value: number) => {
        onAction(value);
      }, [onAction]);

      return (
        <button 
          data-testid="action-button" 
          onClick={() => stableCallback(42)}
        >
          Action
        </button>
      );
    };

    it('should provide stable callbacks', () => {
      const mockAction = jest.fn();
      render(<TestComponent onAction={mockAction} />);
      
      fireEvent.click(screen.getByTestId('action-button'));
      expect(mockAction).toHaveBeenCalledWith(42);
    });
  });

  describe('useIntersectionObserver', () => {
    const TestComponent = () => {
      const [ref, isIntersecting] = useIntersectionObserver();
      
      return (
        <div>
          <div ref={ref} data-testid="observed-element">Observed</div>
          <div data-testid="intersection-status">
            {isIntersecting ? 'visible' : 'hidden'}
          </div>
        </div>
      );
    };

    it('should set up intersection observer', () => {
      render(<TestComponent />);
      expect(mockIntersectionObserver).toHaveBeenCalled();
    });

    it('should show initial hidden state', () => {
      render(<TestComponent />);
      expect(screen.getByTestId('intersection-status')).toHaveTextContent('hidden');
    });
  });

  describe('ErrorBoundary', () => {
    const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>No error</div>;
    };

    it('should render children when no error', () => {
      render(
        <ErrorBoundary fallback={<div>Error occurred</div>}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should render fallback when error occurs', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <ErrorBoundary fallback={<div>Error occurred</div>}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('usePerformanceMonitor', () => {
    const TestComponent = ({ name }: { name: string }) => {
      usePerformanceMonitor(name);
      return <div>Test Component</div>;
    };

    it('should monitor performance', () => {
      mockPerformanceNow.mockReturnValueOnce(1000).mockReturnValueOnce(1100);
      
      render(<TestComponent name="test-component" />);
      
      // The hook should log performance data
      // We can't easily test the console.log output, but we can verify the hook doesn't crash
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });
  });
});

describe('LazyComponent', () => {
  it('should be available as React.lazy', () => {
    const LazyComponent = React.lazy(() => Promise.resolve({ default: () => <div>Lazy</div> }));
    expect(LazyComponent).toBeDefined();
  });
});
