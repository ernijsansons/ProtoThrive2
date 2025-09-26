/**
 * Service Integration Tests
 * Tests the new service architecture with both mocks and real implementations
 */

import {
  ServiceContainer,
  configureTestServices,
  configureProductionServices,
  SERVICE_TOKENS,
} from '../src/services/container';

import {
  IBudgetService,
  IKillSwitchService,
  IAIExecutor,
  IMonitoringService,
} from '../src/services/interfaces';

import { RoadmapRoutes } from '../src/routes/roadmaps';

describe('Service Integration Tests', () => {
  let container: ServiceContainer;

  describe('Mock Services', () => {
    beforeEach(() => {
      container = new ServiceContainer();
      configureTestServices(container);
    });

    afterEach(() => {
      container.dispose();
    });

    describe('BudgetService', () => {
      it('should allow tasks within budget', async () => {
        const budgetService = container.resolve<IBudgetService>(SERVICE_TOKENS.BUDGET);

        const result = await budgetService.checkBudget(0.05, 'test-user');

        expect(result.allowed).toBe(true);
        expect(result.currentUsage).toBe(0);
        expect(result.limit).toBe(0.10);
        expect(result.remainingBudget).toBe(0.10);
      });

      it('should reject tasks exceeding budget', async () => {
        const budgetService = container.resolve<IBudgetService>(SERVICE_TOKENS.BUDGET);

        // Record some usage first
        await budgetService.recordCost(0.08, 'test-user');

        const result = await budgetService.checkBudget(0.05, 'test-user');

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Mock budget exceeded');
      });

      it('should track cost history', async () => {
        const budgetService = container.resolve<IBudgetService>(SERVICE_TOKENS.BUDGET);

        await budgetService.recordCost(0.03, 'test-user', {
          taskType: 'code',
          model: 'mock',
          tokenCount: 100
        });

        const status = await budgetService.getBudgetStatus('test-user');

        expect(status.userId).toBe('test-user');
        expect(status.currentUsage).toBe(0.03);
        expect(status.limit).toBe(0.10);
      });
    });

    describe('KillSwitchService', () => {
      it('should start inactive', async () => {
        const killSwitchService = container.resolve<IKillSwitchService>(SERVICE_TOKENS.KILL_SWITCH);

        const status = await killSwitchService.checkStatus();

        expect(status.active).toBe(false);
      });

      it('should activate with reason', async () => {
        const killSwitchService = container.resolve<IKillSwitchService>(SERVICE_TOKENS.KILL_SWITCH);

        await killSwitchService.activate('Testing kill switch', 10);

        const status = await killSwitchService.checkStatus();

        expect(status.active).toBe(true);
        expect(status.reason).toBe('Testing kill switch');
        expect(status.activatedBy).toBe('mock');
      });

      it('should notify subscribers', (done) => {
        const killSwitchService = container.resolve<IKillSwitchService>(SERVICE_TOKENS.KILL_SWITCH);

        let callCount = 0;
        const unsubscribe = killSwitchService.subscribe((status) => {
          callCount++;
          if (callCount === 2 && status.active) {
            expect(status.reason).toBe('Subscription test');
            unsubscribe();
            done();
          }
        });

        // Trigger activation
        killSwitchService.activate('Subscription test');
      });

      it('should auto-deactivate after duration', async () => {
        const killSwitchService = container.resolve<IKillSwitchService>(SERVICE_TOKENS.KILL_SWITCH);

        await killSwitchService.activate('Temporary pause', 1); // 1 second

        // Wait for auto-deactivation
        await new Promise(resolve => setTimeout(resolve, 1100));

        const status = await killSwitchService.checkStatus();
        expect(status.active).toBe(false);
      });
    });

    describe('AIExecutorService', () => {
      it('should execute tasks successfully', async () => {
        const aiExecutor = container.resolve<IAIExecutor>(SERVICE_TOKENS.AI_EXECUTOR);

        const result = await aiExecutor.execute({
          type: 'code',
          prompt: 'Create a function that adds two numbers'
        });

        expect(result.status).toBe('success');
        expect(result.output).toContain('Mock Code Generation');
        expect(result.model).toBe('mock-model');
        expect(result.cost).toBe(0.001);
      });

      it('should handle different task types', async () => {
        const aiExecutor = container.resolve<IAIExecutor>(SERVICE_TOKENS.AI_EXECUTOR);

        const uiTask = await aiExecutor.execute({
          type: 'ui',
          prompt: 'Create a button component'
        });

        const analysisTask = await aiExecutor.execute({
          type: 'analysis',
          prompt: 'Analyze this code'
        });

        expect(uiTask.output).toContain('Mock UI Component');
        expect(analysisTask.output).toContain('Mock Analysis');
      });

      it('should execute batch tasks', async () => {
        const aiExecutor = container.resolve<IAIExecutor>(SERVICE_TOKENS.AI_EXECUTOR);

        const tasks = [
          { type: 'code' as const, prompt: 'Function 1' },
          { type: 'ui' as const, prompt: 'Component 1' },
          { type: 'analysis' as const, prompt: 'Analysis 1' }
        ];

        const results = await aiExecutor.executeBatch(tasks);

        expect(results).toHaveLength(3);
        expect(results[0].status).toBe('success');
        expect(results[1].status).toBe('success');
        expect(results[2].status).toBe('success');
      });

      it('should report model status', async () => {
        const aiExecutor = container.resolve<IAIExecutor>(SERVICE_TOKENS.AI_EXECUTOR);

        const status = await aiExecutor.getModelsStatus();

        expect(status['mock-model']).toBeDefined();
        expect(status['mock-model'].available).toBe(true);
        expect(status['mock-model'].costPerToken).toBe(0.00001);
      });
    });

    describe('MonitoringService', () => {
      it('should record metrics', async () => {
        const monitoringService = container.resolve<IMonitoringService>(SERVICE_TOKENS.MONITORING);

        await monitoringService.recordMetric({
          name: 'test.counter',
          value: 1,
          type: 'counter',
          tags: { test: 'true' }
        });

        // No error should be thrown
        expect(true).toBe(true);
      });

      it('should record errors', async () => {
        const monitoringService = container.resolve<IMonitoringService>(SERVICE_TOKENS.MONITORING);

        const testError = new Error('Test error');
        await monitoringService.recordError(testError, {
          userId: 'test-user',
          endpoint: 'test'
        });

        // No error should be thrown
        expect(true).toBe(true);
      });

      it('should provide tracing', () => {
        const monitoringService = container.resolve<IMonitoringService>(SERVICE_TOKENS.MONITORING);

        const trace = monitoringService.startTrace('test_operation');
        trace.addMetadata({ operation: 'test' });
        trace.recordEvent('step_1', { data: 'test' });
        trace.end();

        // No error should be thrown
        expect(true).toBe(true);
      });

      it('should report health status', async () => {
        const monitoringService = container.resolve<IMonitoringService>(SERVICE_TOKENS.MONITORING);

        const health = await monitoringService.getHealthStatus();

        expect(health.overall).toBeDefined();
        expect(health.services).toBeDefined();
        expect(health.metrics).toBeDefined();
      });
    });
  });

  describe('Service Container', () => {
    it('should resolve singleton services consistently', () => {
      const container = new ServiceContainer();
      configureTestServices(container);

      const service1 = container.resolve<IBudgetService>(SERVICE_TOKENS.BUDGET);
      const service2 = container.resolve<IBudgetService>(SERVICE_TOKENS.BUDGET);

      expect(service1).toBe(service2); // Same instance
    });

    it('should create scoped containers', () => {
      const container = new ServiceContainer();
      configureTestServices(container);

      const scope1 = container.createScope();
      const scope2 = container.createScope();

      expect(scope1).not.toBe(scope2);
      expect(scope1).not.toBe(container);
    });

    it('should support service overriding', () => {
      const container = new ServiceContainer();
      configureTestServices(container);

      // Override with custom service
      container.registerSingleton(SERVICE_TOKENS.BUDGET, () => ({
        checkBudget: async () => ({ allowed: false, currentUsage: 0, limit: 0, remainingBudget: 0 }),
        recordCost: async () => {},
        getBudgetStatus: async () => ({} as any),
        resetBudget: async () => {}
      }));

      const budgetService = container.resolve<IBudgetService>(SERVICE_TOKENS.BUDGET);
      expect(budgetService.checkBudget).toBeDefined();
    });
  });

  describe('Route Integration', () => {
    let roadmapRoutes: RoadmapRoutes;
    let mockEnv: any;

    beforeEach(() => {
      container = new ServiceContainer();
      configureTestServices(container);

      mockEnv = {
        DB: {
          prepare: jest.fn(() => ({
            bind: jest.fn(() => ({
              first: jest.fn().mockResolvedValue(null),
              all: jest.fn().mockResolvedValue({ results: [] }),
              run: jest.fn().mockResolvedValue({ success: true })
            }))
          }))
        }
      };

      roadmapRoutes = new RoadmapRoutes(container, mockEnv);
    });

    it('should handle kill switch in create roadmap', async () => {
      // Activate kill switch
      const killSwitchService = container.resolve<IKillSwitchService>(SERVICE_TOKENS.KILL_SWITCH);
      await killSwitchService.activate('System maintenance');

      const request = new Request('http://test.com', {
        method: 'POST',
        body: JSON.stringify({
          json_graph: { nodes: [], edges: [] },
          vibe_mode: true
        })
      });

      const response = await roadmapRoutes.createRoadmap(request, 'test-user');

      expect(response.status).toBe(503);
      const body = await response.json();
      expect(body.code).toBe('SYSTEM_PAUSED');
      expect(body.reason).toBe('System maintenance');
    });

    it('should handle budget exceeded in create roadmap', async () => {
      // Exceed budget first
      const budgetService = container.resolve<IBudgetService>(SERVICE_TOKENS.BUDGET);
      await budgetService.recordCost(0.09, 'test-user');

      const request = new Request('http://test.com', {
        method: 'POST',
        body: JSON.stringify({
          json_graph: { nodes: [], edges: [] },
          vibe_mode: true,
          enableAI: true // This would require budget
        })
      });

      const response = await roadmapRoutes.createRoadmap(request, 'test-user');

      expect(response.status).toBe(402);
      const body = await response.json();
      expect(body.code).toBe('BUDGET_EXCEEDED');
    });

    it('should create roadmap successfully', async () => {
      const request = new Request('http://test.com', {
        method: 'POST',
        body: JSON.stringify({
          json_graph: { nodes: [{ id: 'n1' }], edges: [] },
          vibe_mode: true
        })
      });

      const response = await roadmapRoutes.createRoadmap(request, 'test-user');

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.id).toBeDefined();
      expect(body.status).toBe('created');
    });
  });

  describe('Error Handling', () => {
    it('should handle service resolution errors', () => {
      const container = new ServiceContainer();
      // Don't configure services

      expect(() => {
        container.resolve(SERVICE_TOKENS.BUDGET);
      }).toThrow('No service registered for token');
    });

    it('should handle service method errors gracefully', async () => {
      const container = new ServiceContainer();

      // Register a service that throws
      container.registerSingleton(SERVICE_TOKENS.BUDGET, () => ({
        checkBudget: async () => {
          throw new Error('Service error');
        },
        recordCost: async () => {},
        getBudgetStatus: async () => ({} as any),
        resetBudget: async () => {}
      }));

      const budgetService = container.resolve<IBudgetService>(SERVICE_TOKENS.BUDGET);

      await expect(budgetService.checkBudget(0.01, 'test')).rejects.toThrow('Service error');
    });
  });

  describe('Performance', () => {
    it('should handle high load', async () => {
      const container = new ServiceContainer();
      configureTestServices(container);

      const aiExecutor = container.resolve<IAIExecutor>(SERVICE_TOKENS.AI_EXECUTOR);

      const tasks = Array.from({ length: 100 }, (_, i) => ({
        type: 'code' as const,
        prompt: `Task ${i}`
      }));

      const startTime = Date.now();
      const results = await aiExecutor.executeBatch(tasks);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(100);
      expect(results.every(r => r.status === 'success')).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});