import { NextApiRequest, NextApiResponse } from 'next';

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: 'healthy' | 'unhealthy';
    api: 'healthy' | 'unhealthy';
    cache: 'healthy' | 'unhealthy';
  };
  metrics: {
    memoryUsage: number;
    cpuUsage: number;
    responseTime: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheckResponse>
) {
  const startTime = Date.now();
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'unhealthy',
        api: 'unhealthy',
        cache: 'unhealthy',
      },
      metrics: {
        memoryUsage: 0,
        cpuUsage: 0,
        responseTime: 0,
      },
    });
  }

  try {
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);

    // Check if we're in a healthy state
    const isHealthy = memoryUsageMB < 1000; // Less than 1GB memory usage

    // Simulate service health checks
    const services = {
      database: 'healthy' as const, // In real implementation, check actual DB connection
      api: 'healthy' as const,     // In real implementation, check API endpoints
      cache: 'healthy' as const,   // In real implementation, check cache service
    };

    const responseTime = Date.now() - startTime;

    const healthResponse: HealthCheckResponse = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services,
      metrics: {
        memoryUsage: memoryUsageMB,
        cpuUsage: 0, // Would need additional library to measure CPU
        responseTime,
      },
    };

    // Set appropriate status code
    const statusCode = isHealthy ? 200 : 503;
    
    // Set cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.status(statusCode).json(healthResponse);
  } catch (error) {
    console.error('Health check failed:', error);
    
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'unhealthy',
        api: 'unhealthy',
        cache: 'unhealthy',
      },
      metrics: {
        memoryUsage: 0,
        cpuUsage: 0,
        responseTime: Date.now() - startTime,
      },
    });
  }
}
