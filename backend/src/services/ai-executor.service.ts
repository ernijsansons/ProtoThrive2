/**
 * AI Executor Service Implementation
 * Ref: CLAUDE.md - AI orchestration with real API integrations
 */

import {
  IAIExecutor,
  AITask,
  ExecutionOptions,
  AITaskResult,
  ExecutionProgress,
  ModelStatusMap,
} from './interfaces';

interface ModelConfig {
  endpoint: string;
  apiKey: string;
  maxTokens: number;
  costPerToken: number;
  timeout: number;
  priority: number;
}

export class AIExecutorService implements IAIExecutor {
  private db: any;
  private kv: any;
  private models: Map<string, ModelConfig>;
  private activeTasks: Map<string, AbortController> = new Map();
  private modelStatus: ModelStatusMap = {};
  private requestQueue: Map<string, AITask[]> = new Map();

  constructor(env: any) {
    this.db = env.DB;
    this.kv = env.KV;

    // Initialize model configurations
    this.models = new Map([
      ['claude', {
        endpoint: env.CLAUDE_API_ENDPOINT || 'https://api.anthropic.com/v1/messages',
        apiKey: env.CLAUDE_API_KEY,
        maxTokens: 100000,
        costPerToken: 0.000015,
        timeout: 30000,
        priority: 3
      }],
      ['kimi', {
        endpoint: env.KIMI_API_ENDPOINT || 'https://api.kimi.ai/v1/chat',
        apiKey: env.KIMI_API_KEY,
        maxTokens: 50000,
        costPerToken: 0.000001,
        timeout: 20000,
        priority: 1
      }],
      ['uxpilot', {
        endpoint: env.UXPILOT_API_ENDPOINT || 'https://api.uxpilot.com/v1/generate',
        apiKey: env.UXPILOT_API_KEY,
        maxTokens: 10000,
        costPerToken: 0.000020,
        timeout: 25000,
        priority: 2
      }]
    ]);

    this.initializeModelStatus();
  }

  async execute(task: AITask, options?: ExecutionOptions): Promise<AITaskResult> {
    const taskId = task.id || crypto.randomUUID();
    const startTime = Date.now();

    try {
      // Check timeout
      const timeout = options?.timeout || 30000;
      const controller = new AbortController();
      this.activeTasks.set(taskId, controller);

      // Set up timeout
      const timeoutId = setTimeout(() => {
        controller.abort();
        this.activeTasks.delete(taskId);
      }, timeout);

      // Notify progress
      this.notifyProgress(options?.callback, {
        taskId,
        status: 'queued',
        progress: 0,
        message: 'Task queued for execution'
      });

      // Select model based on task type and availability
      let selectedModel = await this.selectModel(task, options);

      // Check cost limit
      const estimatedCost = this.estimateCost(task.prompt, selectedModel);
      if (options?.costLimit && estimatedCost > options.costLimit) {
        throw new Error(`Estimated cost $${estimatedCost} exceeds limit $${options.costLimit}`);
      }

      // Execute with retries
      let lastError: any;
      let retries = 0;
      const maxRetries = task.maxRetries || 3;

      while (retries < maxRetries) {
        try {
          this.notifyProgress(options?.callback, {
            taskId,
            status: 'running',
            progress: 20 + (retries * 20),
            message: `Executing with ${selectedModel} (attempt ${retries + 1})`
          });

          const result = await this.executeWithModel(
            task,
            selectedModel,
            controller.signal
          );

          clearTimeout(timeoutId);
          this.activeTasks.delete(taskId);

          // Record execution
          await this.recordExecution(taskId, task, result, selectedModel, Date.now() - startTime);

          this.notifyProgress(options?.callback, {
            taskId,
            status: 'completed',
            progress: 100,
            message: 'Task completed successfully'
          });

          return result;

        } catch (error: any) {
          lastError = error;
          retries++;

          if (error.name === 'AbortError') {
            throw new Error('Task timeout');
          }

          // Try fallback model on error
          if (retries < maxRetries) {
            selectedModel = this.getFallbackModel(selectedModel);
            await this.delay(Math.pow(2, retries) * 1000); // Exponential backoff
          }
        }
      }

      throw lastError || new Error('Max retries exceeded');

    } catch (error: any) {
      this.activeTasks.delete(taskId);

      const result: AITaskResult = {
        taskId,
        status: 'failure',
        error: error.message,
        model: 'none',
        tokenCount: 0,
        cost: 0,
        duration: Date.now() - startTime,
        retries: 0
      };

      await this.recordExecution(taskId, task, result, 'none', Date.now() - startTime);

      this.notifyProgress(options?.callback, {
        taskId,
        status: 'failed',
        progress: 0,
        message: error.message
      });

      return result;
    }
  }

  async executeBatch(tasks: AITask[], options?: ExecutionOptions): Promise<AITaskResult[]> {
    // Execute tasks in parallel with concurrency control
    const concurrency = 5;
    const results: AITaskResult[] = [];
    const executing: Promise<void>[] = [];

    for (const task of tasks) {
      const promise = this.execute(task, options).then(result => {
        results.push(result);
      });

      executing.push(promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p), 1);
      }
    }

    await Promise.all(executing);
    return results;
  }

  async getModelsStatus(): Promise<ModelStatusMap> {
    // Update status for each model
    await Promise.all(
      Array.from(this.models.entries()).map(async ([name, config]) => {
        const status = await this.checkModelHealth(name, config);
        this.modelStatus[name] = status;
      })
    );

    return this.modelStatus;
  }

  async cancel(taskId: string): Promise<void> {
    const controller = this.activeTasks.get(taskId);
    if (controller) {
      controller.abort();
      this.activeTasks.delete(taskId);
      console.log(`Task ${taskId} cancelled`);
    }
  }

  // Private helper methods

  private async selectModel(task: AITask, options?: ExecutionOptions): Promise<string> {
    if (task.preferredModel && this.models.has(task.preferredModel)) {
      return task.preferredModel;
    }

    // Model selection logic based on task type and cost
    if (task.type === 'ui') {
      return 'uxpilot';
    } else if (task.type === 'code' && !options?.requireApproval) {
      return 'kimi'; // Cheaper for code generation
    } else if (task.type === 'analysis') {
      return 'claude'; // Better for complex analysis
    }

    // Default to cheapest available model
    const available = await this.getAvailableModels();
    return available.sort((a, b) =>
      this.models.get(a)!.costPerToken - this.models.get(b)!.costPerToken
    )[0] || 'kimi';
  }

  private async executeWithModel(
    task: AITask,
    model: string,
    signal: AbortSignal
  ): Promise<AITaskResult> {
    const config = this.models.get(model);
    if (!config) {
      throw new Error(`Model ${model} not configured`);
    }

    const requestBody = this.buildRequestBody(task, model, config);

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return this.parseModelResponse(task.id || crypto.randomUUID(), data, model);
  }

  private buildRequestBody(task: AITask, model: string, config: ModelConfig): any {
    switch (model) {
      case 'claude':
        return {
          model: 'claude-3-opus-20240229',
          max_tokens: Math.min(4096, config.maxTokens),
          messages: [{
            role: 'user',
            content: task.prompt
          }],
          metadata: task.context
        };

      case 'kimi':
        return {
          prompt: task.prompt,
          max_tokens: Math.min(2048, config.maxTokens),
          temperature: 0.7,
          context: task.context
        };

      case 'uxpilot':
        return {
          task: task.prompt,
          type: 'ui_component',
          framework: task.context?.framework || 'react',
          style: task.context?.style || 'modern'
        };

      default:
        return { prompt: task.prompt };
    }
  }

  private parseModelResponse(taskId: string, response: any, model: string): AITaskResult {
    let output: string;
    let tokenCount: number;

    switch (model) {
      case 'claude':
        output = response.content?.[0]?.text || '';
        tokenCount = response.usage?.output_tokens || 0;
        break;

      case 'kimi':
        output = response.text || response.completion || '';
        tokenCount = response.tokens || 0;
        break;

      case 'uxpilot':
        output = JSON.stringify(response.components || response);
        tokenCount = response.token_count || 100;
        break;

      default:
        output = JSON.stringify(response);
        tokenCount = 100;
    }

    const config = this.models.get(model)!;
    const cost = tokenCount * config.costPerToken;

    return {
      taskId,
      status: 'success',
      output,
      model,
      tokenCount,
      cost,
      duration: 0, // Will be set by caller
      retries: 0
    };
  }

  private async checkModelHealth(name: string, config: ModelConfig): Promise<any> {
    try {
      const start = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${config.endpoint}/health`, {
        signal: controller.signal
      }).catch(() => null);

      clearTimeout(timeoutId);

      const responseTime = Date.now() - start;
      const available = response?.ok || false;

      return {
        available,
        responseTime,
        costPerToken: config.costPerToken,
        maxTokens: config.maxTokens,
        queue: this.requestQueue.get(name)?.length || 0
      };

    } catch {
      return {
        available: false,
        responseTime: 5000,
        costPerToken: config.costPerToken,
        maxTokens: config.maxTokens,
        queue: 0
      };
    }
  }

  private async getAvailableModels(): Promise<string[]> {
    const status = await this.getModelsStatus();
    return Object.entries(status)
      .filter(([_, s]) => s.available)
      .map(([name]) => name);
  }

  private getFallbackModel(currentModel: string): string {
    const fallbacks: Record<string, string> = {
      'claude': 'kimi',
      'kimi': 'claude',
      'uxpilot': 'kimi'
    };
    return fallbacks[currentModel] || 'kimi';
  }

  private estimateCost(prompt: string, model: string): number {
    const config = this.models.get(model);
    if (!config) return 0;

    // Rough token estimation: ~4 chars per token
    const estimatedTokens = Math.ceil(prompt.length / 4);
    return estimatedTokens * config.costPerToken;
  }

  private async recordExecution(
    taskId: string,
    task: AITask,
    result: AITaskResult,
    model: string,
    duration: number
  ): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.prepare(`
        INSERT INTO agent_logs (
          id, task_type, output, status, model_used, token_count, cost, duration, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        taskId,
        task.type,
        result.output?.substring(0, 1000), // Truncate for storage
        result.status,
        model,
        result.tokenCount,
        result.cost,
        duration
      ).run();
    } catch (error) {
      console.error('Failed to record execution:', error);
    }
  }

  private notifyProgress(
    callback: ((progress: ExecutionProgress) => void) | undefined,
    progress: ExecutionProgress
  ): void {
    if (callback) {
      try {
        callback(progress);
      } catch (error) {
        console.error('Progress callback error:', error);
      }
    }
  }

  private async initializeModelStatus(): Promise<void> {
    Array.from(this.models.entries()).forEach(([name, config]) => {
      this.modelStatus[name] = {
        available: true,
        responseTime: 0,
        costPerToken: config.costPerToken,
        maxTokens: config.maxTokens,
        queue: 0
      };
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cleanup method
  dispose(): void {
    Array.from(this.activeTasks.values()).forEach(controller => {
      controller.abort();
    });
    this.activeTasks.clear();
    this.requestQueue.clear();
  }
}