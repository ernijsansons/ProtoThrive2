// Simple API endpoint for ProtoThrive backend
export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({ 
      message: 'ProtoThrive API is running!', 
      timestamp: new Date().toISOString(),
      status: 'healthy'
    });
  } else if (req.method === 'POST') {
    const { prompt } = req.body;
    
    // Simulate AI processing
    setTimeout(() => {
      res.status(200).json({
        response: `I understand you want to: "${prompt}". I can help you create:
        
• Frontend components
• Backend APIs  
• Database schemas
• Deployment configs
• Testing suites

Let me know what you'd like to start with!`,
        nodes: [
          { id: 'start', label: 'Project Start', status: 'completed' },
          { id: 'design', label: 'UI Design', status: 'active' },
          { id: 'develop', label: 'Development', status: 'pending' },
          { id: 'deploy', label: 'Deployment', status: 'pending' }
        ],
        thriveScore: Math.floor(Math.random() * 20) + 75
      });
    }, 1000);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}