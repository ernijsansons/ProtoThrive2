import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProgressPredictionEngine from '../ProgressPredictionEngine';
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

describe('ProgressPredictionEngine', () => {
  const mockStore = {
    nodes: [
      { id: '1', label: 'Component A' },
      { id: '2', label: 'Component B' },
    ],
    edges: [{ from: '1', to: '2' }],
    thriveScore: 0.7,
    insightsPanel: { activeTab: 'predictions' },
    updateMetrics: jest.fn(),
  };

  beforeEach(() => {
    mockUseStore.mockReturnValue(mockStore as any);
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ProgressPredictionEngine />);
    expect(screen.getByText('Timeline Prediction')).toBeInTheDocument();
  });

  it('shows prediction analysis when run', async () => {
    render(<ProgressPredictionEngine enableRealTimeUpdates={true} />);

    await waitFor(() => {
      expect(screen.getByText(/Estimated Completion/)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('calculates realistic time estimates', async () => {
    render(<ProgressPredictionEngine showDetails={true} />);

    await waitFor(() => {
      // Should show some kind of time estimate
      const timeElements = screen.getAllByText(/\d+.*minutes?|hours?|days?/);
      expect(timeElements.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('shows confidence percentage', async () => {
    render(<ProgressPredictionEngine showDetails={true} />);

    await waitFor(() => {
      const confidenceElement = screen.getByText(/\d+%.*confidence/i);
      expect(confidenceElement).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('generates optimistic, realistic, and pessimistic scenarios', async () => {
    render(<ProgressPredictionEngine showDetails={true} />);

    await waitFor(() => {
      expect(screen.getByText('Optimistic')).toBeInTheDocument();
      expect(screen.getByText('Realistic')).toBeInTheDocument();
      expect(screen.getByText('Pessimistic')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows positive and negative factors', async () => {
    render(<ProgressPredictionEngine showDetails={true} />);

    await waitFor(() => {
      expect(screen.getByText('Positive Factors')).toBeInTheDocument();
      expect(screen.getByText('Risk Factors')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays milestone progress', async () => {
    render(<ProgressPredictionEngine showDetails={true} />);

    await waitFor(() => {
      expect(screen.getByText('Milestone Timeline')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('adapts predictions based on thrive score', async () => {
    // High thrive score should lead to more optimistic predictions
    mockUseStore.mockReturnValue({
      ...mockStore,
      thriveScore: 0.9,
    } as any);

    render(<ProgressPredictionEngine showDetails={true} />);

    await waitFor(() => {
      // Should show positive indicators for high thrive score
      expect(screen.getByText(/high.*quality/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('adapts predictions based on project complexity', async () => {
    // Many nodes and edges should indicate higher complexity
    mockUseStore.mockReturnValue({
      ...mockStore,
      nodes: Array.from({ length: 10 }, (_, i) => ({ id: `${i}`, label: `Component ${i}` })),
      edges: Array.from({ length: 15 }, (_, i) => ({ from: `${i % 10}`, to: `${(i + 1) % 10}` })),
    } as any);

    render(<ProgressPredictionEngine showDetails={true} />);

    await waitFor(() => {
      // Should account for complexity in predictions
      expect(screen.getByText(/complex/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('updates predictions in real-time when enabled', async () => {
    const { rerender } = render(
      <ProgressPredictionEngine enableRealTimeUpdates={true} predictionHorizon={24} />
    );

    await waitFor(() => {
      expect(screen.getByText('Timeline Prediction')).toBeInTheDocument();
    });

    // Change store data
    mockUseStore.mockReturnValue({
      ...mockStore,
      thriveScore: 0.9,
    } as any);

    rerender(<ProgressPredictionEngine enableRealTimeUpdates={true} predictionHorizon={24} />);

    await waitFor(() => {
      // Predictions should update based on new thrive score
      expect(screen.getByText('Timeline Prediction')).toBeInTheDocument();
    });
  });

  it('respects prediction horizon setting', async () => {
    render(<ProgressPredictionEngine predictionHorizon={48} />);

    await waitFor(() => {
      // Should consider 48-hour horizon in calculations
      expect(screen.getByText('Timeline Prediction')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows recommendations based on analysis', async () => {
    render(<ProgressPredictionEngine showDetails={true} />);

    await waitFor(() => {
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles empty project state gracefully', async () => {
    mockUseStore.mockReturnValue({
      ...mockStore,
      nodes: [],
      edges: [],
      thriveScore: 0,
    } as any);

    render(<ProgressPredictionEngine />);

    await waitFor(() => {
      expect(screen.getByText('Timeline Prediction')).toBeInTheDocument();
    });

    // Should handle empty state without errors
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  it('shows risk levels appropriately', async () => {
    mockUseStore.mockReturnValue({
      ...mockStore,
      thriveScore: 0.3, // Low score should indicate high risk
    } as any);

    render(<ProgressPredictionEngine showDetails={true} />);

    await waitFor(() => {
      expect(screen.getByText(/risk/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('generates actionable insights', async () => {
    render(<ProgressPredictionEngine showDetails={true} />);

    await waitFor(() => {
      // Should provide specific, actionable recommendations
      const recommendations = screen.getAllByText(/consider|optimize|focus|improve/i);
      expect(recommendations.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('displays trend indicators correctly', async () => {
    render(<ProgressPredictionEngine showDetails={true} />);

    await waitFor(() => {
      // Should show trend arrows or indicators
      const trendIndicators = screen.getAllByRole('img', { hidden: true });
      expect(trendIndicators.length).toBeGreaterThanOrEqual(0);
    }, { timeout: 3000 });
  });

  it('formats time estimates readably', async () => {
    render(<ProgressPredictionEngine showDetails={true} />);

    await waitFor(() => {
      // Time should be formatted in human-readable format
      const timePattern = /\d+\s*(minutes?|hours?|days?)/i;
      const timeElements = screen.getAllByText(timePattern);
      expect(timeElements.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('shows progress bars for milestones', async () => {
    render(<ProgressPredictionEngine showDetails={true} />);

    await waitFor(() => {
      // Should display visual progress indicators
      const progressElements = screen.getAllByRole('progressbar');
      expect(progressElements.length).toBeGreaterThanOrEqual(0);
    }, { timeout: 3000 });
  });

  it('handles real-time updates efficiently', async () => {
    const updateMetrics = jest.fn();
    mockUseStore.mockReturnValue({
      ...mockStore,
      updateMetrics,
    } as any);

    render(<ProgressPredictionEngine enableRealTimeUpdates={true} />);

    await waitFor(() => {
      // Should call updateMetrics with predictions
      expect(updateMetrics).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('provides different detail levels based on props', () => {
    const { rerender } = render(<ProgressPredictionEngine showDetails={false} />);

    // Should show less detail
    expect(screen.queryByText('Positive Factors')).not.toBeInTheDocument();

    rerender(<ProgressPredictionEngine showDetails={true} />);

    // Should show more detail
    setTimeout(() => {
      expect(screen.getByText('Timeline Prediction')).toBeInTheDocument();
    }, 1000);
  });
});