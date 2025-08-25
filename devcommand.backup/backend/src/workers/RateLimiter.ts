// Rate Limiter Durable Object
export class RateLimiter implements DurableObject {
  private state: DurableObjectState;
  private requests: Map<string, number[]> = new Map();

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/check' && request.method === 'POST') {
      const body = await request.json() as { limit: number; window: number };
      const now = Date.now();
      const windowStart = now - (body.window * 1000);

      // Get or initialize request timestamps
      const key = 'requests';
      let timestamps = this.requests.get(key) || [];
      
      // Clean old timestamps
      timestamps = timestamps.filter(ts => ts > windowStart);
      
      // Check if limit exceeded
      const allowed = timestamps.length < body.limit;
      
      if (allowed) {
        timestamps.push(now);
      }
      
      // Store updated timestamps
      this.requests.set(key, timestamps);
      
      // Persist state
      await this.state.storage.put(key, timestamps);
      
      return new Response(
        JSON.stringify({
          allowed,
          remaining: Math.max(0, body.limit - timestamps.length),
          count: timestamps.length,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (url.pathname === '/reset' && request.method === 'POST') {
      this.requests.clear();
      await this.state.storage.deleteAll();
      
      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response('Not found', { status: 404 });
  }

  async alarm(): Promise<void> {
    // Clean up old data periodically
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    for (const [key, timestamps] of this.requests.entries()) {
      const filtered = timestamps.filter(ts => ts > oneHourAgo);
      if (filtered.length === 0) {
        this.requests.delete(key);
        await this.state.storage.delete(key);
      } else if (filtered.length < timestamps.length) {
        this.requests.set(key, filtered);
        await this.state.storage.put(key, filtered);
      }
    }
  }
}