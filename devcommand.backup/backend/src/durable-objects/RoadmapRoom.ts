// Durable Object for real-time roadmap collaboration
import type { DurableObjectNamespace } from '@cloudflare/workers-types';

interface Session {
  userId: string;
  userEmail: string;
  websocket: WebSocket;
  quit?: boolean;
}

interface BroadcastMessage {
  type: 'update' | 'cursor' | 'selection' | 'presence';
  userId: string;
  data: unknown;
  timestamp: number;
}

export class RoadmapRoom {
  private sessions: Map<WebSocket, Session>;
  private state: DurableObjectState;
  private roadmapId: string;
  private lastActivity: number;
  
  constructor(state: DurableObjectState, env: unknown) {
    this.state = state;
    this.sessions = new Map();
    this.roadmapId = '';
    this.lastActivity = Date.now();
    
    // Restore state if needed
    this.state.blockConcurrencyWhile(async () => {
      const storedId = await this.state.storage.get<string>('roadmapId');
      if (storedId) {
        this.roadmapId = storedId;
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    switch (url.pathname) {
      case '/websocket':
        return this.handleWebSocket(request);
      case '/stats':
        return this.handleStats();
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    // Check if request is a WebSocket upgrade
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 400 });
    }

    // Extract auth info from query params (passed from main worker)
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const userEmail = url.searchParams.get('userEmail');
    const roadmapId = url.searchParams.get('roadmapId');
    
    if (!userId || !roadmapId) {
      return new Response('Missing required parameters', { status: 400 });
    }

    // Store roadmap ID on first connection
    if (!this.roadmapId) {
      this.roadmapId = roadmapId;
      await this.state.storage.put('roadmapId', roadmapId);
    }

    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept WebSocket connection
    server.accept();

    // Create session
    const session: Session = {
      userId,
      userEmail: userEmail || '',
      websocket: server,
    };

    // Handle WebSocket events
    server.addEventListener('message', async (event) => {
      await this.handleMessage(session, event.data);
    });

    server.addEventListener('close', async () => {
      this.sessions.delete(server);
      await this.broadcastPresence();
    });

    server.addEventListener('error', () => {
      this.sessions.delete(server);
    });

    // Add session
    this.sessions.set(server, session);
    this.lastActivity = Date.now();

    // Send initial state
    await this.sendInitialState(session);
    
    // Broadcast presence update
    await this.broadcastPresence();

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private async handleMessage(session: Session, data: unknown) {
    this.lastActivity = Date.now();
    
    try {
      const message = typeof data === 'string' ? JSON.parse(data) : data;
      
      switch (message.type) {
        case 'update':
          await this.handleUpdate(session, message);
          break;
        case 'cursor':
          await this.handleCursor(session, message);
          break;
        case 'selection':
          await this.handleSelection(session, message);
          break;
        case 'ping':
          session.websocket.send(JSON.stringify({ type: 'pong' }));
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      session.websocket.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
      }));
    }
  }

  private async handleUpdate(session: Session, message: unknown) {
    // Broadcast update to all other sessions
    const broadcast: BroadcastMessage = {
      type: 'update',
      userId: session.userId,
      data: message.data,
      timestamp: Date.now(),
    };

    await this.broadcast(broadcast, session.websocket);

    // Store recent updates for late joiners
    const recentUpdates = await this.state.storage.get<any[]>('recentUpdates') || [];
    recentUpdates.push(broadcast);
    
    // Keep only last 50 updates
    if (recentUpdates.length > 50) {
      recentUpdates.shift();
    }
    
    await this.state.storage.put('recentUpdates', recentUpdates);
  }

  private async handleCursor(session: Session, message: unknown) {
    // Broadcast cursor position to all other sessions
    const broadcast: BroadcastMessage = {
      type: 'cursor',
      userId: session.userId,
      data: {
        x: message.data.x,
        y: message.data.y,
        userEmail: session.userEmail,
      },
      timestamp: Date.now(),
    };

    await this.broadcast(broadcast, session.websocket);
  }

  private async handleSelection(session: Session, message: unknown) {
    // Broadcast selection to all other sessions
    const broadcast: BroadcastMessage = {
      type: 'selection',
      userId: session.userId,
      data: {
        nodeId: message.data.nodeId,
        userEmail: session.userEmail,
      },
      timestamp: Date.now(),
    };

    await this.broadcast(broadcast, session.websocket);
  }

  private async sendInitialState(session: Session) {
    // Send current participants
    const participants = Array.from(this.sessions.values()).map(s => ({
      userId: s.userId,
      userEmail: s.userEmail,
    }));

    session.websocket.send(JSON.stringify({
      type: 'init',
      data: {
        roadmapId: this.roadmapId,
        participants,
        sessionCount: this.sessions.size,
      },
    }));

    // Send recent updates
    const recentUpdates = await this.state.storage.get<any[]>('recentUpdates') || [];
    if (recentUpdates.length > 0) {
      session.websocket.send(JSON.stringify({
        type: 'sync',
        data: {
          updates: recentUpdates,
        },
      }));
    }
  }

  private async broadcastPresence() {
    const participants = Array.from(this.sessions.values()).map(s => ({
      userId: s.userId,
      userEmail: s.userEmail,
    }));

    const message = JSON.stringify({
      type: 'presence',
      data: {
        participants,
        sessionCount: this.sessions.size,
      },
    });

    // Send to all sessions
    for (const [ws, session] of this.sessions) {
      try {
        ws.send(message);
      } catch (error) {
        // Remove dead sessions
        session.quit = true;
        this.sessions.delete(ws);
      }
    }
  }

  private async broadcast(message: BroadcastMessage, exclude?: WebSocket) {
    const data = JSON.stringify(message);
    
    // Send to all sessions except the sender
    for (const [ws, session] of this.sessions) {
      if (ws !== exclude && !session.quit) {
        try {
          ws.send(data);
        } catch (error) {
          // Remove dead sessions
          session.quit = true;
          this.sessions.delete(ws);
        }
      }
    }
  }

  private async handleStats(): Promise<Response> {
    const stats = {
      roadmapId: this.roadmapId,
      sessionCount: this.sessions.size,
      participants: Array.from(this.sessions.values()).map(s => ({
        userId: s.userId,
        userEmail: s.userEmail,
      })),
      lastActivity: this.lastActivity,
    };

    return new Response(JSON.stringify(stats), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Alarm handler for cleanup
  async alarm() {
    // Clean up if no activity for 30 minutes
    const inactivityThreshold = 30 * 60 * 1000; // 30 minutes
    
    if (Date.now() - this.lastActivity > inactivityThreshold && this.sessions.size === 0) {
      // Clear stored data
      await this.state.storage.deleteAll();
    } else {
      // Schedule next check
      await this.state.storage.setAlarm(Date.now() + inactivityThreshold);
    }
  }
}