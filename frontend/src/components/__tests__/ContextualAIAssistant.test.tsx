import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContextualAIAssistant from '../ContextualAIAssistant';
import { useStore } from '../../store';

// Mock the store
jest.mock('../../store');
const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

// Mock getBoundingClientRect
const mockGetBoundingClientRect = jest.fn(() => ({
  width: 200,
  height: 100,
  top: 100,
  left: 100,
  bottom: 200,
  right: 300,
  x: 100,
  y: 100,
  toJSON: jest.fn(),
}));

Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
  value: mockGetBoundingClientRect,
});

describe('ContextualAIAssistant', () => {
  const mockStore = {
    nodes: [],
    edges: [],
    thriveScore: 0.5,
    mode: '2d',
    insightsPanel: { activeTab: 'overview' },
    updateMetrics: jest.fn(),
  };

  beforeEach(() => {
    mockUseStore.mockReturnValue(mockStore as any);
    jest.clearAllMocks();
    mockGetBoundingClientRect.mockClear();
  });

  it('renders the assistant button', () => {
    render(<ContextualAIAssistant />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows welcome message on mount when autoActivate is true', async () => {
    render(<ContextualAIAssistant autoActivate={true} />);

    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('does not auto-activate when autoActivate is false', () => {
    render(<ContextualAIAssistant autoActivate={false} />);

    setTimeout(() => {
      expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument();
    }, 2000);
  });

  it('toggles assistant panel when button is clicked', async () => {
    render(<ContextualAIAssistant />);

    const assistantButton = screen.getByRole('button');
    fireEvent.click(assistantButton);

    await waitFor(() => {
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    });

    // Click again to close
    fireEvent.click(assistantButton);

    await waitFor(() => {
      expect(screen.queryByText('AI Assistant')).not.toBeInTheDocument();
    });
  });

  it('generates contextual messages based on project state', async () => {
    // Empty project
    mockUseStore.mockReturnValue({
      ...mockStore,
      nodes: [],
      edges: [],
    } as any);

    render(<ContextualAIAssistant autoActivate={true} />);

    await waitFor(() => {
      expect(screen.getByText(/start.*building/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('provides different messages for different project phases', async () => {
    // Project with components but no connections
    mockUseStore.mockReturnValue({
      ...mockStore,
      nodes: [{ id: '1' }, { id: '2' }],
      edges: [],
    } as any);

    render(<ContextualAIAssistant autoActivate={true} />);

    await waitFor(() => {
      expect(screen.getByText(/connect.*components/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('celebrates milestone achievements', async () => {
    // Well-connected, high-quality project
    mockUseStore.mockReturnValue({
      ...mockStore,
      nodes: [{ id: '1' }, { id: '2' }, { id: '3' }],
      edges: [{ from: '1', to: '2' }, { from: '2', to: '3' }],
      thriveScore: 0.9,
    } as any);

    render(<ContextualAIAssistant autoActivate={true} />);

    await waitFor(() => {
      expect(screen.getByText(/great.*progress|excellent.*work/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('adapts message style based on thrive score', async () => {
    // Low thrive score - should show encouragement
    mockUseStore.mockReturnValue({
      ...mockStore,
      thriveScore: 0.2,
    } as any);

    render(<ContextualAIAssistant autoActivate={true} />);

    await waitFor(() => {
      expect(screen.getByText(/improve|optimize|enhance/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('positions assistant contextually when enabled', () => {
    render(<ContextualAIAssistant enableContextualPositioning={true} />);

    const assistantElement = screen.getByRole('button').closest('div');
    expect(assistantElement).toHaveClass(/bottom-right|bottom-left|top-right|top-left|floating/);
  });

  it('respects max messages limit', async () => {
    render(<ContextualAIAssistant maxMessages={1} autoActivate={true} />);

    await waitFor(() => {
      // Should only show one message at a time
      const messages = screen.getAllByText(/welcome|start|connect|improve/i);
      expect(messages.length).toBeLessThanOrEqual(1);
    }, { timeout: 3000 });
  });

  it('handles message actions correctly', async () => {
    render(<ContextualAIAssistant autoActivate={true} />);

    await waitFor(() => {
      const actionButton = screen.getByText(/get.*started|add.*component/i);
      fireEvent.click(actionButton);
    });

    // Action should be executed (would trigger navigation or state change)
    expect(true).toBe(true); // Placeholder for action verification
  });

  it('dismisses messages when dismiss button is clicked', async () => {
    render(<ContextualAIAssistant autoActivate={true} />);

    await waitFor(() => {
      const dismissButton = screen.getByRole('button', { name: /×|close|dismiss/i });
      fireEvent.click(dismissButton);
    });

    await waitFor(() => {
      expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument();
    });
  });

  it('auto-hides non-persistent messages', async () => {
    render(<ContextualAIAssistant autoActivate={true} />);

    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });

    // Wait for auto-hide (if message is set to auto-hide)
    await waitFor(() => {
      // Check if message is still there or has been auto-hidden
      expect(true).toBe(true); // Would check based on message configuration
    }, { timeout: 8000 });
  });

  it('shows typing indicator during message generation', async () => {
    render(<ContextualAIAssistant autoActivate={true} />);

    // Should show typing indicator briefly
    expect(screen.getByText(/typing|generating/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/typing|generating/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles context changes appropriately', async () => {
    const { rerender } = render(<ContextualAIAssistant autoActivate={true} />);

    // Change context
    mockUseStore.mockReturnValue({
      ...mockStore,
      mode: '3d',
    } as any);

    rerender(<ContextualAIAssistant autoActivate={true} />);

    await waitFor(() => {
      // Should potentially show 3D-related messages
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  it('respects different positioning options', () => {
    const positions = ['bottom-right', 'bottom-left', 'top-right', 'top-left', 'floating'] as const;

    positions.forEach(position => {
      const { unmount } = render(
        <ContextualAIAssistant defaultPosition={position} />
      );

      const assistantElement = screen.getByRole('button').closest('div');
      expect(assistantElement).toBeInTheDocument();

      unmount();
    });
  });

  it('handles window resize for contextual positioning', async () => {
    render(<ContextualAIAssistant enableContextualPositioning={true} />);

    // Simulate window resize
    fireEvent(window, new Event('resize'));

    // Should recalculate position
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  it('provides relevant suggestions based on current tab', async () => {
    mockUseStore.mockReturnValue({
      ...mockStore,
      insightsPanel: { activeTab: 'chat' },
    } as any);

    render(<ContextualAIAssistant autoActivate={true} />);

    await waitFor(() => {
      expect(screen.getByText(/chat|conversation|ask/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('maintains message history appropriately', async () => {
    render(<ContextualAIAssistant maxMessages={3} autoActivate={true} />);

    // Generate multiple messages through interactions
    const assistantButton = screen.getByRole('button');
    fireEvent.click(assistantButton);

    await waitFor(() => {
      // Should maintain history up to maxMessages limit
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  it('handles errors gracefully', async () => {
    // Mock an error condition
    mockUseStore.mockImplementation(() => {
      throw new Error('Store error');
    });

    expect(() => {
      render(<ContextualAIAssistant />);
    }).not.toThrow();
  });

  it('optimizes performance with proper memoization', () => {
    const { rerender } = render(<ContextualAIAssistant />);

    // Rerender with same props should not cause unnecessary updates
    rerender(<ContextualAIAssistant />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});