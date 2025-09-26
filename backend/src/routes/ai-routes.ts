// Ref: CLAUDE.md - AI Routes
// Migrated Python AI endpoints to TypeScript with Hono integration
import { Hono } from 'hono';
import { z } from 'zod';
import { AIService } from '../services/ai-service';
import { AgentCoordinator, AgentExecutionError } from '../services/agent-coordinator';
import type { AuthUser } from '../middleware/auth';
import { requirePermission, getResourceLimitsByRole, UserRole } from '../middleware/auth';

type Variables = {
  user: AuthUser;
  db: any;
}

const app = new Hono<{ Variables: Variables }>();

// Initialize services
const aiService = new AIService();
let agentCoordinator: AgentCoordinator;

// Validation schemas
const generateRoadmapSchema = z.object({
  vision: z.string().min(1, 'Vision text is required').max(5000, 'Vision text too long (max 5000 chars)'),
  projectType: z.enum(['web', 'mobile', 'api', 'ai']).optional().default('web')
});

const analyzeDependenciesSchema = z.object({
  nodes: z.array(z.any()).min(1, 'Nodes are required'),
  edges: z.array(z.any()).optional().default([])
});

const calculateThriveScoreSchema = z.object({
  nodes: z.array(z.any()).optional().default([]),
  edges: z.array(z.any()).optional().default([]),
  completedTasks: z.number().min(0).optional().default(0)
});

const runAgentSchema = z.object({
  task: z.string().min(1, 'Task is required'),
  context: z.record(z.any()).optional().default({}),
  budget: z.number().min(0).max(1).optional(),
  mode: z.enum(['single', 'fallback', 'ensemble']).optional().default('single'),
  roadmap_id: z.string().optional()
});

// Initialize agent coordinator with environment
app.use('*', async (c, next) => {
  if (!agentCoordinator) {
    const env = c.env as Record<string, string> || {};
    agentCoordinator = new AgentCoordinator({
      AGENT_MODE: env.AGENT_MODE || 'single',
      AGENT_BUDGET_DEFAULT: env.AGENT_BUDGET_DEFAULT || '0.40',
      AGENT_BUDGET_MAX: env.AGENT_BUDGET_MAX || '1.00',
      AGENT_CONFIDENCE_THRESHOLD: env.AGENT_CONFIDENCE_THRESHOLD || '0.8',
      ENTERPRISE_AGENT_URL: env.ENTERPRISE_AGENT_URL,
      ENTERPRISE_AGENT_TOKEN: env.ENTERPRISE_AGENT_TOKEN
    });
  }
  await next();
});

// POST /api/ai/generate-roadmap
app.post('/generate-roadmap', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    console.log(`Thermonuclear AI: ${user.role} user ${user.id} generating roadmap`);

    // Validate request body
    const validated = generateRoadmapSchema.parse(body);

    // Check if user has access to AI features
    const userLimits = getResourceLimitsByRole(user.role);
    if (!userLimits.premium_features && validated.projectType !== 'web') {
      return c.json({
        error: 'Advanced project types require premium features',
        code: 'BIZ-AI-PREMIUM-REQUIRED',
        message: `Project type '${validated.projectType}' requires premium features. Your '${user.role}' plan only supports basic web projects.`,
        available_types: user.role === UserRole.USER || user.role === UserRole.CODER ? ['web'] : ['web', 'mobile', 'api', 'ai']
      }, 403);
    }

    // Generate roadmap using AI service
    const roadmap = await aiService.generateRoadmap(validated.vision, validated.projectType);

    console.log(`Thermonuclear Success: Generated roadmap with ${roadmap.nodes.length} nodes for ${validated.projectType} project`);

    return c.json({
      success: true,
      data: roadmap,
      user_access: {
        role: user.role,
        premium_features: userLimits.premium_features
      }
    });

  } catch (error) {
    console.error('Thermonuclear Error: Failed to generate roadmap -', error);

    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation failed',
        code: 'VAL-400',
        details: error.errors
      }, 400);
    }

    return c.json({
      error: 'Failed to generate roadmap',
      code: 'ERR-AI-ROADMAP',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/ai/analyze-dependencies
app.post('/analyze-dependencies', async (c) => {
  try {
    const body = await c.req.json();
    const validated = analyzeDependenciesSchema.parse(body);

    // Analyze dependencies
    const analysis = await aiService.analyzeDependencies(validated.nodes, validated.edges);

    return c.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Thermonuclear Error: Failed to analyze dependencies -', error);

    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation failed',
        code: 'VAL-400',
        details: error.errors
      }, 400);
    }

    return c.json({
      error: 'Failed to analyze dependencies',
      code: 'ERR-AI-DEPENDENCIES',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/ai/template-suggestions
app.get('/template-suggestions', async (c) => {
  try {
    const partialVision = c.req.query('q') || '';

    // Get template suggestions
    const suggestions = await aiService.getTemplateSuggestions(partialVision);

    return c.json({
      success: true,
      data: suggestions,
      query: partialVision
    });

  } catch (error) {
    console.error('Thermonuclear Error: Failed to get template suggestions -', error);

    return c.json({
      error: 'Failed to get template suggestions',
      code: 'ERR-AI-TEMPLATES',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/ai/calculate-thrive-score
app.post('/calculate-thrive-score', async (c) => {
  try {
    const body = await c.req.json();
    const validated = calculateThriveScoreSchema.parse(body);

    // Calculate Thrive Score with predictive analytics
    const result = await aiService.calculateThriveScore(
      validated.nodes,
      validated.edges,
      validated.completedTasks
    );

    return c.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Thermonuclear Error: Failed to calculate Thrive Score -', error);

    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation failed',
        code: 'VAL-400',
        details: error.errors
      }, 400);
    }

    return c.json({
      error: 'Failed to calculate Thrive Score',
      code: 'ERR-AI-THRIVE',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/ai/agent/run - Agent orchestration endpoint
app.post('/agent/run', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    console.log(`Thermonuclear AI Agent: ${user.role} user ${user.id} running analysis`);

    // Validate request body
    const validated = runAgentSchema.parse(body);

    // Check if user has access to AI features
    const userLimits = getResourceLimitsByRole(user.role);
    if (!userLimits.premium_features && validated.mode !== 'single') {
      return c.json({
        error: 'Advanced AI features require premium plan',
        code: 'BIZ-AI-PREMIUM-REQUIRED',
        message: `Advanced AI mode '${validated.mode}' requires premium features. Your '${user.role}' plan includes basic AI only.`,
        available_modes: user.role === UserRole.USER || user.role === UserRole.CODER ? ['single'] : ['single', 'fallback', 'ensemble'],
        upgrade_info: {
          engineer: 'Full AI agent access with advanced prompts',
          manager: 'Enhanced AI with team management features',
          admin: 'Enterprise AI with custom model selection and unlimited usage'
        }
      }, 403);
    }

    // Run agent coordination
    const result = await agentCoordinator.runTask(
      validated.task,
      validated.context,
      validated.budget,
      validated.mode
    );

    // Log the AI operation if roadmap_id is provided
    if (validated.roadmap_id) {
      console.log(`Thermonuclear AI: Logged analysis for roadmap ${validated.roadmap_id}`);
      // In real implementation, would log to agent_logs table
    }

    return c.json({
      success: true,
      agent_report: {
        agent: result.result.agent,
        confidence: result.result.confidence,
        cost: {
          estimate: result.result.costEstimate,
          actual: result.result.costActual,
          consumed: result.budgetConsumed,
          remaining: result.budgetRemaining
        },
        fallback_used: result.fallbackUsed,
        trace: result.trace.map(r => ({
          agent: r.agent,
          success: r.success,
          confidence: r.confidence,
          cost: r.costActual,
          task: validated.task
        })),
        analysis_results: {
          task_completed: result.result.success,
          output: result.result.output,
          validation: result.result.validation,
          business_insights: `Analysis completed by ${result.result.agent} agent with ${(result.result.confidence * 100).toFixed(1)}% confidence`
        }
      },
      user_access: {
        role: user.role,
        premium_features: userLimits.premium_features,
        remaining_budget: result.budgetRemaining
      },
      business_rule: 'AI feature access based on user role and plan limits'
    });

  } catch (error) {
    console.error('Thermonuclear Error: AI agent execution failed -', error);

    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation failed',
        code: 'VAL-400',
        details: error.errors
      }, 400);
    }

    if (error instanceof AgentExecutionError) {
      return c.json({
        error: error.message,
        code: error.code,
        metadata: error.metadata
      }, error.status as any);
    }

    return c.json({
      error: 'Agent execution failed',
      code: 'ERR-AI-AGENT',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/ai/phase/complete - Enterprise Agent bridge for phase completion
app.post('/phase/complete', requirePermission(['admin:execute']), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    console.log(`Thermonuclear Phase Completion: ${user.role} user ${user.id} completing phase`);

    const phase = body.phase;
    const validPhases = ['backend', 'frontend', 'ai_core', 'workflows', 'security'];

    if (!phase || !validPhases.includes(phase)) {
      return c.json({
        error: 'Invalid phase specified',
        code: 'VAL-400',
        valid_phases: validPhases
      }, 400);
    }

    // Mock phase completion using agent coordination
    const result = await agentCoordinator.runTask(
      `Complete ProtoThrive ${phase} phase according to CLAUDE.md specifications`,
      {
        phase,
        project: 'ProtoThrive',
        version: '2.0.0',
        mode: 'thermonuclear'
      },
      0.5, // Higher budget for phase completion
      'ensemble' // Use ensemble mode for comprehensive completion
    );

    // Calculate completion score (mock Thrive Score calculation)
    const logs = [
      { status: result.result.success ? 'success' : 'fail', type: phase }
    ];

    const thriveScore = result.result.success ? 0.85 : 0.35;
    const complete = thriveScore > 0.8;

    return c.json({
      success: true,
      phase,
      result: {
        phase,
        logs,
        code_generated: result.result.output,
        validation: result.result.validation
      },
      thrive_score: thriveScore,
      complete,
      agent_report: {
        confidence: result.result.confidence,
        cost_consumed: result.budgetConsumed,
        fallback_used: result.fallbackUsed
      },
      business_rule: 'Phase completion requires admin permissions'
    });

  } catch (error) {
    console.error('Thermonuclear Error: Phase completion failed -', error);

    if (error instanceof AgentExecutionError) {
      return c.json({
        error: error.message,
        code: error.code,
        metadata: error.metadata
      }, error.status as any);
    }

    return c.json({
      error: 'Phase completion failed',
      code: 'ERR-PHASE-COMPLETION',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;