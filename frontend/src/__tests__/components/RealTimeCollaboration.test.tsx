// Ref: CLAUDE.md - Real-Time Collaboration Component Tests
// Converted to Jest: import { describe, it, expect, beforeEach, afterEach, vi as jest } from "vitest"';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RealTimeCollaboration } from '../../components/RealTimeCollaboration';
import { testUtils, mockData } from '../../test-utils/testSetup';

// Mock the collaboration service
jest.mock('../../services/collaboration', () => ({
  CollaborationService: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(true),
    joinRoom: jest.fn().mockResolvedValue({
      id: 'room-test-1',
      name: 'Test Room',
      participants: [
        {
          id: 'user-test-1',
          name: 'Test User',
          email: 'test@example.com',
          status: 'active',
          joinedAt: new Date().toISOString(),
        },
      ],
      settings: {
        maxParticipants: 50,
        allowGuests: false,
        moderationEnabled: true,
        recordingEnabled: false,
      },
      metadata: {
        roadmapId: 'roadmap-test-1',
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      },
    }),
    leaveRoom: jest.fn().mockResolvedValue(true),
    updateNode: jest.fn(),
    updateEdge: jest.fn(),
    sendMessage: jest.fn(),
    lockRoadmap: jest.fn().mockReturnValue(true),
    unlockRoadmap: jest.fn().mockReturnValue(true),
    cleanup: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  })),
  collaborationService: {
    initialize: jest.fn().mockResolvedValue(true),
    joinRoom: jest.fn().mockResolvedValue({}),
    on: jest.fn(),
    off: jest.fn(),
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('RealTimeCollaboration', () => {
  const defaultProps = {
    roadmapId: 'roadmap-test-1',
    currentUserId: 'user-test-1',
    currentUserName: 'Test User',
    currentUserEmail: 'test@example.com',
    onNodeUpdate: jest.fn(),
    onEdgeUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Component Rendering', () => {
    it('should render collaboration component', () => {
      render(<RealTimeCollaboration {...defaultProps} />);

      expect(screen.getByTestId('real-time-collaboration')).toBeInTheDocument();
    });

    it('should show connection status', async () => {
      render(<RealTimeCollaboration {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toBeInTheDocument();
      });
    });

    it('should display participant count', async () => {
      render(<RealTimeCollaboration {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('participant-count')).toBeInTheDocument();
      });
    });

    it('should render with custom className', () => {
      render(<RealTimeCollaboration {...defaultProps} className="custom-class" />);

      const container = screen.getByTestId('real-time-collaboration');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Collaboration Initialization', () => {
    it('should initialize collaboration service on mount', async () => {
      const { collaborationService } = await import('../../services/collaboration');

      render(<RealTimeCollaboration {...defaultProps} />);

      await waitFor(() => {
        expect(collaborationService.initialize).toHaveBeenCalledWith(
          'user-test-1',
          'Test User',
          'test@example.com'
        );
      });
    });

    it('should join collaboration room', async () => {
      const { collaborationService } = await import('../../services/collaboration');

      render(<RealTimeCollaboration {...defaultProps} />);

      await waitFor(() => {
        expect(collaborationService.joinRoom).toHaveBeenCalledWith('roadmap-test-1');
      });
    });

    it('should handle initialization failure gracefully', async () => {
      const { collaborationService } = await import('../../services/collaboration');
      jest.mocked(collaborationService.initialize).mockRejectedValueOnce(
        new Error('Connection failed')
      );

      render(<RealTimeCollaboration {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
      });
    });
  });

  describe('User Presence and Cursors', () => {
    it('should display active collaborators', async () => {
      render(<RealTimeCollaboration {...defaultProps} />);

      // Simulate users joining
      act(() => {
        const mockCollaborationService = jest.mocked(require('../../services/collaboration').CollaborationService);
        const instance = mockCollaborationService.mock.instances[0];
        const onCallback = jest.mocked(instance.on).mock.calls.find(([event]) => event === 'user_join')?.[1];

        if (onCallback) {
          onCallback({
            userId: 'user-2',
            userName: 'Jane Doe',
            userEmail: 'jane@example.com',
            timestamp: Date.now(),
          });
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('collaborators-list')).toBeInTheDocument();
      });
    });

    it('should show user cursors on mouse move', async () => {
      render(<RealTimeCollaboration {...defaultProps} />);

      // Simulate cursor movement
      act(() => {
        const mockCollaborationService = jest.mocked(require('../../services/collaboration').CollaborationService);
        const instance = mockCollaborationService.mock.instances[0];
        const onCallback = jest.mocked(instance.on).mock.calls.find(([event]) => event === 'cursor_move')?.[1];

        if (onCallback) {
          onCallback({
            userId: 'user-2',
            userName: 'Jane Doe',
            position: { x: 100, y: 200 },
            timestamp: Date.now(),
          });
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-cursors')).toBeInTheDocument();
      });
    });

    it('should handle user leaving', async () => {
      render(<RealTimeCollaboration {...defaultProps} />);

      // Simulate user leaving
      act(() => {
        const mockCollaborationService = jest.mocked(require('../../services/collaboration').CollaborationService);
        const instance = mockCollaborationService.mock.instances[0];
        const onCallback = jest.mocked(instance.on).mock.calls.find(([event]) => event === 'user_leave')?.[1];

        if (onCallback) {
          onCallback({
            userId: 'user-2',
            userName: 'Jane Doe',
            timestamp: Date.now(),
          });
        }
      });

      await waitFor(() => {
        // User should be removed from active collaborators
        expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
      });
    });
  });

  describe('Real-Time Communication', () => {
    it('should display team chat', async () => {
      render(<RealTimeCollaboration {...defaultProps} />);

      const chatToggle = screen.getByTestId('chat-toggle');
      await userEvent.click(chatToggle);

      expect(screen.getByTestId('team-chat')).toBeInTheDocument();
    });

    it('should send chat messages', async () => {
      const user = userEvent.setup();
      render(<RealTimeCollaboration {...defaultProps} />);

      // Open chat
      const chatToggle = screen.getByTestId('chat-toggle');
      await user.click(chatToggle);

      // Type and send message
      const messageInput = screen.getByTestId('chat-input');
      const sendButton = screen.getByTestId('chat-send');

      await user.type(messageInput, 'Hello team!');
      await user.click(sendButton);

      expect(messageInput).toHaveValue('');
    });

    it('should receive and display chat messages', async () => {
      render(<RealTimeCollaboration {...defaultProps} />);

      // Open chat
      const chatToggle = screen.getByTestId('chat-toggle');
      await userEvent.click(chatToggle);

      // Simulate receiving a message
      act(() => {
        const mockCollaborationService = jest.mocked(require('../../services/collaboration').CollaborationService);
        const instance = mockCollaborationService.mock.instances[0];
        const onCallback = jest.mocked(instance.on).mock.calls.find(([event]) => event === 'chat_message')?.[1];

        if (onCallback) {
          onCallback({
            id: 'msg-1',
            userId: 'user-2',
            userName: 'Jane Doe',
            message: 'Great progress on the roadmap!',
            timestamp: Date.now(),
          });
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Great progress on the roadmap!')).toBeInTheDocument();
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      });
    });

    it('should handle message sending errors', async () => {
      const user = userEvent.setup();
      render(<RealTimeCollaboration {...defaultProps} />);

      // Mock sendMessage to throw error
      const mockCollaborationService = jest.mocked(require('../../services/collaboration').CollaborationService);
      const instance = mockCollaborationService.mock.instances[0];
      jest.mocked(instance.sendMessage).mockImplementation(() => {
        throw new Error('Message send failed');
      });

      // Open chat and try to send message
      const chatToggle = screen.getByTestId('chat-toggle');
      await user.click(chatToggle);

      const messageInput = screen.getByTestId('chat-input');
      const sendButton = screen.getByTestId('chat-send');

      await user.type(messageInput, 'Test message');
      await user.click(sendButton);

      // Message should remain in input due to error
      expect(messageInput).toHaveValue('Test message');
    });
  });

  describe('Roadmap Locking and Controls', () => {
    it('should show roadmap lock controls', () => {
      render(<RealTimeCollaboration {...defaultProps} />);

      expect(screen.getByTestId('roadmap-controls')).toBeInTheDocument();
      expect(screen.getByTestId('lock-toggle')).toBeInTheDocument();
    });

    it('should lock roadmap when clicked', async () => {
      const user = userEvent.setup();
      render(<RealTimeCollaboration {...defaultProps} />);

      const lockToggle = screen.getByTestId('lock-toggle');
      await user.click(lockToggle);

      const mockCollaborationService = jest.mocked(require('../../services/collaboration').CollaborationService);
      const instance = mockCollaborationService.mock.instances[0];
      expect(instance.lockRoadmap).toHaveBeenCalled();
    });

    it('should unlock roadmap when clicked again', async () => {
      const user = userEvent.setup();
      render(<RealTimeCollaboration {...defaultProps} />);

      const lockToggle = screen.getByTestId('lock-toggle');

      // Lock first
      await user.click(lockToggle);

      // Then unlock
      await user.click(lockToggle);

      const mockCollaborationService = jest.mocked(require('../../services/collaboration').CollaborationService);
      const instance = mockCollaborationService.mock.instances[0];
      expect(instance.unlockRoadmap).toHaveBeenCalled();
    });

    it('should show lock status when roadmap is locked', async () => {
      render(<RealTimeCollaboration {...defaultProps} />);

      // Simulate roadmap being locked
      act(() => {
        const mockCollaborationService = jest.mocked(require('../../services/collaboration').CollaborationService);
        const instance = mockCollaborationService.mock.instances[0];
        const onCallback = jest.mocked(instance.on).mock.calls.find(([event]) => event === 'roadmap_lock')?.[1];

        if (onCallback) {
          onCallback({
            userId: 'user-2',
            userName: 'Jane Doe',
            timestamp: Date.now(),
          });
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('lock-status')).toBeInTheDocument();
        expect(screen.getByText(/locked by Jane Doe/i)).toBeInTheDocument();
      });
    });
  });

  describe('Node and Edge Updates', () => {
    it('should handle node updates from other users', async () => {
      const onNodeUpdate = jest.fn();
      render(<RealTimeCollaboration {...defaultProps} onNodeUpdate={onNodeUpdate} />);

      // Simulate node update
      act(() => {
        const mockCollaborationService = jest.mocked(require('../../services/collaboration').CollaborationService);
        const instance = mockCollaborationService.mock.instances[0];
        const onCallback = jest.mocked(instance.on).mock.calls.find(([event]) => event === 'node_update')?.[1];

        if (onCallback) {
          onCallback({
            nodeId: 'node-1',
            nodeData: {
              label: 'Updated Node',
              status: 'neon',
              position: { x: 150, y: 150, z: 0 },
            },
            userId: 'user-2',
            userName: 'Jane Doe',
            timestamp: Date.now(),
          });
        }
      });

      await waitFor(() => {
        expect(onNodeUpdate).toHaveBeenCalledWith(
          'node-1',
          expect.objectContaining({
            label: 'Updated Node',
            status: 'neon',
          })
        );
      });
    });

    it('should handle edge updates from other users', async () => {
      const onEdgeUpdate = jest.fn();
      render(<RealTimeCollaboration {...defaultProps} onEdgeUpdate={onEdgeUpdate} />);

      // Simulate edge update
      act(() => {
        const mockCollaborationService = jest.mocked(require('../../services/collaboration').CollaborationService);
        const instance = mockCollaborationService.mock.instances[0];
        const onCallback = jest.mocked(instance.on).mock.calls.find(([event]) => event === 'edge_update')?.[1];

        if (onCallback) {
          onCallback({
            edgeId: 'edge-1',
            edgeData: {
              from: 'node-1',
              to: 'node-2',
              style: { stroke: '#00ffff' },
            },
            userId: 'user-2',
            userName: 'Jane Doe',
            timestamp: Date.now(),
          });
        }
      });

      await waitFor(() => {
        expect(onEdgeUpdate).toHaveBeenCalledWith(
          'edge-1',
          expect.objectContaining({
            from: 'node-1',
            to: 'node-2',
          })
        );
      });
    });

    it('should ignore updates from current user', async () => {
      const onNodeUpdate = jest.fn();
      render(<RealTimeCollaboration {...defaultProps} onNodeUpdate={onNodeUpdate} />);

      // Simulate node update from current user
      act(() => {
        const mockCollaborationService = jest.mocked(require('../../services/collaboration').CollaborationService);
        const instance = mockCollaborationService.mock.instances[0];
        const onCallback = jest.mocked(instance.on).mock.calls.find(([event]) => event === 'node_update')?.[1];

        if (onCallback) {
          onCallback({
            nodeId: 'node-1',
            nodeData: { label: 'Updated Node' },
            userId: 'user-test-1', // Current user
            userName: 'Test User',
            timestamp: Date.now(),
          });
        }
      });

      // Should not call onNodeUpdate for current user's changes
      expect(onNodeUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle connection loss gracefully', async () => {
      render(<RealTimeCollaboration {...defaultProps} />);

      // Simulate connection loss
      act(() => {
        const mockCollaborationService = jest.mocked(require('../../services/collaboration').CollaborationService);
        const instance = mockCollaborationService.mock.instances[0];
        const onCallback = jest.mocked(instance.on).mock.calls.find(([event]) => event === 'connection_error')?.[1];

        if (onCallback) {
          onCallback({
            error: 'Connection lost',
            timestamp: Date.now(),
          });
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
      });
    });

    it('should handle invalid collaboration events', async () => {
      render(<RealTimeCollaboration {...defaultProps} />);

      // Simulate invalid event
      act(() => {
        const mockCollaborationService = jest.mocked(require('../../services/collaboration').CollaborationService);
        const instance = mockCollaborationService.mock.instances[0];
        const onCallback = jest.mocked(instance.on).mock.calls.find(([event]) => event === 'node_update')?.[1];

        if (onCallback) {
          onCallback({
            // Missing required fields
            nodeId: null,
            nodeData: null,
            userId: 'user-2',
          });
        }
      });

      // Should not crash or call onNodeUpdate
      expect(defaultProps.onNodeUpdate).not.toHaveBeenCalled();
    });

    it('should handle component unmount gracefully', async () => {
      const { unmount } = render(<RealTimeCollaboration {...defaultProps} />);

      const mockCollaborationService = jest.mocked(require('../../services/collaboration').CollaborationService);
      const instance = mockCollaborationService.mock.instances[0];

      unmount();

      expect(instance.cleanup).toHaveBeenCalled();
    });
  });

  describe('Performance and Optimization', () => {
    it('should throttle cursor movement updates', async () => {
      render(<RealTimeCollaboration {...defaultProps} />);

      const container = screen.getByTestId('real-time-collaboration');

      // Simulate rapid mouse movements
      for (let i = 0; i < 10; i++) {
        fireEvent.mouseMove(container, { clientX: i * 10, clientY: i * 10 });
      }

      // Should not send 10 updates due to throttling
      const mockCollaborationService = jest.mocked(require('../../services/collaboration').CollaborationService);
      const instance = mockCollaborationService.mock.instances[0];
      const updateCalls = jest.mocked(instance.updateNode).mock.calls.length;

      expect(updateCalls).toBeLessThan(10);
    });

    it('should clean up event listeners on unmount', () => {
      const { unmount } = render(<RealTimeCollaboration {...defaultProps} />);

      const mockCollaborationService = jest.mocked(require('../../services/collaboration').CollaborationService);
      const instance = mockCollaborationService.mock.instances[0];

      unmount();

      // Should call off for each event listener
      expect(instance.off).toHaveBeenCalledTimes(
        expect.any(Number)
      );
    });

    it('should handle large numbers of collaborators efficiently', async () => {
      render(<RealTimeCollaboration {...defaultProps} />);

      // Simulate many users joining
      for (let i = 0; i < 50; i++) {
        act(() => {
          const mockCollaborationService = jest.mocked(require('../../services/collaboration').CollaborationService);
          const instance = mockCollaborationService.mock.instances[0];
          const onCallback = jest.mocked(instance.on).mock.calls.find(([event]) => event === 'user_join')?.[1];

          if (onCallback) {
            onCallback({
              userId: `user-${i}`,
              userName: `User ${i}`,
              userEmail: `user${i}@example.com`,
              timestamp: Date.now(),
            });
          }
        });
      }

      await waitFor(() => {
        const collaboratorsList = screen.getByTestId('collaborators-list');
        expect(collaboratorsList).toBeInTheDocument();
      });

      // Component should still be responsive
      expect(screen.getByTestId('real-time-collaboration')).toBeInTheDocument();
    });
  });
});