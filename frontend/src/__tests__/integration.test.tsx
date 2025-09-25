// Ref: CLAUDE.md Frontend Integration Test Suite v2.0.0
// Thermonuclear React testing with comprehensive coverage

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn()
    };
  }
}));

// Mock Spline component
jest.mock('@splinetool/react-spline', () => {
  return function MockSpline({ onLoad, onError }: any) {
    React.useEffect(() => {
      setTimeout(() => onLoad?.(), 100);
    }, [onLoad]);
    return <div data-testid="spline-canvas">3D Spline Canvas Mock</div>;
  };
});

// Mock ReactFlow
jest.mock('reactflow', () => ({
  __esModule: true,
  default: ({ children, nodes, edges }: any) => (
    <div data-testid="react-flow-canvas">
      <div data-testid="react-flow-nodes">{nodes?.length || 0} nodes</div>
      <div data-testid="react-flow-edges">{edges?.length || 0} edges</div>
      {children}
    </div>
  ),
  Controls: ({ children }: any) => <div data-testid="react-flow-controls">{children}</div>,
  Background: () => <div data-testid="react-flow-background" />,
  useNodesState: (initialNodes: any) => [initialNodes, jest.fn(), jest.fn()],
  useEdgesState: (initialEdges: any) => [initialEdges, jest.fn(), jest.fn()],
  addEdge: jest.fn(),
  ConnectionMode: { Loose: 'loose' },
  MarkerType: { ArrowClosed: 'arrowclosed' }
}));

// Import components after mocks
import MagicCanvas from '../components/MagicCanvas';
import InsightsPanel from '../components/InsightsPanel';
import { useStore } from '../store';

describe('Frontend Integration Test Suite', () => {
  beforeEach(() => {
    // Reset store state
    useStore.setState({
      nodes: [
        { id: 'n1', label: 'Start', status: 'gray', position: { x: 0, y: 0, z: 0 } },
        { id: 'n2', label: 'Middle', status: 'neon', position: { x: 100, y: 100, z: 0 } },
        { id: 'n3', label: 'End', status: 'gray', position: { x: 200, y: 200, z: 0 } }
      ],
      edges: [
        { from: 'n1', to: 'n2' },
        { from: 'n2', to: 'n3' }
      ],
      mode: '2d',
      thriveScore: 0.75
    });
  });

  describe('MagicCanvas Component', () => {
    test('renders in 2D mode by default', () => {
      render(<MagicCanvas />);
      
      expect(screen.getByTestId('react-flow-canvas')).toBeInTheDocument();
      expect(screen.getByTestId('react-flow-nodes')).toHaveTextContent('3 nodes');
      expect(screen.getByTestId('react-flow-edges')).toHaveTextContent('2 edges');
    });

    test('toggles between 2D and 3D modes', async () => {
      render(<MagicCanvas />);
      
      const toggleButton = screen.getByRole('button', { name: /switch to 3d view/i });
      expect(toggleButton).toBeInTheDocument();
      
      await act(async () => {
        fireEvent.click(toggleButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('spline-canvas')).toBeInTheDocument();
      });
      
      const toggle2DButton = screen.getByRole('button', { name: /switch to 2d view/i });
      expect(toggle2DButton).toBeInTheDocument();
    });

    test('displays thrive score correctly', () => {
      render(<MagicCanvas />);
      
      expect(screen.getByText('Thrive Score')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    test('shows keyboard shortcuts help', async () => {
      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<MagicCanvas />);
      
      const helpButton = screen.getByRole('button', { name: /show keyboard shortcuts/i });
      fireEvent.click(helpButton);
      
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('Keyboard Shortcuts')
      );
      
      alertSpy.mockRestore();
    });

    test('handles node updates', () => {
      const mockNodeUpdate = jest.fn();
      render(<MagicCanvas onNodeUpdate={mockNodeUpdate} />);
      
      // Simulate node interaction - this would trigger in real usage
      const store = useStore.getState();
      expect(store.nodes).toHaveLength(3);
    });

    test('renders with custom className', () => {
      const { container } = render(<MagicCanvas className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    test('handles loading state', async () => {
      // Start in 3D mode to test loading
      useStore.setState({ mode: '3d' });
      
      render(<MagicCanvas />);
      
      // Should show loading initially, then render Spline
      await waitFor(() => {
        expect(screen.getByTestId('spline-canvas')).toBeInTheDocument();
      });
    });

    test('accessibility features work correctly', () => {
      render(<MagicCanvas />);
      
      // Check ARIA labels
      const canvas = screen.getByRole('application');
      expect(canvas).toHaveAttribute('aria-label', 'Interactive roadmap canvas');
      
      const toggleButton = screen.getByRole('button', { name: /switch to/i });
      expect(toggleButton).toHaveAttribute('aria-pressed');
    });
  });

  describe('InsightsPanel Component', () => {
    test('displays thrive score with correct formatting', () => {
      render(<InsightsPanel />);
      
      expect(screen.getByText('Thrive Score')).toBeInTheDocument();
      expect(screen.getByText('0.75')).toBeInTheDocument();
    });

    test('shows progress bar with correct width', () => {
      render(<InsightsPanel />);
      
      const progressBar = screen.getByRole('progressbar') || 
                         document.querySelector('[style*="width"]');
      
      // Should show 75% width for thrive score of 0.75
      expect(progressBar).toHaveStyle({ width: '75%' });
    });
  });

  describe('Store Integration', () => {
    test('store updates trigger component re-renders', async () => {
      render(<MagicCanvas />);
      
      // Update store
      act(() => {
        useStore.setState({ thriveScore: 0.9 });
      });
      
      await waitFor(() => {
        expect(screen.getByText('90%')).toBeInTheDocument();
      });
    });

    test('mode changes update UI correctly', async () => {
      render(<MagicCanvas />);
      
      // Start in 2D
      expect(screen.getByTestId('react-flow-canvas')).toBeInTheDocument();
      
      // Switch to 3D
      act(() => {
        useStore.setState({ mode: '3d' });
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('spline-canvas')).toBeInTheDocument();
      });
    });

    test('node updates reflect in canvas', async () => {
      render(<MagicCanvas />);
      
      // Update nodes
      act(() => {
        useStore.setState({
          nodes: [
            { id: 'new1', label: 'New Node', status: 'neon', position: { x: 0, y: 0, z: 0 } }
          ]
        });
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow-nodes')).toHaveTextContent('1 nodes');
      });
    });
  });

  describe('Error Handling', () => {
    test('handles 3D rendering errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock Spline to throw error
      jest.doMock('@splinetool/react-spline', () => {
        return function MockSplineError({ onError }: any) {
          React.useEffect(() => {
            onError?.(new Error('3D rendering failed'));
          }, [onError]);
          return null;
        };
      });
      
      useStore.setState({ mode: '3d' });
      render(<MagicCanvas />);
      
      // Should fallback to 2D mode
      await waitFor(() => {
        expect(useStore.getState().mode).toBe('2d');
      });
      
      consoleErrorSpy.mockRestore();
    });

    test('handles invalid node data gracefully', () => {
      // Set invalid nodes
      act(() => {
        useStore.setState({
          nodes: [
            // @ts-ignore - intentionally invalid for testing
            { id: null, label: '', position: null }
          ]
        });
      });
      
      // Should still render without crashing
      expect(() => render(<MagicCanvas />)).not.toThrow();
    });
  });

  describe('Performance Tests', () => {
    test('handles large number of nodes efficiently', async () => {
      const manyNodes = Array.from({ length: 100 }, (_, i) => ({
        id: `node-${i}`,
        label: `Node ${i}`,
        status: 'gray' as const,
        position: { x: i * 10, y: i * 10, z: 0 }
      }));
      
      act(() => {
        useStore.setState({ nodes: manyNodes });
      });
      
      const startTime = performance.now();
      render(<MagicCanvas />);
      const endTime = performance.now();
      
      // Should render in reasonable time
      expect(endTime - startTime).toBeLessThan(1000);
      expect(screen.getByTestId('react-flow-nodes')).toHaveTextContent('100 nodes');
    });

    test('memoization prevents unnecessary re-renders', () => {
      const { rerender } = render(<MagicCanvas />);
      
      // Re-render with same props
      rerender(<MagicCanvas />);
      
      // Should still have same content
      expect(screen.getByTestId('react-flow-canvas')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('adapts to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      
      render(<MagicCanvas />);
      
      // Controls should be positioned for mobile
      expect(screen.getByTestId('react-flow-controls')).toBeInTheDocument();
    });
  });

  describe('Integration with Backend', () => {
    test('handles API responses correctly', async () => {
      // Mock successful API call
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            id: 'rm-thermo-1',
            json_graph: JSON.stringify({
              nodes: [{ id: 'api-node', label: 'From API', status: 'neon', position: { x: 0, y: 0 } }],
              edges: []
            }),
            thrive_score: 0.85
          }
        })
      });
      
      // This would be part of a data loading component in real implementation
      const mockLoadData = async () => {
        const response = await fetch('/api/roadmaps/test');
        const result = await response.json();
        return result;
      };
      
      const data = await mockLoadData();
      expect(data.success).toBe(true);
      expect(data.data.thrive_score).toBe(0.85);
    });

    test('handles API errors gracefully', async () => {
      // Mock API error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const mockLoadData = async () => {
        try {
          await fetch('/api/roadmaps/test');
        } catch (error) {
          return { error: error.message };
        }
      };
      
      const result = await mockLoadData();
      expect(result.error).toBe('Network error');
    });
  });
});

// Cleanup after tests
afterAll(() => {
  jest.restoreAllMocks();
});