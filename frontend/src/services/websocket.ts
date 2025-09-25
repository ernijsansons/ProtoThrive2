// Ref: CLAUDE.md - Real-time WebSocket service for AI feedback system
import { AIFeedback } from '../components/AIFeedbackEngine';

export interface WebSocketMessage {
  type: 'ai_feedback' | 'progress_update' | 'insight' | 'notification' | 'collaboration' | 'ping' | 'pong' | 'node_update' | 'edge_update' | 'cursor_move' | 'user_join' | 'user_leave' | 'chat_message' | 'roadmap_lock' | 'roadmap_unlock';
  payload: any;
  timestamp: number;
  id: string;
}

export interface CollaborationEvent {
  type: 'node_update' | 'edge_update' | 'cursor_move' | 'user_join' | 'user_leave' | 'chat_message' | 'roadmap_lock' | 'roadmap_unlock';
  userId: string;
  userName: string;
  timestamp: number;
  data: any;
  roomId: string;
}

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  cursor?: {
    x: number;
    y: number;
  };
  lastSeen: number;
  role: 'owner' | 'editor' | 'viewer';
  color: string;
}

export interface CollaborationRoom {
  id: string;
  roadmapId: string;
  name: string;
  users: CollaborationUser[];
  isLocked: boolean;
  lockedBy?: string;
  lockTimestamp?: number;
  createdAt: number;
  lastActivity: number;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  debug: boolean;
}

export interface WebSocketCallbacks {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  onReconnect?: (attempt: number) => void;
  onReconnectFailed?: () => void;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private callbacks: WebSocketCallbacks;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private isDestroyed = false;
  private messageQueue: WebSocketMessage[] = [];
  private lastHeartbeat = 0;

  constructor(config: WebSocketConfig, callbacks: WebSocketCallbacks = {}) {
    // Use environment variable for WebSocket URL with fallback
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || config.url;

    this.config = {
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      debug: config.debug || false,
      url: wsUrl
    };
    this.callbacks = callbacks;

    if (this.config.debug) {
      console.log('WebSocketService initialized with config:', this.config);
    }
  }

  connect(): void {
    if (this.isDestroyed) {
      console.warn('WebSocketService has been destroyed');
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      if (this.config.debug) {
        console.log('Connecting to WebSocket:', this.config.url);
      }

      this.ws = new WebSocket(this.config.url);
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    if (this.config.debug) {
      console.log('Disconnecting WebSocket');
    }

    this.clearTimers();
    this.isConnecting = false;

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  destroy(): void {
    if (this.config.debug) {
      console.log('Destroying WebSocketService');
    }

    this.isDestroyed = true;
    this.disconnect();
    this.messageQueue = [];
  }

  send(message: Omit<WebSocketMessage, 'timestamp' | 'id'>): boolean {
    const fullMessage: WebSocketMessage = {
      ...message,
      timestamp: Date.now(),
      id: this.generateId(),
    };

    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(fullMessage));
        if (this.config.debug) {
          console.log('Message sent:', fullMessage);
        }
        return true;
      } catch (error) {
        console.error('Failed to send message:', error);
        this.queueMessage(fullMessage);
        return false;
      }
    } else {
      this.queueMessage(fullMessage);
      if (this.config.debug) {
        console.log('Message queued (connection not ready):', fullMessage);
      }
      return false;
    }
  }

  getConnectionState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Collaboration methods
  sendCollaborationEvent(event: CollaborationEvent): boolean {
    return this.send({
      type: event.type as any,
      payload: event
    });
  }

  joinCollaborationRoom(roomId: string, user: CollaborationUser): boolean {
    const joinEvent: CollaborationEvent = {
      type: 'user_join',
      userId: user.id,
      userName: user.name,
      timestamp: Date.now(),
      data: { user, roomId },
      roomId
    };

    if (this.config.debug) {
      console.log('Joining collaboration room:', roomId, user.name);
    }

    return this.sendCollaborationEvent(joinEvent);
  }

  leaveCollaborationRoom(roomId: string, user: CollaborationUser): boolean {
    const leaveEvent: CollaborationEvent = {
      type: 'user_leave',
      userId: user.id,
      userName: user.name,
      timestamp: Date.now(),
      data: { roomId },
      roomId
    };

    if (this.config.debug) {
      console.log('Leaving collaboration room:', roomId, user.name);
    }

    return this.sendCollaborationEvent(leaveEvent);
  }

  sendNodeUpdate(roomId: string, user: CollaborationUser, nodeId: string, nodeData: any): boolean {
    const updateEvent: CollaborationEvent = {
      type: 'node_update',
      userId: user.id,
      userName: user.name,
      timestamp: Date.now(),
      data: { nodeId, nodeData },
      roomId
    };

    return this.sendCollaborationEvent(updateEvent);
  }

  sendEdgeUpdate(roomId: string, user: CollaborationUser, edgeId: string, edgeData: any): boolean {
    const updateEvent: CollaborationEvent = {
      type: 'edge_update',
      userId: user.id,
      userName: user.name,
      timestamp: Date.now(),
      data: { edgeId, edgeData },
      roomId
    };

    return this.sendCollaborationEvent(updateEvent);
  }

  sendCursorMove(roomId: string, user: CollaborationUser, x: number, y: number): boolean {
    const cursorEvent: CollaborationEvent = {
      type: 'cursor_move',
      userId: user.id,
      userName: user.name,
      timestamp: Date.now(),
      data: { x, y },
      roomId
    };

    return this.sendCollaborationEvent(cursorEvent);
  }

  sendChatMessage(roomId: string, user: CollaborationUser, message: string): boolean {
    const chatEvent: CollaborationEvent = {
      type: 'chat_message',
      userId: user.id,
      userName: user.name,
      timestamp: Date.now(),
      data: { message },
      roomId
    };

    return this.sendCollaborationEvent(chatEvent);
  }

  lockRoadmap(roomId: string, user: CollaborationUser): boolean {
    const lockEvent: CollaborationEvent = {
      type: 'roadmap_lock',
      userId: user.id,
      userName: user.name,
      timestamp: Date.now(),
      data: { lockedBy: user.id },
      roomId
    };

    return this.sendCollaborationEvent(lockEvent);
  }

  unlockRoadmap(roomId: string, user: CollaborationUser): boolean {
    const unlockEvent: CollaborationEvent = {
      type: 'roadmap_unlock',
      userId: user.id,
      userName: user.name,
      timestamp: Date.now(),
      data: { unlockedBy: user.id },
      roomId
    };

    return this.sendCollaborationEvent(unlockEvent);
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      if (this.config.debug) {
        console.log('WebSocket connected');
      }

      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.lastHeartbeat = Date.now();

      this.startHeartbeat();
      this.flushMessageQueue();
      this.callbacks.onConnect?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);

        if (this.config.debug) {
          console.log('Message received:', message);
        }

        // Handle heartbeat responses
        if (message.type === 'pong') {
          this.lastHeartbeat = Date.now();
          return;
        }

        this.callbacks.onMessage?.(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error, event.data);
      }
    };

    this.ws.onclose = (event) => {
      if (this.config.debug) {
        console.log('WebSocket closed:', event.code, event.reason);
      }

      this.isConnecting = false;
      this.clearTimers();
      this.callbacks.onDisconnect?.();

      // Only reconnect if not a clean close and not destroyed
      if (event.code !== 1000 && !this.isDestroyed) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.callbacks.onError?.(error);
    };
  }

  private scheduleReconnect(): void {
    if (this.isDestroyed || this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
        console.error('Max reconnect attempts reached');
        this.callbacks.onReconnectFailed?.();
      }
      return;
    }

    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(1.5, this.reconnectAttempts),
      30000 // Cap at 30 seconds
    );

    if (this.config.debug) {
      console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.callbacks.onReconnect?.(this.reconnectAttempts);
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        // Check if we've received a recent heartbeat response
        const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat;

        if (timeSinceLastHeartbeat > this.config.heartbeatInterval * 2) {
          if (this.config.debug) {
            console.warn('Heartbeat timeout, closing connection');
          }
          this.ws?.close();
          return;
        }

        // Send ping
        this.send({
          type: 'ping',
          payload: { timestamp: Date.now() },
        });
      }
    }, this.config.heartbeatInterval);
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private queueMessage(message: WebSocketMessage): void {
    this.messageQueue.push(message);

    // Limit queue size to prevent memory issues
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift();
    }
  }

  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    if (this.config.debug) {
      console.log(`Flushing ${this.messageQueue.length} queued messages`);
    }

    const messages = [...this.messageQueue];
    this.messageQueue = [];

    messages.forEach((message) => {
      this.send(message);
    });
  }

  private generateId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Create a singleton instance for the AI feedback WebSocket
export class AIFeedbackWebSocket {
  private static instance: WebSocketService | null = null;
  private static callbacks = new Set<(message: WebSocketMessage) => void>();

  static initialize(config?: Partial<WebSocketConfig>): void {
    if (this.instance) {
      console.warn('AIFeedbackWebSocket already initialized');
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://api.protothrive.com/ws';
    const isProduction = process.env.NODE_ENV === 'production';

    this.instance = new WebSocketService(
      {
        url: wsUrl,
        reconnectInterval: 3000,
        maxReconnectAttempts: 15,
        heartbeatInterval: 25000,
        debug: !isProduction,
        ...config,
      },
      {
        onMessage: (message) => {
          this.callbacks.forEach((callback) => callback(message));
        },
        onConnect: () => {
          console.log('AI Feedback WebSocket connected');
        },
        onDisconnect: () => {
          console.log('AI Feedback WebSocket disconnected');
        },
        onError: (error) => {
          console.error('AI Feedback WebSocket error:', error);
        },
        onReconnect: (attempt) => {
          console.log(`AI Feedback WebSocket reconnecting (attempt ${attempt})`);
        },
        onReconnectFailed: () => {
          console.error('AI Feedback WebSocket failed to reconnect');
        },
      }
    );

    // Auto-connect
    this.instance.connect();
  }

  static getInstance(): WebSocketService | null {
    return this.instance;
  }

  static subscribe(callback: (message: WebSocketMessage) => void): () => void {
    this.callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  static sendFeedback(feedback: AIFeedback): boolean {
    if (!this.instance) {
      console.warn('AIFeedbackWebSocket not initialized');
      return false;
    }

    return this.instance.send({
      type: 'ai_feedback',
      payload: feedback,
    });
  }

  static sendProgressUpdate(progress: any): boolean {
    if (!this.instance) {
      console.warn('AIFeedbackWebSocket not initialized');
      return false;
    }

    return this.instance.send({
      type: 'progress_update',
      payload: progress,
    });
  }

  static sendInsight(insight: any): boolean {
    if (!this.instance) {
      console.warn('AIFeedbackWebSocket not initialized');
      return false;
    }

    return this.instance.send({
      type: 'insight',
      payload: insight,
    });
  }

  static isConnected(): boolean {
    return this.instance?.isConnected() ?? false;
  }

  static disconnect(): void {
    if (this.instance) {
      this.instance.disconnect();
    }
  }

  static destroy(): void {
    if (this.instance) {
      this.instance.destroy();
      this.instance = null;
    }
    this.callbacks.clear();
  }
}

// Hook for React components
export function useWebSocket(
  callback?: (message: WebSocketMessage) => void
): {
  isConnected: boolean;
  send: (message: Omit<WebSocketMessage, 'timestamp' | 'id'>) => boolean;
  connectionState: number;
} {
  const [isConnected, setIsConnected] = React.useState(AIFeedbackWebSocket.isConnected());
  const [connectionState, setConnectionState] = React.useState(
    AIFeedbackWebSocket.getInstance()?.getConnectionState() ?? WebSocket.CLOSED
  );

  React.useEffect(() => {
    // Initialize if not already done
    if (!AIFeedbackWebSocket.getInstance()) {
      AIFeedbackWebSocket.initialize();
    }

    const unsubscribe = AIFeedbackWebSocket.subscribe((message) => {
      callback?.(message);
    });

    // Monitor connection state
    const checkConnection = () => {
      const instance = AIFeedbackWebSocket.getInstance();
      setIsConnected(instance?.isConnected() ?? false);
      setConnectionState(instance?.getConnectionState() ?? WebSocket.CLOSED);
    };

    const interval = setInterval(checkConnection, 1000);
    checkConnection(); // Initial check

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [callback]);

  const send = React.useCallback((message: Omit<WebSocketMessage, 'timestamp' | 'id'>) => {
    return AIFeedbackWebSocket.getInstance()?.send(message) ?? false;
  }, []);

  return {
    isConnected,
    send,
    connectionState,
  };
}

// React import for the hook
import React from 'react';