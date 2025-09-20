/**
 * ProtoThrive Backend - JavaScript Worker for Staging
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Add CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };

    // Handle OPTIONS request
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check endpoint
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({
          status: 'ok',
          message: 'ProtoThrive Backend is running',
          environment: env.ENVIRONMENT || 'staging',
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: corsHeaders
        });
      }

      // API info endpoint
      if (url.pathname === '/' || url.pathname === '/api') {
        return new Response(JSON.stringify({
          name: 'ProtoThrive Backend API',
          version: '1.0.0',
          environment: env.ENVIRONMENT || 'staging',
          endpoints: [
            '/health - Health check',
            '/api/roadmaps - Roadmap management',
            '/api/snippets - Code snippets',
            '/api/agents - AI agent orchestration'
          ]
        }), {
          status: 200,
          headers: corsHeaders
        });
      }

      // Mock roadmaps endpoint
      if (url.pathname.startsWith('/api/roadmaps')) {
        return new Response(JSON.stringify({
          roadmaps: [
            {
              id: 'rm-thermo-1',
              title: 'Sample Roadmap',
              status: 'active',
              thrive_score: 0.75
            }
          ]
        }), {
          status: 200,
          headers: corsHeaders
        });
      }

      // 404 for unknown routes
      return new Response(JSON.stringify({
        error: 'Not found',
        path: url.pathname
      }), {
        status: 404,
        headers: corsHeaders
      });

    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};