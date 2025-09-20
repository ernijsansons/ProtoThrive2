import React from 'react';
// Ref: CLAUDE.md Phase 2 - Jest tests for MagicCanvas
import { render, screen, fireEvent } from '@testing-library/react';
import { MagicCanvas } from '../src/components/magic-canvas';
// import Dashboard from '../src/pages/index'; // Dashboard is now in app/dashboard/page.tsx
import { useStore } from '../src/store';

// Mock Spline and ReactFlow
jest.mock('@splinetool/react-spline', () => {
  return function MockSpline() {
    return <div data-testid="spline-mock">3D Scene Mock</div>;
  };
});

jest.mock('reactflow', () => ({
  // Mock useReactFlow to return a simple project function
  useReactFlow: () => ({
    project: jest.fn((position) => position), // Simple mock: returns the same position
  }),
  // Mock other ReactFlow exports as needed
  Background: () => <div data-testid="reactflow-background-mock" />,
  Controls: () => <div data-testid="reactflow-controls-mock" />,
  MiniMap: () => <div data-testid="reactflow-minimap-mock" />,
  ReactFlow: ({ children, ...props }) => (
    <div data-testid="reactflow-mock" {...props}>
      {children}
    </div>
  ),
}));

// Mock zustand store
jest.mock('../src/store');

// Mock utils/mocks (if still needed, otherwise remove)
// jest.mock('@/utils/mocks');

describe('MagicCanvas', () => {
  const mockStore = {
    nodes: [
      {id: 'n1', type: 'custom', data: { label: 'Thermo Start', status: 'gray' }, position: {x: 0, y: 0, z: 0}}
    ],
    edges: [
      {id: 'e1-2', source: 'n1', target: 'n2', type: 'custom', data: { label: 'edge' }},
    ],
    mode: '2d' as const,
    thriveScore: 0.45,
    toggleMode: jest.fn(),
    loadGraph: jest.fn(),
    updateScore: jest.fn()
  };

  beforeEach(() => {
    (useStore as unknown as jest.Mock).mockReturnValue(mockStore);
    jest.clearAllMocks();
  });

  test('renders canvas in 2D mode', () => {
    render(<MagicCanvas />);
    expect(screen.getByTestId('reactflow-mock')).toBeInTheDocument();
    expect(screen.queryByTestId('spline-mock')).not.toBeInTheDocument();
  });

  test('renders canvas in 3D mode when mode is 3d', () => {
    const mockStoreWith3D = { ...mockStore, mode: '3d' as const };
    (useStore as unknown as jest.Mock).mockReturnValue(mockStoreWith3D);
    
    render(<MagicCanvas />);
    expect(screen.getByTestId('spline-mock')).toBeInTheDocument();
    expect(screen.queryByTestId('reactflow-mock')).not.toBeInTheDocument();
  });

  test('toggle mode button calls toggleMode', () => {
    render(<MagicCanvas />);
    const toggleButton = screen.getByText('Toggle Mode');
    fireEvent.click(toggleButton);
    expect(mockStore.toggleMode).toHaveBeenCalledTimes(1);
  });

  // Test drag and drop functionality
  test('drag and drop adds a new node', () => {
    const { container } = render(<MagicCanvas />);
    const reactFlowWrapper = container.querySelector('[data-testid="reactflow-mock"]');

    if (!reactFlowWrapper) {
      throw new Error("ReactFlow wrapper not found");
    }

    // Mock getBoundingClientRect for the wrapper ref
    Object.defineProperty(reactFlowWrapper, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 500, height: 500, x: 0, y: 0, bottom: 500, right: 500 }),
    });

    const dataTransfer = {
      getData: jest.fn((type) => {
        if (type === 'application/reactflow') {
          return JSON.stringify({ type: 'custom', label: 'New Template' });
        }
        return '';
      }),
      dropEffect: 'move',
    };

    fireEvent.dragOver(reactFlowWrapper, { dataTransfer });
    fireEvent.drop(reactFlowWrapper, { dataTransfer, clientX: 100, clientY: 100 });

    expect(mockStore.loadGraph).toHaveBeenCalledTimes(1);
    const newNodes = mockStore.loadGraph.mock.calls[0][0];
    expect(newNodes.length).toBe(mockStore.nodes.length + 1);
    expect(newNodes[newNodes.length - 1].data.label).toBe('New Template');
  });
});

// Commenting out Dashboard tests for now
/*
describe('Dashboard', () => {
  const mockStore = {
    nodes: [
      {id: 'n1', label: 'Thermo Start', status: 'gray' as const, position: {x: 0, y: 0, z: 0}}
    ],
    edges: [{from: 'n1', to: 'n2'}],
    mode: '2d' as const,
    thriveScore: 0.45,
    toggleMode: jest.fn(),
    loadGraph: jest.fn(),
    updateScore: jest.fn()
  };

  beforeEach(() => {
    (useStore as unknown as jest.Mock).mockReturnValue(mockStore);
    jest.clearAllMocks();
  });

  test('renders canvas', () => {
    render(<Dashboard />);
    expect(screen.getByTestId('reactflow-mock')).toBeInTheDocument();
  });

  test('toggle mode', () => {
    render(<Dashboard />);
    fireEvent.click(screen.getByText('Toggle Mode'));
    expect(mockStore.toggleMode).toHaveBeenCalled();
  });

  test('dummy node shows Thermo Start', () => {
    render(<MagicCanvas />);
    // The node label 'Thermo Start' exists in our mock data
    expect(screen.getByText(/Start/i)).toBeInTheDocument();
  });
});
*/
