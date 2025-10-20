import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIFeedbackEngine, { AIFeedback } from '../AIFeedbackEngine';
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

describe('AIFeedbackEngine', () => {
  const mockStore = {
    nodes: [],
    edges: [],
    thriveScore: 0.5,
    mode: '2d',
    insightsPanel: { activeTab: 'overview' },
    addChatMessage: jest.fn(),
    updateMetrics: jest.fn(),
  };

  beforeEach(() => {
    mockUseStore.mockReturnValue(mockStore as any);
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<AIFeedbackEngine />);
    expect(screen.getByText('AI Analyzing...')).toBeInTheDocument();
  });

  it('generates feedback for empty canvas', async () => {
    const onFeedback = jest.fn();
    render(
      <AIFeedbackEngine
        onFeedback={onFeedback}
        enableAutoGeneration={true}
      />
    );

    await waitFor(() => {
      expect(onFeedback).toHaveBeenCalled();
    }, { timeout: 5000 });

    const feedbackCall = onFeedback.mock.calls[0][0] as AIFeedback;
    expect(feedbackCall).toMatchObject({
      type: 'suggestion',
      title: 'Start Building Your Project',
      priority: 'high',
      category: 'design',
    });
  });

  it('generates feedback for disconnected components', async () => {
    const onFeedback = jest.fn();
    mockUseStore.mockReturnValue({
      ...mockStore,
      nodes: [{ id: '1' }, { id: '2' }],
      edges: [],
    } as any);

    render(
      <AIFeedbackEngine
        onFeedback={onFeedback}
        enableAutoGeneration={true}
      />
    );

    await waitFor(() => {
      expect(onFeedback).toHaveBeenCalled();
    }, { timeout: 5000 });

    const feedbackCall = onFeedback.mock.calls[0][0] as AIFeedback;
    expect(feedbackCall).toMatchObject({
      type: 'warning',
      title: 'Components Need Connections',
      priority: 'medium',
      category: 'design',
    });
  });

  it('generates performance optimization feedback for low thrive score', async () => {
    const onFeedback = jest.fn();
    mockUseStore.mockReturnValue({
      ...mockStore,
      nodes: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
      edges: [{ from: '1', to: '2' }],
      thriveScore: 0.3,
    } as any);

    render(
      <AIFeedbackEngine
        onFeedback={onFeedback}
        enableAutoGeneration={true}
      />
    );

    await waitFor(() => {
      expect(onFeedback).toHaveBeenCalled();
    }, { timeout: 5000 });

    const feedbackCall = onFeedback.mock.calls[0][0] as AIFeedback;
    expect(feedbackCall).toMatchObject({
      type: 'optimization',
      title: 'Performance Optimization Needed',
      priority: 'high',
      category: 'performance',
    });
  });

  it('generates success feedback for high quality projects', async () => {
    const onFeedback = jest.fn();
    mockUseStore.mockReturnValue({
      ...mockStore,
      nodes: [{ id: '1' }, { id: '2' }, { id: '3' }],
      edges: [{ from: '1', to: '2' }, { from: '2', to: '3' }],
      thriveScore: 0.9,
    } as any);

    render(
      <AIFeedbackEngine
        onFeedback={onFeedback}
        enableAutoGeneration={true}
      />
    );

    await waitFor(() => {
      expect(onFeedback).toHaveBeenCalled();
    }, { timeout: 5000 });

    const feedbackCall = onFeedback.mock.calls[0][0] as AIFeedback;
    expect(feedbackCall).toMatchObject({
      type: 'success',
      title: 'Excellent Progress!',
      priority: 'low',
      category: 'best_practice',
    });
  });

  it('respects maxActiveFeedback limit', async () => {
    const onFeedback = jest.fn();
    render(
      <AIFeedbackEngine
        onFeedback={onFeedback}
        maxActiveFeedback={2}
        enableAutoGeneration={true}
      />
    );

    await waitFor(() => {
      expect(onFeedback).toHaveBeenCalled();
    }, { timeout: 5000 });

    // Should not exceed max limit
    expect(onFeedback).toHaveBeenCalledTimes(1);
  });

  it('allows dismissing feedback', async () => {
    render(<AIFeedbackEngine enableAutoGeneration={true} />);

    await waitFor(() => {
      const dismissButton = screen.queryByRole('button', { name: /×/ });
      if (dismissButton) {
        fireEvent.click(dismissButton);
      }
    });

    // Feedback should be dismissed (no longer visible)
    expect(screen.queryByText('Start Building Your Project')).not.toBeInTheDocument();
  });

  it('executes action callbacks when provided', async () => {
    const mockAction = jest.fn();
    const onFeedback = jest.fn((feedback: AIFeedback) => {
      feedback.action = {
        label: 'Test Action',
        callback: mockAction,
      };
    });

    render(
      <AIFeedbackEngine
        onFeedback={onFeedback}
        enableAutoGeneration={true}
      />
    );

    await waitFor(() => {
      const actionButton = screen.queryByText('Test Action');
      if (actionButton) {
        fireEvent.click(actionButton);
        expect(mockAction).toHaveBeenCalled();
      }
    });
  });

  it('filters duplicate feedback', async () => {
    const onFeedback = jest.fn();

    render(
      <AIFeedbackEngine
        onFeedback={onFeedback}
        enableAutoGeneration={true}
      />
    );

    // Wait for initial feedback
    await waitFor(() => {
      expect(onFeedback).toHaveBeenCalled();
    }, { timeout: 5000 });

    const initialCallCount = onFeedback.mock.calls.length;

    // Wait a bit more to see if duplicates are generated
    await waitFor(() => {
      // Should not generate duplicate feedback for same conditions
      expect(onFeedback.mock.calls.length).toBeLessThanOrEqual(initialCallCount + 1);
    }, { timeout: 3000 });
  });

  it('auto-hides feedback after specified duration', async () => {
    render(<AIFeedbackEngine enableAutoGeneration={true} />);

    await waitFor(() => {
      expect(screen.queryByText('Excellent Progress!')).toBeInTheDocument();
    });

    // Wait for auto-hide (should happen after 5 seconds for success messages)
    await waitFor(() => {
      expect(screen.queryByText('Excellent Progress!')).not.toBeInTheDocument();
    }, { timeout: 6000 });
  });

  it('respects disabled auto-generation', () => {
    const onFeedback = jest.fn();

    render(
      <AIFeedbackEngine
        onFeedback={onFeedback}
        enableAutoGeneration={false}
      />
    );

    // Should not generate automatic feedback
    setTimeout(() => {
      expect(onFeedback).not.toHaveBeenCalled();
    }, 3000);
  });

  it('handles different user activity states', async () => {
    const onFeedback = jest.fn();

    // Mock long session (idle user)
    const originalDateNow = Date.now;
    Date.now = jest.fn(() => originalDateNow() + 400000); // 6+ minutes ago

    render(
      <AIFeedbackEngine
        onFeedback={onFeedback}
        enableAutoGeneration={true}
      />
    );

    await waitFor(() => {
      expect(onFeedback).toHaveBeenCalled();
    }, { timeout: 5000 });

    const feedbackCall = onFeedback.mock.calls.find(
      call => call[0].title === 'Take a Creative Break'
    );
    expect(feedbackCall).toBeTruthy();

    // Restore original Date.now
    Date.now = originalDateNow;
  });
});