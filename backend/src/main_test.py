"""
Minimal test handler for Cloudflare Workers Python
"""

from js import Response

async def on_fetch(request, env):
    """Handle incoming requests with minimal logic"""
    try:
        url = request.url
        path = url.split('/')[-1] if '/' in url else ''

        # Simple health check
        if 'health' in path:
            return Response.new('{"status":"ok","message":"Backend is running"}',
                              status=200,
                              headers={"Content-Type": "application/json"})

        # Default response
        return Response.new('{"message":"ProtoThrive Backend Test"}',
                          status=200,
                          headers={"Content-Type": "application/json"})

    except Exception as e:
        return Response.new(f'{{"error":"{str(e)}"}}',
                          status=500,
                          headers={"Content-Type": "application/json"})