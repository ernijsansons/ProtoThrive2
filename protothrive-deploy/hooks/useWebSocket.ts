import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

interface WebSocketMessage {
  type: 'update' | 'cursor' | 'selection' | 'presence' | 'init' | 'sync' | 'error' | 'pong';
  userId?: string;
  data?: unknown;
  timestamp?: number;
}

interface Participant {
  userId: string;
  userEmail: string;
}

interface UseWebSocketOptions {
  roadmapId: string;
  onUpdate?: (data: unknown) => void;
  onCursor?: (data: { userId: string; x: number; y: number; userEmail: string }) => void;
  onSelection?: (data: { userId: string; nodeId: string; userEmail: string }) => void;
  onPresence?: (participants: Participant[]) => void;
  onSync?: (updates: unknown[]) => void;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}

export function useWebSocket({
  roadmapId,
  onUpdate,
  onCursor,
  onSelection,
  onPresence,
  onSync,
  autoReconnect = true,
  reconnectDelay = 3000,
}: UseWebSocketOptions) {
  const { getToken } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://api.devcommand.com';
      const url = `${wsUrl}/api/ws/${roadmapId}?token=${token}`;
      
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        
        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Ping every 30 seconds
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'init':
              if (message.data) {
                setParticipants(message.data.participants || []);
                onPresence?.(message.data.participants || []);
              }
              break;
              
            case 'sync':
              if (message.data?.updates) {
                onSync?.(message.data.updates);
              }
              break;
              
            case 'update':
              if (message.data) {
                onUpdate?.(message.data);
              }
              break;
              
            case 'cursor':
              if (message.data && message.userId) {
                onCursor?.({
                  userId: message.userId,
                  ...message.data,
                });
              }
              break;
              
            case 'selection':
              if (message.data && message.userId) {
                onSelection?.({
                  userId: message.userId,
                  ...message.data,
                });
              }
              break;
              
            case 'presence':
              if (message.data?.participants) {
                setParticipants(message.data.participants);
                onPresence?.(message.data.participants);
              }
              break;
              
            case 'error':
              console.error('WebSocket error:', message.data);
              setError(message.data?.message || 'Unknown error');
              break;
              
            case 'pong':
              // Connection is alive
              break;
              
            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error');
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        
        // Auto reconnect if enabled and not a normal close
        if (autoReconnect && event.code !== 1000) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(reconnectDelay * reconnectAttemptsRef.current, 30000);
          
          toast.error(`Connection lost. Reconnecting in ${delay / 1000}s...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setIsConnected(false);
    }
  }, [roadmapId, getToken, autoReconnect, reconnectDelay, onUpdate, onCursor, onSelection, onPresence, onSync]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setParticipants([]);
  }, []);

  const sendUpdate = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'update',
        data,
      }));
    }
  }, []);

  const sendCursor = useCallback((x: number, y: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'cursor',
        data: { x, y },
      }));
    }
  }, []);

  const sendSelection = useCallback((nodeId: string | null) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'selection',
        data: { nodeId },
      }));
    }
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    participants,
    error,
    sendUpdate,
    sendCursor,
    sendSelection,
    reconnect: connect,
    disconnect,
  };
}