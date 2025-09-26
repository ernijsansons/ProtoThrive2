/**
 * Roadmap Routes with Service Integration
 * Ref: CLAUDE.md - Backend routes using dependency injection
 */

import {
  IBudgetService,
  IKillSwitchService,
  IAIExecutor,
  IMonitoringService,
  IServiceContainer,
  SERVICE_TOKENS,
} from '../services/interfaces';

export class RoadmapRoutes {
  private budgetService: IBudgetService;
  private killSwitchService: IKillSwitchService;
  private aiExecutor: IAIExecutor;
  private monitoringService: IMonitoringService;
  private db: any;

  constructor(private container: IServiceContainer, private env: any) {
    this.budgetService = container.resolve<IBudgetService>(SERVICE_TOKENS.BUDGET);
    this.killSwitchService = container.resolve<IKillSwitchService>(SERVICE_TOKENS.KILL_SWITCH);
    this.aiExecutor = container.resolve<IAIExecutor>(SERVICE_TOKENS.AI_EXECUTOR);
    this.monitoringService = container.resolve<IMonitoringService>(SERVICE_TOKENS.MONITORING);
    this.db = container.resolve(SERVICE_TOKENS.DATABASE);
  }

  async createRoadmap(request: Request, userId: string): Promise<Response> {
    const trace = this.monitoringService.startTrace('create_roadmap');

    try {
      // Check kill switch
      const killStatus = await this.killSwitchService.checkStatus();
      if (killStatus.active) {
        trace.recordEvent('kill_switch_active', { reason: killStatus.reason });
        return new Response(JSON.stringify({
          error: 'System temporarily unavailable',
          reason: killStatus.reason,
          code: 'SYSTEM_PAUSED'
        }), { status: 503 });
      }

      trace.recordEvent('kill_switch_check', { active: false });

      // Parse request body
      const body = await request.json();
      trace.addMetadata({ roadmapSize: JSON.stringify(body).length });

      // Check budget for AI processing
      const estimatedCost = this.estimateRoadmapCost(body);
      const budgetCheck = await this.budgetService.checkBudget(estimatedCost, userId);

      trace.recordEvent('budget_check', {
        allowed: budgetCheck.allowed,
        cost: estimatedCost,
        remaining: budgetCheck.remainingBudget
      });

      if (!budgetCheck.allowed) {
        await this.monitoringService.recordMetric({
          name: 'roadmap.budget_exceeded',
          value: 1,
          type: 'counter',
          tags: { userId, cost: estimatedCost.toString() }
        });

        return new Response(JSON.stringify({
          error: 'Budget limit exceeded',
          details: budgetCheck,
          code: 'BUDGET_EXCEEDED'
        }), { status: 402 });
      }

      // Validate roadmap structure
      const validation = this.validateRoadmapData(body);
      if (!validation.valid) {
        return new Response(JSON.stringify({
          error: 'Invalid roadmap data',
          details: validation.errors,
          code: 'VALIDATION_ERROR'
        }), { status: 400 });
      }

      // Create roadmap record
      const roadmapId = crypto.randomUUID();

      await this.db.prepare(`
        INSERT INTO roadmaps (
          id, user_id, json_graph, status, vibe_mode, thrive_score, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        roadmapId,
        userId,
        JSON.stringify(body.json_graph || {}),
        body.status || 'draft',
        body.vibe_mode ? 1 : 0,
        0.0
      ).run();

      trace.recordEvent('roadmap_created', { roadmapId });

      // If AI processing is requested, queue it
      if (body.enableAI && body.json_graph) {
        const aiTask = {
          id: `roadmap-${roadmapId}-analysis`,
          type: 'analysis' as const,
          prompt: `Analyze and enhance this roadmap: ${JSON.stringify(body.json_graph)}`,
          context: {
            roadmapId,
            userId,
            vibeMode: body.vibe_mode
          }
        };

        // Execute AI task asynchronously
        this.aiExecutor.execute(aiTask, {
          timeout: 30000,
          costLimit: budgetCheck.remainingBudget,
          callback: (progress) => {
            console.log(`Roadmap ${roadmapId} AI progress:`, progress);
          }
        }).then(async (result) => {
          // Record actual cost
          await this.budgetService.recordCost(result.cost, userId, {
            taskType: 'roadmap_analysis',
            model: result.model,
            tokenCount: result.tokenCount
          });

          // Update roadmap with AI enhancements
          if (result.status === 'success' && result.output) {
            await this.updateRoadmapWithAI(roadmapId, result.output);
          }
        }).catch(async (error) => {
          await this.monitoringService.recordError(error, {
            userId,
            taskId: aiTask.id,
            endpoint: 'create_roadmap'
          });
        });

        trace.recordEvent('ai_task_queued', { taskId: aiTask.id });
      }

      // Record success metrics
      await this.monitoringService.recordMetric({
        name: 'roadmap.created',
        value: 1,
        type: 'counter',
        tags: {
          userId,
          vibeMode: body.vibe_mode ? 'true' : 'false',
          aiEnabled: body.enableAI ? 'true' : 'false'
        }
      });

      const response = {
        id: roadmapId,
        status: 'created',
        aiProcessing: body.enableAI || false,
        budgetRemaining: budgetCheck.remainingBudget,
        timestamp: new Date().toISOString()
      };

      trace.recordEvent('response_sent', { roadmapId, responseSize: JSON.stringify(response).length });

      return new Response(JSON.stringify(response), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error: any) {
      await this.monitoringService.recordError(error, {
        userId,
        endpoint: 'create_roadmap',
        metadata: { severity: 'high' }
      });

      trace.recordEvent('error', { message: error.message });

      return new Response(JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      }), { status: 500 });

    } finally {
      trace.end();
    }
  }

  async getRoadmap(roadmapId: string, userId: string): Promise<Response> {
    const trace = this.monitoringService.startTrace('get_roadmap');

    try {
      // Check kill switch
      const killStatus = await this.killSwitchService.checkStatus();
      if (killStatus.active) {
        return new Response(JSON.stringify({
          error: 'System temporarily unavailable',
          reason: killStatus.reason,
          code: 'SYSTEM_PAUSED'
        }), { status: 503 });
      }

      // Query roadmap
      const roadmap = await this.db.prepare(`
        SELECT
          id, user_id, json_graph, status, vibe_mode, thrive_score,
          created_at, updated_at
        FROM roadmaps
        WHERE id = ? AND user_id = ? AND deleted_at IS NULL
      `).bind(roadmapId, userId).first();

      if (!roadmap) {
        await this.monitoringService.recordMetric({
          name: 'roadmap.not_found',
          value: 1,
          type: 'counter',
          tags: { userId, roadmapId }
        });

        return new Response(JSON.stringify({
          error: 'Roadmap not found',
          code: 'NOT_FOUND'
        }), { status: 404 });
      }

      trace.addMetadata({
        roadmapId,
        status: roadmap.status,
        vibeMode: Boolean(roadmap.vibe_mode)
      });

      // Record access metric
      await this.monitoringService.recordMetric({
        name: 'roadmap.accessed',
        value: 1,
        type: 'counter',
        tags: {
          userId,
          roadmapId,
          status: roadmap.status
        }
      });

      const response = {
        ...roadmap,
        vibe_mode: Boolean(roadmap.vibe_mode),
        json_graph: JSON.parse(roadmap.json_graph || '{}')
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error: any) {
      await this.monitoringService.recordError(error, {
        userId,
        endpoint: 'get_roadmap',
        metadata: { roadmapId }
      });

      return new Response(JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }), { status: 500 });

    } finally {
      trace.end();
    }
  }

  async updateRoadmap(roadmapId: string, userId: string, updates: any): Promise<Response> {
    const trace = this.monitoringService.startTrace('update_roadmap');

    try {
      // Check kill switch
      const killStatus = await this.killSwitchService.checkStatus();
      if (killStatus.active) {
        return new Response(JSON.stringify({
          error: 'System temporarily unavailable',
          code: 'SYSTEM_PAUSED'
        }), { status: 503 });
      }

      // Verify roadmap exists and belongs to user
      const existing = await this.db.prepare(`
        SELECT id FROM roadmaps WHERE id = ? AND user_id = ? AND deleted_at IS NULL
      `).bind(roadmapId, userId).first();

      if (!existing) {
        return new Response(JSON.stringify({
          error: 'Roadmap not found',
          code: 'NOT_FOUND'
        }), { status: 404 });
      }

      // If updating with AI enhancement
      if (updates.enableAI && updates.json_graph) {
        const estimatedCost = this.estimateRoadmapCost(updates);
        const budgetCheck = await this.budgetService.checkBudget(estimatedCost, userId);

        if (!budgetCheck.allowed) {
          return new Response(JSON.stringify({
            error: 'Budget limit exceeded',
            details: budgetCheck,
            code: 'BUDGET_EXCEEDED'
          }), { status: 402 });
        }
      }

      // Update roadmap
      const updateFields = [];
      const updateValues = [];

      if (updates.json_graph) {
        updateFields.push('json_graph = ?');
        updateValues.push(JSON.stringify(updates.json_graph));
      }

      if (updates.status) {
        updateFields.push('status = ?');
        updateValues.push(updates.status);
      }

      if (typeof updates.vibe_mode === 'boolean') {
        updateFields.push('vibe_mode = ?');
        updateValues.push(updates.vibe_mode ? 1 : 0);
      }

      if (typeof updates.thrive_score === 'number') {
        updateFields.push('thrive_score = ?');
        updateValues.push(updates.thrive_score);
      }

      updateFields.push('updated_at = datetime(\"now\")');
      updateValues.push(roadmapId, userId);

      await this.db.prepare(`
        UPDATE roadmaps
        SET ${updateFields.join(', ')}
        WHERE id = ? AND user_id = ?
      `).bind(...updateValues).run();

      trace.recordEvent('roadmap_updated', { roadmapId, fieldsUpdated: updateFields.length });

      await this.monitoringService.recordMetric({
        name: 'roadmap.updated',
        value: 1,
        type: 'counter',
        tags: { userId, roadmapId }
      });

      return new Response(JSON.stringify({
        id: roadmapId,
        status: 'updated',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error: any) {
      await this.monitoringService.recordError(error, {
        userId,
        endpoint: 'update_roadmap',
        metadata: { roadmapId }
      });

      return new Response(JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }), { status: 500 });

    } finally {
      trace.end();
    }
  }

  // Private helper methods

  private estimateRoadmapCost(roadmapData: any): number {
    // Simple cost estimation based on complexity
    const graphSize = JSON.stringify(roadmapData.json_graph || {}).length;
    const baseCost = 0.001;
    const sizeFactor = Math.min(graphSize / 1000, 10); // Max 10x multiplier
    return baseCost * (1 + sizeFactor);
  }

  private validateRoadmapData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.json_graph) {
      errors.push('json_graph is required');
    } else {
      try {
        const graph = typeof data.json_graph === 'string'
          ? JSON.parse(data.json_graph)
          : data.json_graph;

        if (!graph.nodes || !Array.isArray(graph.nodes)) {
          errors.push('json_graph must contain nodes array');
        }

        if (!graph.edges || !Array.isArray(graph.edges)) {
          errors.push('json_graph must contain edges array');
        }
      } catch {
        errors.push('json_graph must be valid JSON');
      }
    }

    if (typeof data.vibe_mode !== 'boolean') {
      errors.push('vibe_mode must be boolean');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private async updateRoadmapWithAI(roadmapId: string, aiOutput: string): Promise<void> {
    try {
      // Parse AI output and update roadmap
      const enhancements = JSON.parse(aiOutput);

      await this.db.prepare(`
        UPDATE roadmaps
        SET
          json_graph = ?,
          thrive_score = COALESCE(?, thrive_score),
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        JSON.stringify(enhancements.graph || {}),
        enhancements.thriveScore || null,
        roadmapId
      ).run();

      console.log(`Roadmap ${roadmapId} enhanced with AI`);
    } catch (error) {
      console.error(`Failed to update roadmap ${roadmapId} with AI:`, error);
    }
  }
}