import { NextApiRequest, NextApiResponse } from 'next';

interface MonitoringData {
  type: 'performance' | 'error' | 'interaction';
  data: any;
  timestamp: number;
  userAgent?: string;
  sessionId?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const monitoringData: MonitoringData = req.body;

    // Validate the data
    if (!monitoringData.type || !monitoringData.timestamp) {
      return res.status(400).json({ error: 'Invalid monitoring data' });
    }

    // Log the monitoring data (in production, this would go to a monitoring service)
    console.log('Monitoring data received:', {
      type: monitoringData.type,
      timestamp: new Date(monitoringData.timestamp).toISOString(),
      data: monitoringData.data,
    });

    // In a real implementation, you would:
    // 1. Send to monitoring service (e.g., Sentry, DataDog, New Relic)
    // 2. Store in database for analytics
    // 3. Trigger alerts for critical errors
    // 4. Aggregate metrics for dashboards

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 10));

    return res.status(200).json({ 
      success: true, 
      message: 'Monitoring data received' 
    });
  } catch (error) {
    console.error('Error processing monitoring data:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}
