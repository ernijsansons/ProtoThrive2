/**
 * Mock AI Executor Service for Testing
 * Ref: CLAUDE.md - Test mock implementations
 */

import {
  IAIExecutor,
  AITask,
  ExecutionOptions,
  AITaskResult,
  ModelStatusMap,
} from '../interfaces';

export class MockAIExecutorService implements IAIExecutor {
  private taskCounter = 0;
  private activeTasks: Set<string> = new Set();

  async execute(task: AITask, options?: ExecutionOptions): Promise<AITaskResult> {
    const taskId = task.id || `mock-task-${++this.taskCounter}`;
    this.activeTasks.add(taskId);

    console.log(`Mock AI Execution: ${taskId} - Type: ${task.type}`);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Notify progress
    if (options?.callback) {
      options.callback({
        taskId,
        status: 'running',
        progress: 50,
        message: 'Mock processing'
      });
    }

    // Generate mock response based on task type
    let output: string;
    switch (task.type) {
      case 'ui':
        output = '// Mock UI Component\nconst Component = () => <div>Mock UI</div>';
        break;
      case 'code':
        output = '// Mock Code Generation\nfunction mockFunction() { return "mock"; }';
        break;
      case 'analysis':
        output = 'Mock Analysis: Task completed successfully';
        break;
      default:
        output = 'Mock generation completed';
    }

    this.activeTasks.delete(taskId);

    // Notify completion
    if (options?.callback) {
      options.callback({
        taskId,
        status: 'completed',
        progress: 100,
        message: 'Mock completed'
      });
    }

    return {
      taskId,
      status: 'success',
      output,
      model: 'mock-model',
      tokenCount: 100,
      cost: 0.001,
      duration: 100,
      retries: 0
    };
  }

  async executeBatch(tasks: AITask[], options?: ExecutionOptions): Promise<AITaskResult[]> {
    console.log(`Mock Batch Execution: ${tasks.length} tasks`);
    return Promise.all(tasks.map(task => this.execute(task, options)));
  }

  async getModelsStatus(): Promise<ModelStatusMap> {
    return {
      'mock-model': {
        available: true,
        responseTime: 100,
        costPerToken: 0.00001,
        maxTokens: 10000,
        queue: 0
      },
      'mock-fallback': {
        available: true,
        responseTime: 200,
        costPerToken: 0.00002,
        maxTokens: 5000,
        queue: 0
      }
    };
  }

  async cancel(taskId: string): Promise<void> {
    if (this.activeTasks.has(taskId)) {
      this.activeTasks.delete(taskId);
      console.log(`Mock Task Cancelled: ${taskId}`);
    }
  }

  dispose(): void {
    this.activeTasks.clear();
  }
}