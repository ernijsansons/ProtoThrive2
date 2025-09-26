// Ref: CLAUDE.md - AI Service Layer
// Migrated from Python ai_endpoints.py to TypeScript
import { createHash } from 'crypto';

export interface RoadmapNode {
  id: string;
  data: {
    label: string;
    type: 'milestone' | 'epic' | 'task';
    status: string;
    estimatedDays: number;
    priority: string;
    tags: string[];
  };
  position: { x: number; y: number; z: number };
}

export interface RoadmapEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  animated?: boolean;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  topRisks: Array<{
    category: string;
    description: string;
    impact: string;
    probability: number;
    mitigation: string;
  }>;
  monteCarloResults: {
    p50: number;
    p80: number;
    p95: number;
    criticalPath: string[];
  };
}

export interface RoadmapResult {
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
  features: string[];
  riskAssessment: RiskAssessment;
  metadata: {
    generatedAt: string;
    model: string;
    projectType: string;
    visionHash: string;
  };
}

export interface ThriveScoreResult {
  thriveScore: number;
  components: {
    completion: number;
    uiPolish: number;
    riskFactor: number;
  };
  predictions: {
    completionDate: {
      optimistic: number;
      realistic: number;
      pessimistic: number;
    };
    velocity: number;
    burndownTrend: 'on-track' | 'at-risk' | 'ahead';
  };
  recommendations: string[];
}

export interface TemplateMatch {
  title: string;
  description: string;
  tags: string[];
  match_score: number;
}

export interface DependencyAnalysis {
  dependencies: Array<{
    source: string;
    target: string;
    type: 'technical' | 'temporal';
    strength: number;
    critical: boolean;
  }>;
  hasCircularDependency: boolean;
  longestPath: number;
  parallelizableGroups: number;
}

export class AIService {
  private nodeTemplates: Record<string, Array<{ label: string; type: 'milestone' | 'epic' | 'task'; estimatedDays: number }>> = {
    web: [
      { label: 'Setup Infrastructure', type: 'milestone', estimatedDays: 3 },
      { label: 'Database Design', type: 'epic', estimatedDays: 5 },
      { label: 'Backend API Development', type: 'epic', estimatedDays: 10 },
      { label: 'Frontend Development', type: 'epic', estimatedDays: 12 },
      { label: 'Authentication System', type: 'task', estimatedDays: 4 },
      { label: 'Testing & QA', type: 'epic', estimatedDays: 5 },
      { label: 'Deployment', type: 'milestone', estimatedDays: 2 }
    ],
    mobile: [
      { label: 'Project Setup', type: 'milestone', estimatedDays: 2 },
      { label: 'UI/UX Design', type: 'epic', estimatedDays: 8 },
      { label: 'Core Features', type: 'epic', estimatedDays: 15 },
      { label: 'Backend Integration', type: 'epic', estimatedDays: 7 },
      { label: 'Push Notifications', type: 'task', estimatedDays: 3 },
      { label: 'App Store Submission', type: 'milestone', estimatedDays: 2 }
    ],
    api: [
      { label: 'API Architecture', type: 'milestone', estimatedDays: 3 },
      { label: 'Database Schema', type: 'epic', estimatedDays: 4 },
      { label: 'Core Endpoints', type: 'epic', estimatedDays: 8 },
      { label: 'Authentication', type: 'task', estimatedDays: 3 },
      { label: 'Rate Limiting', type: 'task', estimatedDays: 2 },
      { label: 'Documentation', type: 'epic', estimatedDays: 3 }
    ],
    ai: [
      { label: 'Data Collection', type: 'milestone', estimatedDays: 5 },
      { label: 'Model Research', type: 'epic', estimatedDays: 7 },
      { label: 'Training Pipeline', type: 'epic', estimatedDays: 10 },
      { label: 'Model Deployment', type: 'epic', estimatedDays: 5 },
      { label: 'API Integration', type: 'task', estimatedDays: 4 },
      { label: 'Performance Monitoring', type: 'task', estimatedDays: 3 }
    ]
  };

  /**
   * Generate AI-powered roadmap from vision text
   */
  async generateRoadmap(visionText: string, projectType: string = 'web'): Promise<RoadmapResult> {
    console.log('Thermonuclear: Generating AI roadmap');

    // Generate deterministic hash for consistent results
    const visionHash = createHash('md5').update(visionText).digest('hex').substring(0, 8);

    // Get node templates based on project type
    const templates = this.nodeTemplates[projectType] || this.nodeTemplates.web;

    // Generate nodes with positions for 3D layout
    const nodes: RoadmapNode[] = templates.map((template, i) => ({
      id: `node_${visionHash}_${i}`,
      data: {
        label: template.label,
        type: template.type,
        status: 'pending',
        estimatedDays: template.estimatedDays,
        priority: template.type === 'milestone' ? 'high' : 'medium',
        tags: [projectType, 'ai-generated']
      },
      position: {
        x: (i % 3) * 250,
        y: Math.floor(i / 3) * 200,
        z: 0
      }
    }));

    // Generate edges (sequential flow + some parallel paths)
    const edges: RoadmapEdge[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        id: `edge_${visionHash}_${i}`,
        source: nodes[i].id,
        target: nodes[i + 1].id,
        type: 'smoothstep',
        animated: nodes[i].data.type === 'milestone'
      });
    }

    // Extract features from vision text
    const features = this.extractFeatures(visionText);

    // Assess risk level
    const riskLevel = this.assessRisk(visionText, features);

    // Generate Monte Carlo simulation results
    const totalDays = nodes.reduce((sum, n) => sum + n.data.estimatedDays, 0);
    const riskAssessment: RiskAssessment = {
      overallRisk: riskLevel,
      topRisks: this.generateRisks(riskLevel),
      monteCarloResults: {
        p50: totalDays,
        p80: Math.floor(totalDays * 1.3),
        p95: Math.floor(totalDays * 1.6),
        criticalPath: nodes
          .filter(n => ['milestone', 'epic'].includes(n.data.type))
          .map(n => n.id)
      }
    };

    return {
      nodes,
      edges,
      features,
      riskAssessment,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'mock-ai-dev',
        projectType,
        visionHash
      }
    };
  }

  /**
   * Analyze dependencies between roadmap nodes
   */
  async analyzeDependencies(nodes: RoadmapNode[], edges: RoadmapEdge[]): Promise<DependencyAnalysis> {
    console.log(`Thermonuclear: Analyzing dependencies for ${nodes.length} nodes`);

    const dependencies = edges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);

      return {
        source: edge.source,
        target: edge.target,
        type: (sourceNode?.data.label.toLowerCase().includes('api') ? 'technical' : 'temporal') as 'technical' | 'temporal',
        strength: sourceNode?.data.type === 'milestone' ? 0.8 : 0.6,
        critical: sourceNode?.data.priority === 'high'
      };
    });

    return {
      dependencies,
      hasCircularDependency: false, // Simple implementation - would need graph traversal for real detection
      longestPath: Math.min(5, nodes.length),
      parallelizableGroups: Math.max(1, Math.floor(nodes.length / 3))
    };
  }

  /**
   * Get template suggestions based on partial vision
   */
  async getTemplateSuggestions(partialVision: string): Promise<TemplateMatch[]> {
    const templates: TemplateMatch[] = [
      {
        title: 'E-commerce Platform',
        description: 'Build a full-featured online store with payment processing',
        tags: ['web', 'payments', 'inventory'],
        match_score: this.calculateMatchScore(partialVision, ['shop', 'store', 'commerce', 'buy', 'sell'])
      },
      {
        title: 'Social Media App',
        description: 'Create a social networking platform with real-time features',
        tags: ['mobile', 'real-time', 'messaging'],
        match_score: this.calculateMatchScore(partialVision, ['social', 'chat', 'message', 'network', 'friend'])
      },
      {
        title: 'SaaS Dashboard',
        description: 'Build a B2B software platform with analytics and reporting',
        tags: ['web', 'analytics', 'enterprise'],
        match_score: this.calculateMatchScore(partialVision, ['dashboard', 'analytics', 'report', 'business', 'saas'])
      },
      {
        title: 'AI-Powered Tool',
        description: 'Develop an AI/ML application with model training pipeline',
        tags: ['ai', 'api', 'data-processing'],
        match_score: this.calculateMatchScore(partialVision, ['ai', 'machine learning', 'ml', 'predict', 'model'])
      }
    ];

    // Sort by match score and return top 3
    return templates
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 3);
  }

  /**
   * Calculate advanced Thrive Score with predictive analytics
   */
  async calculateThriveScore(
    nodes: RoadmapNode[],
    edges: RoadmapEdge[],
    completedTasks: number = 0
  ): Promise<ThriveScoreResult> {
    const totalTasks = nodes.length;

    // Calculate score components
    const completion = totalTasks > 0 ? completedTasks / totalTasks : 0;

    // UI Polish score (based on UI-related nodes)
    const uiNodes = nodes.filter(n =>
      n.data.label.toLowerCase().includes('ui') ||
      n.data.label.toLowerCase().includes('frontend') ||
      n.data.label.toLowerCase().includes('design')
    );
    const uiPolish = totalTasks > 0 ? uiNodes.length / totalTasks : 0.5;

    // Risk factor (based on dependency complexity)
    const dependencyComplexity = totalTasks > 0 ?
      Math.min(1.0, edges.length / (totalTasks * 2)) : 0.5;
    const riskFactor = 1 - dependencyComplexity;

    // Calculate final Thrive Score using CLAUDE.md formula
    const thriveScore = (completion * 0.5) + (uiPolish * 0.3) + (riskFactor * 0.2);

    // Predictive analytics
    const remainingNodes = nodes.filter(n => n.data.status !== 'completed');
    const daysRemaining = remainingNodes.reduce((sum, n) => sum + n.data.estimatedDays, 0);
    const velocity = totalTasks > 0 ? completedTasks / Math.max(1, totalTasks - completedTasks) : 0;

    const predictions = {
      completionDate: {
        optimistic: Math.floor(daysRemaining * 0.8),
        realistic: daysRemaining,
        pessimistic: Math.floor(daysRemaining * 1.5)
      },
      velocity,
      burndownTrend: velocity > 0.3 ? 'on-track' as const :
                     velocity > 0.1 ? 'at-risk' as const : 'ahead' as const
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(completion, uiPolish, dependencyComplexity);

    console.log(`Thermonuclear Thrive Score: ${thriveScore.toFixed(2)} - Status: ${thriveScore > 0.5 ? 'neon' : 'gray'}`);

    return {
      thriveScore,
      components: {
        completion,
        uiPolish,
        riskFactor
      },
      predictions,
      recommendations
    };
  }

  private extractFeatures(visionText: string): string[] {
    const keywords = [
      'authentication', 'payment', 'real-time', 'dashboard', 'analytics',
      'api', 'database', 'cloud', 'mobile', 'responsive', 'security',
      'ai', 'machine learning', 'notifications', 'chat', 'search'
    ];

    const found = keywords
      .filter(keyword => visionText.toLowerCase().includes(keyword))
      .map(keyword => keyword.charAt(0).toUpperCase() + keyword.slice(1));

    // Return found features or defaults
    return found.length > 0 ? found : ['User Management', 'Data Storage', 'API Integration'];
  }

  private assessRisk(visionText: string, features: string[]): 'low' | 'medium' | 'high' {
    const riskKeywords = ['complex', 'advanced', 'enterprise', 'scale', 'distributed'];
    const hasRiskKeywords = riskKeywords.some(keyword =>
      visionText.toLowerCase().includes(keyword)
    );

    if (hasRiskKeywords) return 'high';
    if (features.length > 5) return 'medium';
    return 'low';
  }

  private generateRisks(level: 'low' | 'medium' | 'high') {
    const baseProbability = level === 'low' ? 30 : level === 'medium' ? 45 : 60;

    return [
      {
        category: 'technical',
        description: 'Integration complexity with third-party services',
        impact: 'high',
        probability: baseProbability,
        mitigation: 'Use well-documented APIs and add buffer time'
      },
      {
        category: 'resource',
        description: 'Team availability during critical phases',
        impact: 'medium',
        probability: Math.floor(baseProbability * 0.8),
        mitigation: 'Cross-train team members and maintain documentation'
      }
    ];
  }

  private calculateMatchScore(vision: string, keywords: string[]): number {
    const visionLower = vision.toLowerCase();
    const matches = keywords.filter(keyword => visionLower.includes(keyword)).length;
    const maxScore = 0.9;
    const minScore = 0.2;

    return matches > 0 ?
      Math.min(maxScore, minScore + (matches / keywords.length) * (maxScore - minScore)) :
      minScore;
  }

  private generateRecommendations(
    completion: number,
    uiPolish: number,
    dependencyComplexity: number
  ): string[] {
    const recommendations: string[] = [];

    if (completion < 0.3) {
      recommendations.push('Focus on high-priority milestones to improve completion rate');
    }

    if (uiPolish < 0.4) {
      recommendations.push('Improve UI polish for better user experience');
    }

    if (dependencyComplexity > 0.7) {
      recommendations.push('Reduce dependencies to lower project risk');
    }

    if (completion > 0.7 && uiPolish > 0.6) {
      recommendations.push('Project is on track - consider advanced features');
    }

    return recommendations.filter(Boolean);
  }
}