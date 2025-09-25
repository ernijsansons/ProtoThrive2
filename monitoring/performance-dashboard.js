/**
 * ProtoThrive Performance Monitoring Dashboard
 * Real-time performance metrics with automated alerts
 * Ref: CLAUDE.md Performance Optimization Requirements
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const WebSocket = require('ws');
const prometheus = require('prom-client');

// Initialize Prometheus metrics
const register = new prometheus.Registry();

// Custom metrics for ProtoThrive
const httpRequestDuration = new prometheus.Histogram({
  name: 'protothrive_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5]
});

const databaseQueryDuration = new prometheus.Histogram({
  name: 'protothrive_database_query_duration_seconds',  
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.2, 0.5]
});

const thriveScoreGauge = new prometheus.Gauge({
  name: 'protothrive_thrive_score',
  help: 'Current Thrive Score of active roadmaps',
  labelNames: ['user_id', 'roadmap_id']
});

const aiModelCostCounter = new prometheus.Counter({
  name: 'protothrive_ai_model_cost_total',
  help: 'Total cost of AI model usage',
  labelNames: ['model', 'task_type']
});

const cacheHitRatio = new prometheus.Gauge({
  name: 'protothrive_cache_hit_ratio',
  help: 'Cache hit ratio (0-1)',
  labelNames: ['cache_type']
});

const activeUsersGauge = new prometheus.Gauge({
  name: 'protothrive_active_users',
  help: 'Number of active users'
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(databaseQueryDuration);
register.registerMetric(thriveScoreGauge);
register.registerMetric(aiModelCostCounter);
register.registerMetric(cacheHitRatio);
register.registerMetric(activeUsersGauge);

class PerformanceMonitor {
  constructor() {
    this.app = express();
    this.wss = new WebSocket.Server({ port: 8081 });
    this.metrics = {
      requests: new Map(),
      dbQueries: new Map(),
      thriveScores: new Map(),
      aiCosts: 0,
      cacheStats: new Map(),
      alerts: []
    };
    
    this.thresholds = {
      apiLatencyP95: 500, // ms
      dbLatencyP90: 100,  // ms
      errorRate: 0.02,    // 2%
      cacheHitRate: 0.9,  // 90%
      thriveScore: 0.5    // 50%
    };
    
    this.setupRoutes();
    this.setupWebSocket();
    this.startMetricsCollection();
  }

  setupRoutes() {
    // Metrics endpoint for Prometheus
    this.app.get('/metrics', async (req, res) => {
      try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
      } catch (error) {
        res.status(500).end(error);
      }
    });

    // Performance dashboard
    this.app.get('/dashboard', (req, res) => {
      res.send(this.generateDashboardHTML());
    });

    // Real-time metrics API
    this.app.get('/api/metrics/realtime', (req, res) => {
      res.json({
        timestamp: Date.now(),
        metrics: this.calculateRealtimeMetrics(),
        alerts: this.metrics.alerts.slice(-10), // Last 10 alerts
        thresholds: this.thresholds
      });
    });

    // Performance trends API
    this.app.get('/api/metrics/trends', (req, res) => {
      const timeRange = req.query.range || '1h';
      res.json(this.getPerformanceTrends(timeRange));
    });

    // Health check with performance indicators
    this.app.get('/health', (req, res) => {
      const health = this.calculateSystemHealth();
      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    });

    // Serve static dashboard assets
    this.app.use('/static', express.static(__dirname + '/dashboard-assets'));
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('Dashboard client connected');
      
      // Send initial metrics
      ws.send(JSON.stringify({
        type: 'initial',
        data: this.calculateRealtimeMetrics()
      }));

      ws.on('close', () => {
        console.log('Dashboard client disconnected');
      });
    });
  }

  startMetricsCollection() {
    // Collect metrics every 10 seconds
    setInterval(() => {
      this.collectMetrics();
      this.checkThresholds();
      this.broadcastMetrics();
    }, 10000);

    // Collect AI cost metrics every minute
    setInterval(() => {
      this.collectAICostMetrics();
    }, 60000);
  }

  async collectMetrics() {
    try {
      // Collect API performance metrics
      const apiMetrics = await this.getAPIMetrics();
      this.updatePrometheusMetrics(apiMetrics);

      // Collect database performance metrics
      const dbMetrics = await this.getDatabaseMetrics();
      this.updateDatabaseMetrics(dbMetrics);

      // Collect cache performance metrics
      const cacheMetrics = await this.getCacheMetrics();
      this.updateCacheMetrics(cacheMetrics);

      // Collect business metrics (Thrive Scores)
      const businessMetrics = await this.getBusinessMetrics();
      this.updateBusinessMetrics(businessMetrics);

    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }

  async getAPIMetrics() {
    // Mock implementation - replace with actual API monitoring
    return {
      totalRequests: Math.floor(Math.random() * 1000) + 500,
      avgLatency: Math.random() * 200 + 50,
      p95Latency: Math.random() * 400 + 100,
      errorRate: Math.random() * 0.05,
      requestsByEndpoint: {
        '/api/roadmaps': { count: 350, avgLatency: 120 },
        '/api/snippets': { count: 150, avgLatency: 80 },
        '/health': { count: 100, avgLatency: 30 }
      }
    };
  }

  async getDatabaseMetrics() {
    return {
      totalQueries: Math.floor(Math.random() * 500) + 200,
      avgLatency: Math.random() * 50 + 10,
      p90Latency: Math.random() * 80 + 20,
      cacheHitRate: 0.85 + Math.random() * 0.1,
      queriesByType: {
        'SELECT': { count: 180, avgLatency: 25 },
        'INSERT': { count: 30, avgLatency: 45 },
        'UPDATE': { count: 20, avgLatency: 35 }
      }
    };
  }

  async getCacheMetrics() {
    return {
      kvCache: {
        hitRate: 0.88 + Math.random() * 0.1,
        totalRequests: Math.floor(Math.random() * 1000) + 500
      },
      computationCache: {
        hitRate: 0.75 + Math.random() * 0.15,
        totalRequests: Math.floor(Math.random() * 200) + 100
      }
    };
  }

  async getBusinessMetrics() {
    return {
      avgThriveScore: 0.4 + Math.random() * 0.4,
      activeRoadmaps: Math.floor(Math.random() * 50) + 25,
      completedTasks: Math.floor(Math.random() * 200) + 100,
      activeUsers: Math.floor(Math.random() * 20) + 10
    };
  }

  updatePrometheusMetrics(apiMetrics) {
    // Update HTTP request metrics
    httpRequestDuration.observe(
      { method: 'GET', route: '/api/roadmaps', status_code: '200' },
      apiMetrics.avgLatency / 1000
    );

    // Update active users
    activeUsersGauge.set(Math.floor(Math.random() * 50) + 10);
  }

  updateDatabaseMetrics(dbMetrics) {
    databaseQueryDuration.observe(
      { query_type: 'SELECT', table: 'roadmaps' },
      dbMetrics.avgLatency / 1000
    );
  }

  updateCacheMetrics(cacheMetrics) {
    cacheHitRatio.set({ cache_type: 'kv' }, cacheMetrics.kvCache.hitRate);
    cacheHitRatio.set({ cache_type: 'computation' }, cacheMetrics.computationCache.hitRate);
  }

  updateBusinessMetrics(businessMetrics) {
    // Update thrive score for mock roadmaps
    for (let i = 1; i <= 5; i++) {
      thriveScoreGauge.set(
        { user_id: `user_${i}`, roadmap_id: `roadmap_${i}` },
        businessMetrics.avgThriveScore + (Math.random() - 0.5) * 0.2
      );
    }

    // Mock AI cost tracking
    aiModelCostCounter.inc({ model: 'kimi', task_type: 'code' }, Math.random() * 0.01);
    aiModelCostCounter.inc({ model: 'claude', task_type: 'audit' }, Math.random() * 0.05);
  }

  calculateRealtimeMetrics() {
    // Mock real-time calculations
    const now = Date.now();
    return {
      timestamp: now,
      api: {
        requestsPerSecond: Math.floor(Math.random() * 20) + 5,
        avgLatency: Math.random() * 200 + 50,
        p95Latency: Math.random() * 400 + 100,
        errorRate: Math.random() * 0.05
      },
      database: {
        queriesPerSecond: Math.floor(Math.random() * 10) + 2,
        avgLatency: Math.random() * 50 + 10,
        cacheHitRate: 0.85 + Math.random() * 0.1
      },
      business: {
        avgThriveScore: 0.4 + Math.random() * 0.4,
        activeUsers: Math.floor(Math.random() * 50) + 10,
        aiCostPerHour: Math.random() * 5 + 1
      }
    };
  }

  checkThresholds() {
    const metrics = this.calculateRealtimeMetrics();
    const alerts = [];

    // Check API performance thresholds
    if (metrics.api.p95Latency > this.thresholds.apiLatencyP95) {
      alerts.push({
        type: 'API_LATENCY_HIGH',
        severity: 'warning',
        message: `API P95 latency ${metrics.api.p95Latency.toFixed(0)}ms exceeds threshold ${this.thresholds.apiLatencyP95}ms`,
        timestamp: Date.now(),
        value: metrics.api.p95Latency,
        threshold: this.thresholds.apiLatencyP95
      });
    }

    // Check database performance thresholds
    if (metrics.database.avgLatency > this.thresholds.dbLatencyP90) {
      alerts.push({
        type: 'DB_LATENCY_HIGH',
        severity: 'warning',
        message: `Database latency ${metrics.database.avgLatency.toFixed(0)}ms exceeds threshold ${this.thresholds.dbLatencyP90}ms`,
        timestamp: Date.now(),
        value: metrics.database.avgLatency,
        threshold: this.thresholds.dbLatencyP90
      });
    }

    // Check error rate
    if (metrics.api.errorRate > this.thresholds.errorRate) {
      alerts.push({
        type: 'ERROR_RATE_HIGH',
        severity: 'critical',
        message: `Error rate ${(metrics.api.errorRate * 100).toFixed(1)}% exceeds threshold ${(this.thresholds.errorRate * 100)}%`,
        timestamp: Date.now(),
        value: metrics.api.errorRate,
        threshold: this.thresholds.errorRate
      });
    }

    // Check cache hit rate
    if (metrics.database.cacheHitRate < this.thresholds.cacheHitRate) {
      alerts.push({
        type: 'CACHE_HIT_RATE_LOW',
        severity: 'warning',
        message: `Cache hit rate ${(metrics.database.cacheHitRate * 100).toFixed(1)}% below threshold ${(this.thresholds.cacheHitRate * 100)}%`,
        timestamp: Date.now(),
        value: metrics.database.cacheHitRate,
        threshold: this.thresholds.cacheHitRate
      });
    }

    // Add new alerts
    alerts.forEach(alert => {
      this.metrics.alerts.push(alert);
      console.log(`🚨 ALERT: ${alert.message}`);
      
      // Send Slack notification for critical alerts
      if (alert.severity === 'critical') {
        this.sendSlackAlert(alert);
      }
    });

    // Keep only last 100 alerts
    if (this.metrics.alerts.length > 100) {
      this.metrics.alerts = this.metrics.alerts.slice(-100);
    }
  }

  broadcastMetrics() {
    const metrics = this.calculateRealtimeMetrics();
    
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'update',
          data: metrics,
          alerts: this.metrics.alerts.slice(-5) // Last 5 alerts
        }));
      }
    });
  }

  calculateSystemHealth() {
    const metrics = this.calculateRealtimeMetrics();
    
    let healthScore = 100;
    const issues = [];

    // Deduct points for performance issues
    if (metrics.api.p95Latency > this.thresholds.apiLatencyP95) {
      healthScore -= 20;
      issues.push('High API latency');
    }

    if (metrics.database.avgLatency > this.thresholds.dbLatencyP90) {
      healthScore -= 15;
      issues.push('High database latency');
    }

    if (metrics.api.errorRate > this.thresholds.errorRate) {
      healthScore -= 30;
      issues.push('High error rate');
    }

    if (metrics.database.cacheHitRate < this.thresholds.cacheHitRate) {
      healthScore -= 10;
      issues.push('Low cache hit rate');
    }

    return {
      status: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'degraded' : 'unhealthy',
      score: healthScore,
      issues: issues,
      metrics: metrics,
      timestamp: Date.now()
    };
  }

  generateDashboardHTML() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>ProtoThrive Performance Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #1a1a1a; color: #fff; }
        .dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
        .metric-card { background: #2d2d2d; padding: 20px; border-radius: 10px; border: 1px solid #444; }
        .metric-value { font-size: 2em; font-weight: bold; color: #00ffff; }
        .metric-label { color: #ccc; margin-bottom: 10px; }
        .status-healthy { color: #4CAF50; }
        .status-warning { color: #FFC107; }
        .status-critical { color: #F44336; }
        .chart-container { height: 200px; margin-top: 15px; }
        .alert { padding: 10px; margin: 5px 0; border-radius: 5px; border-left: 4px solid; }
        .alert-warning { background: rgba(255, 193, 7, 0.1); border-color: #FFC107; }
        .alert-critical { background: rgba(244, 67, 54, 0.1); border-color: #F44336; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #00ffff; margin: 0; }
        .last-updated { color: #888; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 ProtoThrive Performance Dashboard</h1>
        <div class="last-updated">Last updated: <span id="lastUpdated">-</span></div>
    </div>
    
    <div class="dashboard">
        <div class="metric-card">
            <div class="metric-label">API Performance</div>
            <div class="metric-value"><span id="apiLatency">-</span>ms</div>
            <div>P95 Latency • <span id="apiStatus" class="status-healthy">Healthy</span></div>
            <div class="chart-container">
                <canvas id="apiChart"></canvas>
            </div>
        </div>
        
        <div class="metric-card">
            <div class="metric-label">Database Performance</div>
            <div class="metric-value"><span id="dbLatency">-</span>ms</div>
            <div>Avg Query Time • <span id="dbStatus" class="status-healthy">Healthy</span></div>
            <div class="chart-container">
                <canvas id="dbChart"></canvas>
            </div>
        </div>
        
        <div class="metric-card">
            <div class="metric-label">Cache Performance</div>
            <div class="metric-value"><span id="cacheHitRate">-</span>%</div>
            <div>Hit Rate • <span id="cacheStatus" class="status-healthy">Healthy</span></div>
            <div class="chart-container">
                <canvas id="cacheChart"></canvas>
            </div>
        </div>
        
        <div class="metric-card">
            <div class="metric-label">Thrive Score</div>
            <div class="metric-value"><span id="thriveScore">-</span></div>
            <div>Average • <span id="thriveStatus" class="status-healthy">Healthy</span></div>
            <div class="chart-container">
                <canvas id="thriveChart"></canvas>
            </div>
        </div>
        
        <div class="metric-card">
            <div class="metric-label">AI Cost Optimization</div>
            <div class="metric-value">$<span id="aiCost">-</span>/hr</div>
            <div>Current Rate • <span id="costStatus" class="status-healthy">Optimized</span></div>
            <div style="margin-top: 10px; font-size: 0.9em; color: #ccc;">
                Kimi Usage: <span id="kimiPercentage">80</span>% | 
                Cost Savings: <span id="costSavings">70</span>%
            </div>
        </div>
        
        <div class="metric-card" style="grid-column: 1 / -1;">
            <div class="metric-label">Recent Alerts</div>
            <div id="alertsList">No recent alerts</div>
        </div>
    </div>

    <script>
        const ws = new WebSocket('ws://localhost:8081');
        
        ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            updateDashboard(data.data);
            updateAlerts(data.alerts || []);
        };
        
        function updateDashboard(metrics) {
            document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
            
            // API metrics
            document.getElementById('apiLatency').textContent = Math.round(metrics.api.p95Latency);
            updateStatus('apiStatus', metrics.api.p95Latency, 500);
            
            // Database metrics
            document.getElementById('dbLatency').textContent = Math.round(metrics.database.avgLatency);
            updateStatus('dbStatus', metrics.database.avgLatency, 100);
            
            // Cache metrics
            document.getElementById('cacheHitRate').textContent = Math.round(metrics.database.cacheHitRate * 100);
            updateStatus('cacheStatus', metrics.database.cacheHitRate, 0.9, true);
            
            // Business metrics
            document.getElementById('thriveScore').textContent = metrics.business.avgThriveScore.toFixed(2);
            updateStatus('thriveStatus', metrics.business.avgThriveScore, 0.5, true);
            
            // AI cost metrics
            document.getElementById('aiCost').textContent = metrics.business.aiCostPerHour.toFixed(2);
            updateStatus('costStatus', metrics.business.aiCostPerHour, 10);
        }
        
        function updateStatus(elementId, value, threshold, isHigherBetter = false) {
            const element = document.getElementById(elementId);
            const isHealthy = isHigherBetter ? value >= threshold : value <= threshold;
            
            element.className = isHealthy ? 'status-healthy' : 'status-warning';
            element.textContent = isHealthy ? 'Healthy' : 'Warning';
        }
        
        function updateAlerts(alerts) {
            const alertsList = document.getElementById('alertsList');
            
            if (alerts.length === 0) {
                alertsList.innerHTML = '<div style="color: #4CAF50;">✅ No recent alerts - All systems healthy</div>';
                return;
            }
            
            const alertsHTML = alerts.map(alert => 
                \`<div class="alert alert-\${alert.severity}">
                    <strong>\${alert.type}</strong>: \${alert.message}
                    <div style="font-size: 0.8em; color: #888;">\${new Date(alert.timestamp).toLocaleTimeString()}</div>
                </div>\`
            ).join('');
            
            alertsList.innerHTML = alertsHTML;
        }
        
        // Initialize charts (simplified for demo)
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        };
        
        // Create sample charts
        ['apiChart', 'dbChart', 'cacheChart', 'thriveChart'].forEach(chartId => {
            new Chart(document.getElementById(chartId), {
                type: 'line',
                data: {
                    labels: ['10s', '20s', '30s', '40s', '50s', 'Now'],
                    datasets: [{
                        data: Array.from({length: 6}, () => Math.random() * 100),
                        borderColor: '#00ffff',
                        backgroundColor: 'rgba(0, 255, 255, 0.1)',
                        fill: true
                    }]
                },
                options: { ...chartOptions, plugins: { legend: { display: false } } }
            });
        });
    </script>
</body>
</html>`;
  }

  async sendSlackAlert(alert) {
    // Mock Slack notification - replace with actual webhook URL
    console.log(`🔔 Slack Alert: ${alert.message}`);
  }

  start(port = 8080) {
    this.app.listen(port, () => {
      console.log(`🚀 ProtoThrive Performance Dashboard running on http://localhost:${port}`);
      console.log(`📊 Metrics endpoint: http://localhost:${port}/metrics`);
      console.log(`📈 Dashboard: http://localhost:${port}/dashboard`);
      console.log(`🔌 WebSocket: ws://localhost:8081`);
    });
  }
}

// Start the performance monitor
const monitor = new PerformanceMonitor();
monitor.start();

module.exports = PerformanceMonitor;