import { NextApiRequest, NextApiResponse } from 'next';

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  services: {
    database: 'healthy' | 'unhealthy' | 'unknown';
    redis: 'healthy' | 'unhealthy' | 'unknown';
    backend: 'healthy' | 'unhealthy' | 'unknown';
  };
  metrics: {
    uptime: number;
    memory_usage: NodeJS.MemoryUsage;
    cpu_usage?: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheckResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'unknown',
        redis: 'unknown',
        backend: 'unknown',
      },
      metrics: {
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
      },
    });
  }

  try {
    const startTime = Date.now();
    
    // Check backend service
    let backendStatus: 'healthy' | 'unhealthy' | 'unknown' = 'unknown';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      backendStatus = backendResponse.ok ? 'healthy' : 'unhealthy';
    } catch (error) {
      backendStatus = 'unhealthy';
    }

    // Check database (if we have direct access)
    let databaseStatus: 'healthy' | 'unhealthy' | 'unknown' = 'unknown';
    // In a real implementation, you might check database connectivity here
    // For now, we'll assume it's healthy if the backend is healthy
    databaseStatus = backendStatus === 'healthy' ? 'healthy' : 'unknown';

    // Check Redis (if we have direct access)
    let redisStatus: 'healthy' | 'unhealthy' | 'unknown' = 'unknown';
    // In a real implementation, you might check Redis connectivity here
    // For now, we'll assume it's healthy if the backend is healthy
    redisStatus = backendStatus === 'healthy' ? 'healthy' : 'unknown';

    const responseTime = Date.now() - startTime;
    
    const overallStatus = backendStatus === 'healthy' && databaseStatus === 'healthy' && redisStatus === 'healthy' 
      ? 'healthy' 
      : 'unhealthy';

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: databaseStatus,
        redis: redisStatus,
        backend: backendStatus,
      },
      metrics: {
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        cpu_usage: responseTime,
      },
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    res.status(statusCode).json(response);

  } catch (error) {
    console.error('Health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'unknown',
        redis: 'unknown',
        backend: 'unknown',
      },
      metrics: {
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
      },
    });
  }
}