// WebSocket Manager Durable Object for real-time updates
import type { WebSocketEvent } from '@devcommand/shared';

interface Connection {
  userId: string;
  websocket: WebSocket;
  roadmapIds: Set<string>;
}

export class WebSocketManager implements DurableObject {
  private state: DurableObjectState;
  private connections: Map<string, Connection> = new Map();

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      // Get user ID from query params
      const userId = url.searchParams.get('userId');
      if (!userId) {
        return new Response('Unauthorized', { status: 401 });
      }

      // Accept the WebSocket connection
      server.accept();

      // Store connection
      const connectionId = crypto.randomUUID();
      this.connections.set(connectionId, {
        userId,
        websocket: server,
        roadmapIds: new Set(),
      });

      // Set up event handlers
      server.addEventListener('message', async (event) => {
        await this.handleMessage(connectionId, event.data as string);
      });

      server.addEventListener('close', () => {
        this.connections.delete(connectionId);
      });

      server.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        this.connections.delete(connectionId);
      });

      // Send initial connection success
      server.send(
        JSON.stringify({
          type: 'connection.open',
          timestamp: new Date().toISOString(),
          data: { connectionId, userId },
        }),
      );

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    // Handle broadcast requests
    if (url.pathname === '/broadcast' && request.method === 'POST') {
      const event = await request.json() as WebSocketEvent;
      await this.broadcast(event);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Handle targeted send
    if (url.pathname === '/send' && request.method === 'POST') {
      const { userId, event } = await request.json() as { userId: string; event: WebSocketEvent };
      await this.sendToUser(userId, event);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  }

  private async handleMessage(connectionId: string, message: string) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'subscribe':
          if (data.roadmapId) {
            connection.roadmapIds.add(data.roadmapId);
          }
          break;

        case 'unsubscribe':
          if (data.roadmapId) {
            connection.roadmapIds.delete(data.roadmapId);
          }
          break;

        case 'ping':
          connection.websocket.send(
            JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString(),
            }),
          );
          break;

        default:
          console.warn('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  private async broadcast(event: WebSocketEvent) {
    const message = JSON.stringify(event);

    for (const [, connection] of this.connections) {
      try {
        connection.websocket.send(message);
      } catch (error) {
        console.error('Error broadcasting to connection:', error);
      }
    }
  }

  private async sendToUser(userId: string, event: WebSocketEvent) {
    const message = JSON.stringify(event);

    for (const [, connection] of this.connections) {
      if (connection.userId === userId) {
        try {
          connection.websocket.send(message);
        } catch (error) {
          console.error('Error sending to user:', error);
        }
      }
    }
  }

  private async sendToRoadmap(roadmapId: string, event: WebSocketEvent) {
    const message = JSON.stringify(event);

    for (const [, connection] of this.connections) {
      if (connection.roadmapIds.has(roadmapId)) {
        try {
          connection.websocket.send(message);
        } catch (error) {
          console.error('Error sending to roadmap subscribers:', error);
        }
      }
    }
  }
}