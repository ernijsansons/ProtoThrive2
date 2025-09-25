/**
 * ProtoThrive Enterprise Alerting and Incident Response System
 * Ref: CLAUDE.md Section 5 - Advanced alerting and incident management
 * 
 * Features:
 * - Multi-channel alerting (Slack, Email, PagerDuty, SMS)
 * - Smart alert aggregation and deduplication
 * - Escalation policies and on-call rotations
 * - Automated incident response
 * - Real-time dashboards and notifications
 * - Integration with monitoring systems
 */

export class AlertingSystem {
  constructor(env, monitoringService) {
    this.env = env;
    this.monitoring = monitoringService;
    this.activeAlerts = new Map();
    this.alertHistory = [];
    this.incidents = new Map();
    this.escalationPolicies = new Map();
    this.alertRules = new Map();
    this.suppressionRules = new Map();
    
    this.config = {
      alertCooldown: 300000, // 5 minutes
      escalationTimeouts: [900000, 1800000, 3600000], // 15min, 30min, 1hr
      maxAlertsPerHour: 50,
      criticalResponseTime: 300000, // 5 minutes
      channels: {
        slack: env.SLACK_WEBHOOK_URL,
        email: env.SENDGRID_API_KEY,
        pagerduty: env.PAGERDUTY_INTEGRATION_KEY,
        sms: env.TWILIO_ACCOUNT_SID
      }
    };
    
    this.initializeDefaultRules();
    console.log('Thermonuclear Alerting System: Enterprise incident response initialized');
  }

  // ALERT RULE MANAGEMENT
  initializeDefaultRules() {
    // Critical system alerts
    this.addAlertRule({
      id: 'database_down',
      name: 'Database Unavailable',
      condition: (metrics) => metrics.database?.status === 'unhealthy',
      severity: 'critical',
      channels: ['slack', 'pagerduty', 'email'],
      escalation: 'critical_infrastructure',
      cooldown: 60000, // 1 minute
      description: 'Primary database is not responding'
    });

    this.addAlertRule({
      id: 'high_error_rate',
      name: 'High Error Rate',
      condition: (metrics) => metrics.errorRate > 0.05, // 5%
      severity: 'warning',
      channels: ['slack', 'email'],
      escalation: 'performance_team',
      cooldown: 300000, // 5 minutes
      description: 'Error rate exceeds acceptable threshold'
    });

    this.addAlertRule({
      id: 'response_time_critical',
      name: 'Critical Response Time',
      condition: (metrics) => metrics.responseTime?.p95 > 2000, // 2 seconds
      severity: 'critical',
      channels: ['slack', 'pagerduty'],
      escalation: 'performance_team',
      cooldown: 180000, // 3 minutes
      description: 'API response time critically degraded'
    });

    this.addAlertRule({
      id: 'budget_exceeded',
      name: 'Budget Exceeded',
      condition: (metrics) => metrics.costs?.utilizationPercentage > 90,
      severity: 'warning',
      channels: ['slack', 'email'],
      escalation: 'finance_team',
      cooldown: 3600000, // 1 hour
      description: 'Monthly budget utilization critical'
    });

    this.addAlertRule({
      id: 'security_threat_detected',
      name: 'Security Threat',
      condition: (metrics) => metrics.security?.threatScore > 75,
      severity: 'critical',
      channels: ['slack', 'pagerduty', 'email'],
      escalation: 'security_team',
      cooldown: 60000, // 1 minute
      description: 'High threat score detected'
    });

    this.addAlertRule({
      id: 'rate_limit_violations',
      name: 'Rate Limit Violations',
      condition: (metrics) => metrics.security?.rateLimitViolations > 100,
      severity: 'warning',
      channels: ['slack'],
      escalation: 'security_team',
      cooldown: 900000, // 15 minutes
      description: 'Excessive rate limit violations detected'
    });

    // Initialize escalation policies
    this.initializeEscalationPolicies();
  }

  initializeEscalationPolicies() {
    this.escalationPolicies.set('critical_infrastructure', {
      name: 'Critical Infrastructure',
      levels: [
        { timeout: 0, contacts: ['on-call-engineer', 'team-lead'] },
        { timeout: 300000, contacts: ['engineering-manager', 'cto'] }, // 5 min
        { timeout: 900000, contacts: ['ceo', 'all-hands'] } // 15 min
      ]
    });

    this.escalationPolicies.set('performance_team', {
      name: 'Performance Team',
      levels: [
        { timeout: 0, contacts: ['performance-team'] },
        { timeout: 600000, contacts: ['engineering-lead'] }, // 10 min
        { timeout: 1800000, contacts: ['engineering-manager'] } // 30 min
      ]
    });

    this.escalationPolicies.set('security_team', {
      name: 'Security Team',
      levels: [
        { timeout: 0, contacts: ['security-team', 'on-call-security'] },
        { timeout: 180000, contacts: ['security-lead', 'cto'] }, // 3 min
        { timeout: 600000, contacts: ['ceo', 'legal-team'] } // 10 min
      ]
    });

    this.escalationPolicies.set('finance_team', {
      name: 'Finance Team',
      levels: [
        { timeout: 0, contacts: ['finance-team'] },
        { timeout: 3600000, contacts: ['cfo'] } // 1 hour
      ]
    });
  }

  addAlertRule(rule) {
    this.alertRules.set(rule.id, {
      ...rule,
      createdAt: Date.now(),
      lastTriggered: null,
      triggerCount: 0
    });
  }

  // ALERT PROCESSING ENGINE
  async processAlerts(metrics) {
    const triggeredAlerts = [];
    const now = Date.now();

    for (const [ruleId, rule] of this.alertRules.entries()) {
      try {
        // Check if rule condition is met
        if (rule.condition(metrics)) {
          // Check cooldown period
          const activeAlert = this.activeAlerts.get(ruleId);
          if (activeAlert && (now - activeAlert.lastSent) < rule.cooldown) {
            continue; // Still in cooldown
          }

          // Check rate limiting
          if (this.isRateLimited(ruleId)) {
            console.log(`Thermonuclear Alert: Rate limited for rule ${ruleId}`);
            continue;
          }

          // Create alert
          const alert = await this.createAlert(rule, metrics);
          triggeredAlerts.push(alert);

          // Send alert through configured channels
          await this.sendAlert(alert);

          // Update rule statistics
          rule.lastTriggered = now;
          rule.triggerCount++;
        } else {
          // Clear active alert if condition no longer met
          if (this.activeAlerts.has(ruleId)) {
            await this.resolveAlert(ruleId, 'condition_resolved');
          }
        }
      } catch (error) {
        console.error(`Thermonuclear Alert Processing Error for rule ${ruleId}:`, error);
      }
    }

    return triggeredAlerts;
  }

  async createAlert(rule, metrics) {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert = {
      id: alertId,
      ruleId: rule.id,
      name: rule.name,
      description: rule.description,
      severity: rule.severity,
      status: 'active',
      createdAt: Date.now(),
      lastSent: Date.now(),
      channels: rule.channels,
      escalationPolicy: rule.escalation,
      metrics: this.extractRelevantMetrics(metrics, rule),
      context: {
        environment: this.env.ENVIRONMENT,
        region: this.env.CF_REGION || 'unknown',
        version: this.env.RELEASE_VERSION || '1.0.0'
      },
      escalationLevel: 0,
      acknowledgedBy: null,
      resolvedBy: null,
      resolvedAt: null
    };

    // Store active alert
    this.activeAlerts.set(rule.id, alert);
    this.alertHistory.push(alert);

    // Create incident if critical
    if (rule.severity === 'critical') {
      await this.createIncident(alert);
    }

    console.log(`Thermonuclear Alert Created [${alert.severity.toUpperCase()}]: ${alert.name}`);
    
    return alert;
  }

  async sendAlert(alert) {
    const promises = [];

    for (const channel of alert.channels) {
      switch (channel) {
        case 'slack':
          promises.push(this.sendSlackAlert(alert));
          break;
        case 'email':
          promises.push(this.sendEmailAlert(alert));
          break;
        case 'pagerduty':
          promises.push(this.sendPagerDutyAlert(alert));
          break;
        case 'sms':
          promises.push(this.sendSMSAlert(alert));
          break;
        default:
          console.warn(`Unknown alert channel: ${channel}`);
      }
    }

    try {
      await Promise.allSettled(promises);
      
      // Start escalation timer if configured
      if (alert.escalationPolicy) {
        this.startEscalationTimer(alert);
      }
      
    } catch (error) {
      console.error('Thermonuclear Alert Sending Error:', error);
    }
  }

  // CHANNEL IMPLEMENTATIONS
  async sendSlackAlert(alert) {
    if (!this.config.channels.slack) {
      console.log('Slack webhook not configured, skipping Slack alert');
      return;
    }

    const color = this.getSeverityColor(alert.severity);
    const emoji = this.getSeverityEmoji(alert.severity);
    
    const payload = {
      username: 'ProtoThrive Alerts',
      icon_emoji: ':warning:',
      attachments: [{
        color: color,
        title: `${emoji} ${alert.name}`,
        text: alert.description,
        fields: [
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true
          },
          {
            title: 'Environment',
            value: alert.context.environment,
            short: true
          },
          {
            title: 'Alert ID',
            value: alert.id,
            short: true
          },
          {
            title: 'Triggered At',
            value: new Date(alert.createdAt).toISOString(),
            short: true
          }
        ],
        actions: [
          {
            type: 'button',
            text: 'Acknowledge',
            url: `${this.env.FRONTEND_URL}/alerts/${alert.id}/acknowledge`
          },
          {
            type: 'button',
            text: 'View Dashboard',
            url: `${this.env.FRONTEND_URL}/monitoring`
          }
        ],
        footer: 'ProtoThrive Monitoring',
        ts: Math.floor(alert.createdAt / 1000)
      }]
    };

    // Mock Slack API call - in production, use actual webhook
    console.log('Thermonuclear Slack Alert:', JSON.stringify(payload, null, 2));
    
    // Simulate API call
    return { success: true, channel: 'slack' };
  }

  async sendEmailAlert(alert) {
    if (!this.config.channels.email) {
      console.log('Email service not configured, skipping email alert');
      return;
    }

    const emailContent = this.generateEmailContent(alert);
    
    // Mock email sending - in production, use SendGrid API
    console.log('Thermonuclear Email Alert:', emailContent);
    
    return { success: true, channel: 'email' };
  }

  async sendPagerDutyAlert(alert) {
    if (!this.config.channels.pagerduty) {
      console.log('PagerDuty not configured, skipping PagerDuty alert');
      return;
    }

    const payload = {
      incident_key: alert.id,
      event_type: 'trigger',
      description: `${alert.name}: ${alert.description}`,
      details: {
        severity: alert.severity,
        environment: alert.context.environment,
        region: alert.context.region,
        version: alert.context.version,
        metrics: alert.metrics,
        alert_url: `${this.env.FRONTEND_URL}/alerts/${alert.id}`
      }
    };

    // Mock PagerDuty API call
    console.log('Thermonuclear PagerDuty Alert:', JSON.stringify(payload, null, 2));
    
    return { success: true, channel: 'pagerduty' };
  }

  async sendSMSAlert(alert) {
    if (!this.config.channels.sms) {
      console.log('SMS service not configured, skipping SMS alert');
      return;
    }

    const message = `🚨 ProtoThrive Alert: ${alert.name} - ${alert.severity.toUpperCase()} - ${alert.description}`;
    
    // Mock SMS sending - in production, use Twilio API
    console.log('Thermonuclear SMS Alert:', message);
    
    return { success: true, channel: 'sms' };
  }

  // INCIDENT MANAGEMENT
  async createIncident(alert) {
    const incidentId = `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const incident = {
      id: incidentId,
      title: `Critical Alert: ${alert.name}`,
      description: alert.description,
      status: 'open',
      severity: alert.severity,
      createdAt: Date.now(),
      alertId: alert.id,
      assignedTo: null,
      escalationLevel: 0,
      timeline: [{
        timestamp: Date.now(),
        event: 'incident_created',
        description: 'Incident automatically created from critical alert',
        user: 'system'
      }],
      metrics: alert.metrics,
      context: alert.context,
      postmortem: null
    };

    this.incidents.set(incidentId, incident);
    
    // Auto-assign to on-call engineer
    await this.assignIncident(incidentId, 'on-call-engineer');
    
    console.log(`Thermonuclear Incident Created: ${incident.title} (${incidentId})`);
    
    return incident;
  }

  async assignIncident(incidentId, assignee) {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    incident.assignedTo = assignee;
    incident.timeline.push({
      timestamp: Date.now(),
      event: 'incident_assigned',
      description: `Incident assigned to ${assignee}`,
      user: 'system'
    });

    // Notify assignee
    await this.notifyAssignee(incident, assignee);
    
    return incident;
  }

  // ESCALATION MANAGEMENT
  startEscalationTimer(alert) {
    const policy = this.escalationPolicies.get(alert.escalationPolicy);
    if (!policy) return;

    const scheduleNextEscalation = (level) => {
      if (level >= policy.levels.length) return;

      const escalationLevel = policy.levels[level];
      const timeout = escalationLevel.timeout;

      setTimeout(async () => {
        // Check if alert is still active and not acknowledged
        const activeAlert = this.activeAlerts.get(alert.ruleId);
        if (activeAlert && !activeAlert.acknowledgedBy) {
          await this.escalateAlert(alert, level);
          scheduleNextEscalation(level + 1);
        }
      }, timeout);
    };

    scheduleNextEscalation(0);
  }

  async escalateAlert(alert, level) {
    const policy = this.escalationPolicies.get(alert.escalationPolicy);
    if (!policy || level >= policy.levels.length) return;

    const escalationLevel = policy.levels[level];
    alert.escalationLevel = level;

    console.log(`Thermonuclear Alert Escalation [Level ${level}]: ${alert.name} -> ${escalationLevel.contacts.join(', ')}`);

    // Send escalation notifications
    for (const contact of escalationLevel.contacts) {
      await this.notifyContact(alert, contact, `ESCALATION Level ${level + 1}`);
    }

    // Record escalation in incident if exists
    const incident = Array.from(this.incidents.values()).find(i => i.alertId === alert.id);
    if (incident) {
      incident.escalationLevel = level;
      incident.timeline.push({
        timestamp: Date.now(),
        event: 'alert_escalated',
        description: `Alert escalated to level ${level + 1}: ${escalationLevel.contacts.join(', ')}`,
        user: 'system'
      });
    }
  }

  // ALERT LIFECYCLE MANAGEMENT
  async acknowledgeAlert(alertId, acknowledgedBy) {
    const activeAlert = Array.from(this.activeAlerts.values()).find(a => a.id === alertId);
    if (!activeAlert) return null;

    activeAlert.acknowledgedBy = acknowledgedBy;
    activeAlert.acknowledgedAt = Date.now();

    console.log(`Thermonuclear Alert Acknowledged: ${activeAlert.name} by ${acknowledgedBy}`);

    // Update incident if exists
    const incident = Array.from(this.incidents.values()).find(i => i.alertId === alertId);
    if (incident) {
      incident.timeline.push({
        timestamp: Date.now(),
        event: 'alert_acknowledged',
        description: `Alert acknowledged by ${acknowledgedBy}`,
        user: acknowledgedBy
      });
    }

    return activeAlert;
  }

  async resolveAlert(ruleId, resolvedBy = 'system') {
    const activeAlert = this.activeAlerts.get(ruleId);
    if (!activeAlert) return null;

    activeAlert.status = 'resolved';
    activeAlert.resolvedBy = resolvedBy;
    activeAlert.resolvedAt = Date.now();

    // Remove from active alerts
    this.activeAlerts.delete(ruleId);

    console.log(`Thermonuclear Alert Resolved: ${activeAlert.name} by ${resolvedBy}`);

    // Update incident if exists
    const incident = Array.from(this.incidents.values()).find(i => i.alertId === activeAlert.id);
    if (incident && incident.status === 'open') {
      await this.resolveIncident(incident.id, resolvedBy);
    }

    return activeAlert;
  }

  async resolveIncident(incidentId, resolvedBy) {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    incident.status = 'resolved';
    incident.resolvedAt = Date.now();
    incident.timeline.push({
      timestamp: Date.now(),
      event: 'incident_resolved',
      description: `Incident resolved by ${resolvedBy}`,
      user: resolvedBy
    });

    console.log(`Thermonuclear Incident Resolved: ${incident.title} by ${resolvedBy}`);

    return incident;
  }

  // SUPPRESSION AND MAINTENANCE
  addSuppressionRule(rule) {
    this.suppressionRules.set(rule.id, rule);
  }

  removeSuppressionRule(ruleId) {
    this.suppressionRules.delete(ruleId);
  }

  async enableMaintenanceMode(duration = 3600000) { // 1 hour default
    const maintenanceEnd = Date.now() + duration;
    
    this.addSuppressionRule({
      id: 'maintenance_mode',
      name: 'Maintenance Mode',
      condition: () => Date.now() < maintenanceEnd,
      reason: 'System maintenance in progress'
    });

    console.log(`Thermonuclear Maintenance Mode: Enabled for ${duration/60000} minutes`);
    
    // Auto-disable after duration
    setTimeout(() => {
      this.removeSuppressionRule('maintenance_mode');
      console.log('Thermonuclear Maintenance Mode: Disabled');
    }, duration);
  }

  // UTILITY METHODS
  getSeverityColor(severity) {
    const colors = {
      critical: '#FF0000',
      warning: '#FFA500',
      info: '#0000FF',
      success: '#00FF00'
    };
    return colors[severity] || '#808080';
  }

  getSeverityEmoji(severity) {
    const emojis = {
      critical: '🚨',
      warning: '⚠️',
      info: 'ℹ️',
      success: '✅'
    };
    return emojis[severity] || '📢';
  }

  generateEmailContent(alert) {
    return {
      subject: `🚨 ProtoThrive Alert: ${alert.name} [${alert.severity.toUpperCase()}]`,
      html: `
        <h2>ProtoThrive Alert Notification</h2>
        <h3>${alert.name}</h3>
        <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
        <p><strong>Description:</strong> ${alert.description}</p>
        <p><strong>Environment:</strong> ${alert.context.environment}</p>
        <p><strong>Region:</strong> ${alert.context.region}</p>
        <p><strong>Triggered At:</strong> ${new Date(alert.createdAt).toISOString()}</p>
        
        <h4>Metrics:</h4>
        <pre>${JSON.stringify(alert.metrics, null, 2)}</pre>
        
        <p><a href="${this.env.FRONTEND_URL}/alerts/${alert.id}">View Alert Details</a></p>
        <p><a href="${this.env.FRONTEND_URL}/monitoring">View Monitoring Dashboard</a></p>
      `,
      to: ['alerts@protothrive.com', 'oncall@protothrive.com']
    };
  }

  extractRelevantMetrics(metrics, rule) {
    // Extract only metrics relevant to the alert
    const relevant = {};
    
    if (rule.id.includes('database')) {
      relevant.database = metrics.database;
    }
    if (rule.id.includes('error')) {
      relevant.errorRate = metrics.errorRate;
      relevant.errors = metrics.errors;
    }
    if (rule.id.includes('response_time')) {
      relevant.responseTime = metrics.responseTime;
    }
    if (rule.id.includes('security')) {
      relevant.security = metrics.security;
    }
    if (rule.id.includes('budget')) {
      relevant.costs = metrics.costs;
    }
    
    return relevant;
  }

  isRateLimited(ruleId) {
    const rule = this.alertRules.get(ruleId);
    if (!rule) return false;

    const oneHourAgo = Date.now() - 3600000;
    const recentAlerts = this.alertHistory.filter(
      alert => alert.ruleId === ruleId && alert.createdAt > oneHourAgo
    );

    return recentAlerts.length >= this.config.maxAlertsPerHour;
  }

  async notifyContact(alert, contact, prefix = '') {
    console.log(`Thermonuclear Contact Notification ${prefix}: ${contact} about ${alert.name}`);
    // In production, this would send notifications via configured channels
  }

  async notifyAssignee(incident, assignee) {
    console.log(`Thermonuclear Incident Assignment: ${assignee} assigned to ${incident.title}`);
    // In production, this would send notifications to the assignee
  }

  // REPORTING AND ANALYTICS
  getAlertStats(timeRange = 86400000) { // 24 hours default
    const since = Date.now() - timeRange;
    const recentAlerts = this.alertHistory.filter(alert => alert.createdAt > since);
    
    const stats = {
      total: recentAlerts.length,
      bySeverity: {},
      byRule: {},
      avgResponseTime: 0,
      escalationRate: 0
    };

    recentAlerts.forEach(alert => {
      stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1;
      stats.byRule[alert.ruleId] = (stats.byRule[alert.ruleId] || 0) + 1;
    });

    const acknowledgedAlerts = recentAlerts.filter(a => a.acknowledgedAt);
    if (acknowledgedAlerts.length > 0) {
      stats.avgResponseTime = acknowledgedAlerts.reduce(
        (sum, alert) => sum + (alert.acknowledgedAt - alert.createdAt), 0
      ) / acknowledgedAlerts.length;
    }

    stats.escalationRate = (recentAlerts.filter(a => a.escalationLevel > 0).length / recentAlerts.length) * 100;

    return stats;
  }

  async generateAlertReport() {
    const stats = this.getAlertStats();
    const activeAlertsCount = this.activeAlerts.size;
    const openIncidents = Array.from(this.incidents.values()).filter(i => i.status === 'open');
    
    return {
      timestamp: new Date().toISOString(),
      activeAlerts: activeAlertsCount,
      openIncidents: openIncidents.length,
      last24Hours: stats,
      topAlerts: Object.entries(stats.byRule)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([rule, count]) => ({ rule, count })),
      systemHealth: activeAlertsCount === 0 ? 'healthy' : 
                   activeAlertsCount <= 5 ? 'degraded' : 'critical'
    };
  }
}

console.log('Thermonuclear Alerting System: Enterprise incident response and escalation system loaded');