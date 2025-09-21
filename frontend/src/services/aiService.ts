// Ref: CLAUDE.md - Real AI service for contextual feedback generation
import { AIFeedback } from '../components/AIFeedbackEngine';

export interface AIAnalysisContext {
  projectStructure: {
    nodeCount: number;
    edgeCount: number;
    nodes: Array<{id: string; type?: string; label?: string; position?: any}>;
    edges: Array<{from: string; to: string; type?: string}>;
  };
  performance: {
    thriveScore: number;
    loadTime?: number;
    memoryUsage?: number;
  };
  userBehavior: {
    sessionDuration: number;
    activity: 'idle' | 'active' | 'focused';
    interactionCount: number;
    lastAction?: string;
  };
  environment: {
    canvasMode: '2d' | '3d';
    activeTab: string;
    screenSize?: string;
  };
}

export interface AIServiceConfig {
  apiKey?: string;
  model: 'gpt-4o-mini' | 'claude-3-haiku' | 'mock';
  maxTokens: number;
  temperature: number;
  enableRealtime: boolean;
  costBudget: number; // USD per session
}

export interface AIPromptTemplate {
  system: string;
  user: string;
  responseFormat: any;
}

class AIService {
  private static instance: AIService | null = null;
  private config: AIServiceConfig;
  private sessionCost = 0;
  private rateLimitReset = 0;
  private requestCount = 0;

  private constructor(config: Partial<AIServiceConfig> = {}) {
    const enableAI = process.env.NEXT_PUBLIC_ENABLE_AI === 'true';
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

    this.config = {
      apiKey: apiKey || 'mock',
      model: enableAI && apiKey && apiKey !== 'sk-proj-mock-for-dev' ? 'gpt-4o-mini' : 'mock',
      maxTokens: 500,
      temperature: 0.7,
      enableRealtime: enableAI,
      costBudget: 0.50,
      ...config
    };
  }

  static getInstance(config?: Partial<AIServiceConfig>): AIService {
    if (!this.instance) {
      this.instance = new AIService(config);
    }
    return this.instance;
  }

  private getPromptTemplate(): AIPromptTemplate {
    return {
      system: `You are ProtoThrive's AI assistant, an expert in software architecture, UX design, and project optimization.

Your role is to analyze project state and provide contextual, actionable feedback to help users improve their prototypes.

Context Analysis Guidelines:
- Empty projects: Suggest starting points, templates, or first steps
- Disconnected components: Recommend architectural patterns and connections
- Performance issues: Identify bottlenecks and optimization opportunities
- User behavior: Adapt suggestions based on activity patterns and session data
- Accessibility: Proactively suggest improvements for inclusive design

Response Requirements:
- Be concise but specific (50-150 words per feedback item)
- Provide actionable recommendations, not just observations
- Use encouraging, supportive tone while being technically accurate
- Prioritize feedback based on impact and urgency
- Include confidence scores based on available data quality

Respond with 1-3 feedback items maximum per analysis.`,

      user: `Analyze this project state and provide contextual feedback:

Project Structure:
- Nodes: {nodeCount} components
- Connections: {edgeCount} relationships
- Architecture: {architectureDescription}

Performance Metrics:
- Thrive Score: {thriveScore}%
- Session Duration: {sessionDuration}
- User Activity: {userActivity}

Current Context:
- Mode: {canvasMode}
- Active Tab: {activeTab}
- Last Action: {lastAction}

Please provide specific, actionable feedback to help improve this prototype.`,

      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "feedback_analysis",
          schema: {
            type: "object",
            properties: {
              feedback: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                      enum: ["suggestion", "warning", "success", "info", "optimization", "insight"]
                    },
                    title: { type: "string", maxLength: 60 },
                    message: { type: "string", maxLength: 200 },
                    context: { type: "string", maxLength: 100 },
                    priority: {
                      type: "string",
                      enum: ["low", "medium", "high", "critical"]
                    },
                    category: {
                      type: "string",
                      enum: ["design", "performance", "usability", "accessibility", "best_practice"]
                    },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    actionLabel: { type: "string", maxLength: 30 }
                  },
                  required: ["type", "title", "message", "context", "priority", "category", "confidence"]
                }
              },
              reasoning: { type: "string", maxLength: 150 }
            },
            required: ["feedback", "reasoning"]
          }
        }
      }
    };
  }

  private buildAnalysisPrompt(context: AIAnalysisContext): string {
    const template = this.getPromptTemplate();

    // Analyze architecture patterns
    const architectureDescription = this.analyzeArchitecture(context.projectStructure);

    return template.user
      .replace('{nodeCount}', context.projectStructure.nodeCount.toString())
      .replace('{edgeCount}', context.projectStructure.edgeCount.toString())
      .replace('{architectureDescription}', architectureDescription)
      .replace('{thriveScore}', Math.round(context.performance.thriveScore * 100).toString())
      .replace('{sessionDuration}', this.formatDuration(context.userBehavior.sessionDuration))
      .replace('{userActivity}', context.userBehavior.activity)
      .replace('{canvasMode}', context.environment.canvasMode.toUpperCase())
      .replace('{activeTab}', context.environment.activeTab)
      .replace('{lastAction}', context.userBehavior.lastAction || 'none');
  }

  private analyzeArchitecture(structure: AIAnalysisContext['projectStructure']): string {
    const { nodeCount, edgeCount, nodes } = structure;

    if (nodeCount === 0) return "Empty canvas - no components defined";
    if (nodeCount === 1) return "Single component - monolithic structure";
    if (edgeCount === 0) return "Isolated components - no relationships defined";

    const connectivity = edgeCount / Math.max(1, nodeCount - 1);

    if (connectivity < 0.5) return "Sparse connectivity - loosely coupled architecture";
    if (connectivity > 1.5) return "Dense connectivity - tightly coupled architecture";

    return "Balanced connectivity - moderate coupling";
  }

  private formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return "< 1 minute";
    if (minutes < 60) return `${minutes} minutes`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }

  private async callOpenAI(prompt: string, systemPrompt: string): Promise<any> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        response_format: this.getPromptTemplate().responseFormat
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // Track costs (approximate)
    const estimatedCost = (data.usage?.total_tokens || 100) * 0.00015; // $0.15 per 1K tokens for GPT-4o-mini
    this.sessionCost += estimatedCost;

    return data;
  }

  private generateMockFeedback(context: AIAnalysisContext): AIFeedback[] {
    const feedback: AIFeedback[] = [];
    const { projectStructure, performance, userBehavior } = context;

    // Mock AI analysis based on context
    if (projectStructure.nodeCount === 0) {
      feedback.push({
        id: `ai_empty_${Date.now()}`,
        type: 'suggestion',
        title: 'Ready to Start Building?',
        message: 'I can help you choose the right components for your project. What kind of prototype are you building?',
        context: 'AI Analysis: Empty canvas detected',
        priority: 'high',
        category: 'design',
        confidence: 0.92,
        timestamp: new Date(),
        dismissible: true
      });
    } else if (projectStructure.nodeCount > 1 && projectStructure.edgeCount === 0) {
      feedback.push({
        id: `ai_disconnected_${Date.now()}`,
        type: 'warning',
        title: 'Components Need Integration',
        message: 'I notice you have isolated components. Would you like me to suggest connection patterns for your architecture?',
        context: 'AI Analysis: Disconnected components',
        priority: 'medium',
        category: 'design',
        confidence: 0.87,
        timestamp: new Date(),
        dismissible: true
      });
    } else if (performance.thriveScore < 0.6 && projectStructure.nodeCount > 2) {
      feedback.push({
        id: `ai_performance_${Date.now()}`,
        type: 'optimization',
        title: 'Performance Optimization Available',
        message: 'I can analyze your architecture for performance bottlenecks and suggest improvements.',
        context: 'AI Analysis: Performance concern',
        priority: 'high',
        category: 'performance',
        confidence: 0.83,
        timestamp: new Date(),
        dismissible: true
      });
    } else {
      // Always provide at least one piece of feedback
      feedback.push({
        id: `ai_general_${Date.now()}`,
        type: 'info',
        title: 'AI Assistant Available',
        message: 'I\'m here to help you improve your project. Keep building and I\'ll provide contextual suggestions.',
        context: 'AI Analysis: General guidance',
        priority: 'low',
        category: 'best_practice',
        confidence: 0.75,
        timestamp: new Date(),
        dismissible: true
      });
    }

    return feedback;
  }

  async generateFeedback(context: AIAnalysisContext): Promise<AIFeedback[]> {
    // Rate limiting check
    if (this.requestCount >= 10 && Date.now() < this.rateLimitReset) {
      console.warn('AI Service: Rate limit reached, using fallback');
      return this.generateMockFeedback(context);
    }

    // Budget check
    if (this.sessionCost >= this.config.costBudget) {
      console.warn('AI Service: Budget exceeded, switching to mock mode');
      return this.generateMockFeedback(context);
    }

    // Use mock in development or when API key is not available
    if (this.config.model === 'mock' || !this.config.apiKey || this.config.apiKey === 'mock') {
      return this.generateMockFeedback(context);
    }

    try {
      this.requestCount++;
      const template = this.getPromptTemplate();
      const prompt = this.buildAnalysisPrompt(context);

      console.log('AI Service: Generating real feedback via OpenAI...');

      const response = await this.callOpenAI(prompt, template.system);
      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response from AI service');
      }

      const parsedResponse = JSON.parse(content);

      // Convert AI response to AIFeedback format
      const feedback: AIFeedback[] = parsedResponse.feedback.map((item: any, index: number) => ({
        id: `ai_real_${Date.now()}_${index}`,
        type: item.type,
        title: item.title,
        message: item.message,
        context: `AI Analysis: ${item.context}`,
        priority: item.priority,
        category: item.category,
        confidence: item.confidence,
        timestamp: new Date(),
        dismissible: true,
        action: item.actionLabel ? {
          label: item.actionLabel,
          callback: () => {
            console.log(`AI suggested action: ${item.actionLabel}`);
          }
        } : undefined
      }));

      console.log(`AI Service: Generated ${feedback.length} real feedback items`);
      return feedback;

    } catch (error) {
      console.error('AI Service error, falling back to mock:', error);
      return this.generateMockFeedback(context);
    } finally {
      // Reset rate limit every minute
      if (this.requestCount === 1) {
        this.rateLimitReset = Date.now() + 60000;
      }
    }
  }

  async analyzePredictiveInsights(context: AIAnalysisContext): Promise<{
    timeline: Array<{task: string; estimatedDays: number; confidence: number}>;
    risks: Array<{risk: string; probability: number; impact: string}>;
    opportunities: Array<{opportunity: string; effort: string; impact: string}>;
  }> {
    // Mock implementation for now - could be enhanced with real AI
    const timeline = [
      { task: 'Complete core architecture', estimatedDays: 3, confidence: 0.85 },
      { task: 'Implement user interface', estimatedDays: 5, confidence: 0.78 },
      { task: 'Performance optimization', estimatedDays: 2, confidence: 0.82 }
    ];

    const risks = [
      { risk: 'Scalability bottleneck', probability: 0.3, impact: 'High' },
      { risk: 'User experience issues', probability: 0.2, impact: 'Medium' }
    ];

    const opportunities = [
      { opportunity: 'AI-powered features', effort: 'Medium', impact: 'High' },
      { opportunity: 'Mobile optimization', effort: 'Low', impact: 'Medium' }
    ];

    return { timeline, risks, opportunities };
  }

  getSessionMetrics() {
    return {
      cost: this.sessionCost,
      requestCount: this.requestCount,
      budget: this.config.costBudget,
      budgetRemaining: this.config.costBudget - this.sessionCost
    };
  }

  resetSession() {
    this.sessionCost = 0;
    this.requestCount = 0;
    this.rateLimitReset = 0;
  }

  updateConfig(newConfig: Partial<AIServiceConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const aiService = AIService.getInstance();

// Convenience functions
export const generateAIFeedback = (context: AIAnalysisContext) => {
  return aiService.generateFeedback(context);
};

export const getAIInsights = (context: AIAnalysisContext) => {
  return aiService.analyzePredictiveInsights(context);
};

export const getAIMetrics = () => {
  return aiService.getSessionMetrics();
};