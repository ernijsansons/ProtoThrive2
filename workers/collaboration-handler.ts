// ProtoThrive Enterprise Collaboration Durable Object
// Real-time WebSocket handler for collaborative roadmap editing
// Ref: CLAUDE.md Section 2 - Real-time Collaboration

export interface CollaborationMessage {
  type: 'join' | 'leave' | 'cursor_move' | 'node_update' | 'edge_update' | 'chat_message' | 'roadmap_lock' | 'roadmap_unlock';
  userId: string;
  userName: string;
  userEmail: string;
  roomId: string;
  timestamp: number;
  data: any;
}

export interface ParticipantInfo {
  userId: string;
  userName: string;
  userEmail: string;
  joinedAt: number;
  lastActivity: number;
  cursor?: { x: number; y: number };
  role: 'owner' | 'editor' | 'commenter' | 'viewer';
}

export interface RoomState {
  roomId: string;
  roadmapId: string;
  participants: Map<string, ParticipantInfo>;
  isLocked: boolean;
  lockedBy?: string;
  lockTimestamp?: number;
  chatHistory: CollaborationMessage[];
  lastActivity: number;
  createdAt: number;
}

export class CollaborationHandler {
  private state: DurableObjectState;
  private env: Env;
  private sessions: Map<WebSocket, ParticipantInfo>;
  private roomState: RoomState;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();

    // Initialize room state from storage or create new
    this.initializeRoomState();
  }

  private async initializeRoomState() {
    const stored = await this.state.storage.get<RoomState>('roomState');
    if (stored) {
      this.roomState = {
        ...stored,
        participants: new Map(Object.entries(stored.participants || {})),
      };
    } else {
      this.roomState = {
        roomId: '',
        roadmapId: '',
        participants: new Map(),
        isLocked: false,
        chatHistory: [],
        lastActivity: Date.now(),
        createdAt: Date.now(),
      };
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/websocket') {
      return this.handleWebSocketUpgrade(request);
    }

    if (url.pathname === '/room-info') {
      return this.getRoomInfo();
    }

    if (url.pathname === '/participants') {
      return this.getParticipants();
    }

    return new Response('Not found', { status: 404 });
  }

  private async handleWebSocketUpgrade(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const userName = url.searchParams.get('userName');
    const userEmail = url.searchParams.get('userEmail');
    const roomId = url.searchParams.get('roomId');
    const roadmapId = url.searchParams.get('roadmapId');
    const role = url.searchParams.get('role') as ParticipantInfo['role'] || 'viewer';

    if (!userId || !userName || !userEmail || !roomId || !roadmapId) {
      return new Response('Missing required parameters', { status: 400 });
    }

    // Validate user permissions (basic check)
    if (!await this.validateUserAccess(userId, roadmapId, role)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Set up participant info
    const participant: ParticipantInfo = {
      userId,
      userName,
      userEmail,
      joinedAt: Date.now(),
      lastActivity: Date.now(),
      role,
    };

    // Store session
    this.sessions.set(server, participant);

    // Update room state
    if (!this.roomState.roomId) {
      this.roomState.roomId = roomId;
      this.roomState.roadmapId = roadmapId;
    }

    this.roomState.participants.set(userId, participant);
    this.roomState.lastActivity = Date.now();

    // Set up WebSocket event handlers
    server.accept();
    server.addEventListener('message', (event) => this.handleMessage(server, event));
    server.addEventListener('close', () => this.handleDisconnect(server));
    server.addEventListener('error', (error) => this.handleError(server, error));

    // Broadcast user join
    await this.broadcast({
      type: 'join',
      userId,
      userName,
      userEmail,
      roomId,
      timestamp: Date.now(),
      data: { participant, participantCount: this.roomState.participants.size },
    }, server);

    // Send current room state to new user
    server.send(JSON.stringify({
      type: 'room_state',
      data: {
        roomId: this.roomState.roomId,
        roadmapId: this.roomState.roadmapId,
        participants: Array.from(this.roomState.participants.values()),
        isLocked: this.roomState.isLocked,
        lockedBy: this.roomState.lockedBy,
        chatHistory: this.roomState.chatHistory.slice(-50), // Last 50 messages
      },
    }));

    // Persist room state
    await this.persistRoomState();

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private async handleMessage(websocket: WebSocket, event: MessageEvent) {
    try {
      const participant = this.sessions.get(websocket);
      if (!participant) return;

      const message: CollaborationMessage = JSON.parse(event.data as string);

      // Update participant activity
      participant.lastActivity = Date.now();
      this.roomState.lastActivity = Date.now();

      // Handle different message types
      switch (message.type) {
        case 'cursor_move':
          await this.handleCursorMove(websocket, message);
          break;
        case 'node_update':
          await this.handleNodeUpdate(websocket, message);
          break;
        case 'edge_update':
          await this.handleEdgeUpdate(websocket, message);
          break;
        case 'chat_message':
          await this.handleChatMessage(websocket, message);
          break;
        case 'roadmap_lock':
          await this.handleRoadmapLock(websocket, message);
          break;
        case 'roadmap_unlock':
          await this.handleRoadmapUnlock(websocket, message);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }

      // Persist room state periodically
      if (Date.now() - (this.roomState.lastActivity || 0) > 30000) {
        await this.persistRoomState();
      }

    } catch (error) {
      console.error('Error handling message:', error);
      websocket.send(JSON.stringify({
        type: 'error',
        data: { message: 'Failed to process message' },
      }));
    }
  }

  private async handleCursorMove(websocket: WebSocket, message: CollaborationMessage) {
    const participant = this.sessions.get(websocket);
    if (!participant) return;

    // Update cursor position
    participant.cursor = message.data.cursor;
    this.roomState.participants.set(participant.userId, participant);

    // Broadcast cursor position to others
    await this.broadcast(message, websocket);
  }

  private async handleNodeUpdate(websocket: WebSocket, message: CollaborationMessage) {
    const participant = this.sessions.get(websocket);
    if (!participant || !['owner', 'editor'].includes(participant.role)) {
      websocket.send(JSON.stringify({
        type: 'error',
        data: { message: 'Insufficient permissions for node updates' },
      }));
      return;
    }

    // Check if roadmap is locked by another user
    if (this.roomState.isLocked && this.roomState.lockedBy !== participant.userId) {
      websocket.send(JSON.stringify({
        type: 'error',
        data: { message: 'Roadmap is locked by another user' },
      }));
      return;
    }

    // Save to D1 database
    try {
      await this.saveNodeUpdate(message.data);
      await this.broadcast(message, websocket);
    } catch (error) {
      console.error('Failed to save node update:', error);
      websocket.send(JSON.stringify({
        type: 'error',
        data: { message: 'Failed to save changes' },
      }));
    }
  }

  private async handleEdgeUpdate(websocket: WebSocket, message: CollaborationMessage) {
    const participant = this.sessions.get(websocket);
    if (!participant || !['owner', 'editor'].includes(participant.role)) {
      websocket.send(JSON.stringify({
        type: 'error',
        data: { message: 'Insufficient permissions for edge updates' },
      }));
      return;
    }

    // Check roadmap lock
    if (this.roomState.isLocked && this.roomState.lockedBy !== participant.userId) {
      websocket.send(JSON.stringify({
        type: 'error',
        data: { message: 'Roadmap is locked by another user' },
      }));
      return;
    }

    try {
      await this.saveEdgeUpdate(message.data);
      await this.broadcast(message, websocket);
    } catch (error) {
      console.error('Failed to save edge update:', error);
      websocket.send(JSON.stringify({
        type: 'error',
        data: { message: 'Failed to save changes' },
      }));
    }
  }

  private async handleChatMessage(websocket: WebSocket, message: CollaborationMessage) {
    // Add to chat history
    this.roomState.chatHistory.push({
      ...message,
      timestamp: Date.now(),
    });

    // Keep only last 100 messages
    if (this.roomState.chatHistory.length > 100) {
      this.roomState.chatHistory = this.roomState.chatHistory.slice(-100);
    }

    // Broadcast to all participants
    await this.broadcast(message, websocket);
  }

  private async handleRoadmapLock(websocket: WebSocket, message: CollaborationMessage) {
    const participant = this.sessions.get(websocket);
    if (!participant || !['owner', 'editor'].includes(participant.role)) {
      websocket.send(JSON.stringify({
        type: 'error',
        data: { message: 'Insufficient permissions to lock roadmap' },
      }));
      return;
    }

    if (this.roomState.isLocked && this.roomState.lockedBy !== participant.userId) {
      websocket.send(JSON.stringify({
        type: 'error',
        data: { message: 'Roadmap already locked by another user' },
      }));
      return;
    }

    this.roomState.isLocked = true;
    this.roomState.lockedBy = participant.userId;
    this.roomState.lockTimestamp = Date.now();

    await this.broadcast({
      ...message,
      data: {
        lockedBy: participant.userId,
        lockedByName: participant.userName,
        timestamp: Date.now(),
      },
    });
  }

  private async handleRoadmapUnlock(websocket: WebSocket, message: CollaborationMessage) {
    const participant = this.sessions.get(websocket);
    if (!participant) return;

    // Only the user who locked it or an owner can unlock
    if (this.roomState.lockedBy !== participant.userId && participant.role !== 'owner') {
      websocket.send(JSON.stringify({
        type: 'error',
        data: { message: 'Cannot unlock roadmap locked by another user' },
      }));
      return;
    }

    this.roomState.isLocked = false;
    this.roomState.lockedBy = undefined;
    this.roomState.lockTimestamp = undefined;

    await this.broadcast({
      ...message,
      data: {
        unlockedBy: participant.userId,
        unlockedByName: participant.userName,
        timestamp: Date.now(),
      },
    });
  }

  private async handleDisconnect(websocket: WebSocket) {
    const participant = this.sessions.get(websocket);
    if (!participant) return;

    // Remove from sessions and room state
    this.sessions.delete(websocket);
    this.roomState.participants.delete(participant.userId);

    // If this user had the roadmap locked, unlock it
    if (this.roomState.isLocked && this.roomState.lockedBy === participant.userId) {
      this.roomState.isLocked = false;
      this.roomState.lockedBy = undefined;
      this.roomState.lockTimestamp = undefined;
    }

    // Broadcast user leave
    await this.broadcast({
      type: 'leave',
      userId: participant.userId,
      userName: participant.userName,
      userEmail: participant.userEmail,
      roomId: this.roomState.roomId,
      timestamp: Date.now(),
      data: { participantCount: this.roomState.participants.size },
    });

    // Persist state
    await this.persistRoomState();

    // Clean up room if no participants
    if (this.roomState.participants.size === 0) {
      await this.cleanupRoom();
    }
  }

  private async handleError(websocket: WebSocket, error: any) {
    console.error('WebSocket error:', error);
    await this.handleDisconnect(websocket);
  }

  private async broadcast(message: CollaborationMessage, excludeSocket?: WebSocket) {
    const messageStr = JSON.stringify(message);
    for (const [socket] of this.sessions) {
      if (socket !== excludeSocket && socket.readyState === WebSocket.READY_STATE_OPEN) {
        try {
          socket.send(messageStr);
        } catch (error) {
          console.error('Failed to send message to socket:', error);
          await this.handleDisconnect(socket);
        }
      }
    }
  }

  private async validateUserAccess(userId: string, roadmapId: string, role: string): Promise<boolean> {
    // Implement actual permission checking logic here
    // This would typically check against the D1 database
    try {
      const result = await this.env.DB.prepare(
        'SELECT 1 FROM roadmap_collaborators WHERE user_id = ? AND roadmap_id = ? AND permission IN (?, ?, ?, ?)'
      ).bind(userId, roadmapId, 'owner', 'editor', 'commenter', 'viewer').first();

      return !!result;
    } catch (error) {
      console.error('Failed to validate user access:', error);
      return false;
    }
  }

  private async saveNodeUpdate(data: any) {
    // Save node update to D1 database
    try {
      await this.env.DB.prepare(
        'UPDATE roadmaps SET json_graph = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(JSON.stringify(data.graph), this.roomState.roadmapId).run();
    } catch (error) {
      console.error('Failed to save node update:', error);
      throw error;
    }
  }

  private async saveEdgeUpdate(data: any) {
    // Save edge update to D1 database
    try {
      await this.env.DB.prepare(
        'UPDATE roadmaps SET json_graph = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(JSON.stringify(data.graph), this.roomState.roadmapId).run();
    } catch (error) {
      console.error('Failed to save edge update:', error);
      throw error;
    }
  }

  private async persistRoomState() {
    try {
      await this.state.storage.put('roomState', {
        ...this.roomState,
        participants: Object.fromEntries(this.roomState.participants),
      });
    } catch (error) {
      console.error('Failed to persist room state:', error);
    }
  }

  private async cleanupRoom() {
    try {
      await this.state.storage.deleteAll();
    } catch (error) {
      console.error('Failed to cleanup room:', error);
    }
  }

  private async getRoomInfo(): Promise<Response> {
    return new Response(JSON.stringify({
      roomId: this.roomState.roomId,
      roadmapId: this.roomState.roadmapId,
      participantCount: this.roomState.participants.size,
      isLocked: this.roomState.isLocked,
      lockedBy: this.roomState.lockedBy,
      lastActivity: this.roomState.lastActivity,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async getParticipants(): Promise<Response> {
    return new Response(JSON.stringify({
      participants: Array.from(this.roomState.participants.values()),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Environment interface for TypeScript
interface Env {
  DB: D1Database;
  KV_COLLABORATION: KVNamespace;
  KV_SESSIONS: KVNamespace;
}