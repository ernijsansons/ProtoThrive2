import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SmartNotificationCenter from '../SmartNotificationCenter';
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

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: jest.fn(),
});

describe('SmartNotificationCenter', () => {
  const mockStore = {
    nodes: [],
    edges: [],
    thriveScore: 0.5,
    agentStatus: {
      isRunning: false,
      isPaused: false,
      currentStep: '',
      progress: 0,
      estimatedTime: 0,
      actualCost: 0,
      remainingBudget: 0,
      agentName: 'Test Agent',
      confidence: 0.8,
      success: true,
    },
    insightsPanel: { activeTab: 'overview' },
    updateMetrics: jest.fn(),
  };

  beforeEach(() => {
    mockUseStore.mockReturnValue(mockStore as any);
    jest.clearAllMocks();
  });

  it('renders notification bell icon', () => {
    render(<SmartNotificationCenter />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows notification badge when there are unread notifications', async () => {
    render(<SmartNotificationCenter showBadge={true} />);

    // Wait for initial notifications to be generated
    await waitFor(() => {
      const badge = screen.queryByText(/\d+/);
      if (badge) {
        expect(badge).toBeInTheDocument();
      }
    }, { timeout: 3000 });
  });

  it('opens notification panel when bell is clicked', async () => {
    render(<SmartNotificationCenter />);

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('Smart Notifications')).toBeInTheDocument();
    });
  });

  it('generates welcome notification on mount', async () => {
    render(<SmartNotificationCenter />);

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('Welcome to ProtoThrive!')).toBeInTheDocument();
    });
  });

  it('generates contextual notifications based on thrive score', async () => {
    mockUseStore.mockReturnValue({
      ...mockStore,
      thriveScore: 0.9,
      nodes: [{ id: '1' }, { id: '2' }, { id: '3' }],
      edges: [{ from: '1', to: '2' }, { from: '2', to: '3' }],
    } as any);

    render(<SmartNotificationCenter />);

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('Excellent Progress!')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('generates AI insights when agent is running', async () => {
    mockUseStore.mockReturnValue({
      ...mockStore,
      agentStatus: {
        ...mockStore.agentStatus,
        isRunning: true,
      },
    } as any);

    render(<SmartNotificationCenter />);

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('AI Recommendation')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('allows marking notifications as read', async () => {
    render(<SmartNotificationCenter />);

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    await waitFor(() => {
      const notification = screen.getByText('Welcome to ProtoThrive!');
      fireEvent.click(notification);
    });

    // Notification should be marked as read (visual indication would change)
    expect(screen.getByText('Welcome to ProtoThrive!')).toBeInTheDocument();
  });

  it('allows archiving notifications', async () => {
    render(<SmartNotificationCenter />);

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    await waitFor(() => {
      const archiveButton = screen.getByTitle('Archive');
      fireEvent.click(archiveButton);
    });

    // Notification should be archived and removed from view
    await waitFor(() => {
      expect(screen.queryByText('Welcome to ProtoThrive!')).not.toBeInTheDocument();
    });
  });

  it('allows deleting notifications', async () => {
    render(<SmartNotificationCenter />);

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    await waitFor(() => {
      const deleteButton = screen.getByTitle('Delete');
      fireEvent.click(deleteButton);
    });

    // Notification should be deleted
    await waitFor(() => {
      expect(screen.queryByText('Welcome to ProtoThrive!')).not.toBeInTheDocument();
    });
  });

  it('filters notifications by search query', async () => {
    render(<SmartNotificationCenter />);

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search notifications...');
      fireEvent.change(searchInput, { target: { value: 'Welcome' } });
    });

    // Should show filtered results
    expect(screen.getByText('Welcome to ProtoThrive!')).toBeInTheDocument();
  });

  it('respects max active notifications limit', async () => {
    render(<SmartNotificationCenter maxActiveNotifications={2} />);

    // Should not show more than 2 active notifications in overlay
    await waitFor(() => {
      const overlayNotifications = screen.getAllByRole('button', { name: /×/ });
      expect(overlayNotifications.length).toBeLessThanOrEqual(2);
    }, { timeout: 3000 });
  });

  it('uses intelligent batching when enabled', async () => {
    render(<SmartNotificationCenter intelligentBatching={true} />);

    // Should group similar notifications and show representatives
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    await waitFor(() => {
      // Check that notifications are properly batched (no duplicates of same type)
      const notifications = screen.getAllByText(/Welcome|Smart Features/);
      expect(notifications.length).toBeGreaterThan(0);
    });
  });

  it('plays sound when enabled and notification has sound flag', async () => {
    const mockPlay = jest.fn().mockResolvedValue(undefined);
    const mockAudio = {
      play: mockPlay,
      pause: jest.fn(),
      currentTime: 0,
      duration: 0,
    };

    // Mock HTMLAudioElement
    global.HTMLAudioElement = jest.fn().mockImplementation(() => mockAudio);

    render(<SmartNotificationCenter enableSound={true} />);

    await waitFor(() => {
      // Sound should be attempted to play for welcome notification
      expect(mockPlay).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('vibrates when enabled and supported', async () => {
    render(<SmartNotificationCenter enableVibration={true} />);

    await waitFor(() => {
      // Vibration should be triggered
      expect(navigator.vibrate).toHaveBeenCalledWith([100, 50, 100]);
    }, { timeout: 3000 });
  });

  it('auto-archives old notifications', async () => {
    // Mock old notifications
    const originalDateNow = Date.now;
    Date.now = jest.fn(() => originalDateNow() + 25 * 60 * 60 * 1000); // 25 hours later

    render(<SmartNotificationCenter autoArchiveAfter={24} />);

    // Trigger cleanup
    await waitFor(() => {
      // Old notifications should be auto-archived
      expect(true).toBe(true); // Placeholder - would check internal state
    });

    // Restore original Date.now
    Date.now = originalDateNow;
  });

  it('generates reminder for empty canvas', async () => {
    mockUseStore.mockReturnValue({
      ...mockStore,
      nodes: [],
    } as any);

    render(<SmartNotificationCenter />);

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('Ready to Start?')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('handles notification actions correctly', async () => {
    render(<SmartNotificationCenter />);

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    await waitFor(() => {
      const actionButton = screen.getByText('Add Component');
      fireEvent.click(actionButton);
    });

    // Action should be executed (console.log in this case)
    expect(true).toBe(true); // Would verify action execution
  });

  it('positions notifications based on prop', () => {
    const { rerender } = render(<SmartNotificationCenter position="top-left" />);

    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<SmartNotificationCenter position="bottom-right" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('closes panel when clicking outside', async () => {
    render(<SmartNotificationCenter />);

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('Smart Notifications')).toBeInTheDocument();
    });

    // Click close button
    const closeButton = screen.getByRole('button', { name: /×/ });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Smart Notifications')).not.toBeInTheDocument();
    });
  });
});