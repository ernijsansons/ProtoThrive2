/**
 * Dependency Injection Container
 * Ref: CLAUDE.md - Service container for dependency management
 */

import {
  IServiceContainer,
  ServiceFactory,
  ServiceOptions,
  IBudgetService,
  IKillSwitchService,
  IAIExecutor,
  IMonitoringService,
  SERVICE_TOKENS,
} from './interfaces';

// Re-export SERVICE_TOKENS for use in other modules
export { SERVICE_TOKENS } from './interfaces';

import { BudgetService } from './budget.service';
import { KillSwitchService } from './killswitch.service';
import { AIExecutorService } from './ai-executor.service';
import { MonitoringService } from './monitoring.service';

// Mock service implementations for testing
import { MockBudgetService } from './mocks/mock-budget.service';
import { MockKillSwitchService } from './mocks/mock-killswitch.service';
import { MockAIExecutorService } from './mocks/mock-ai-executor.service';

interface ServiceRegistration {
  factory: ServiceFactory<any>;
  options: ServiceOptions;
  instance?: any;
}

export class ServiceContainer implements IServiceContainer {
  private services: Map<string | symbol, ServiceRegistration[]> = new Map();
  private scopedInstances: Map<string | symbol, any> = new Map();
  private parent?: ServiceContainer;

  constructor(parent?: ServiceContainer) {
    this.parent = parent;
  }

  register<T>(
    token: string | symbol,
    factory: ServiceFactory<T>,
    options: ServiceOptions = {}
  ): void {
    const registration: ServiceRegistration = {
      factory,
      options: {
        lifecycle: options.lifecycle || 'transient',
        tags: options.tags || []
      }
    };

    const existing = this.services.get(token) || [];
    existing.push(registration);
    this.services.set(token, existing);
  }

  registerSingleton<T>(token: string | symbol, factory: ServiceFactory<T>): void {
    this.register(token, factory, { lifecycle: 'singleton' });
  }

  registerTransient<T>(token: string | symbol, factory: ServiceFactory<T>): void {
    this.register(token, factory, { lifecycle: 'transient' });
  }

  resolve<T>(token: string | symbol): T {
    // Check scoped instances first
    if (this.scopedInstances.has(token)) {
      return this.scopedInstances.get(token);
    }

    // Get registrations from this container or parent
    const registrations = this.getRegistrations(token);

    if (!registrations || registrations.length === 0) {
      throw new Error(`No service registered for token: ${String(token)}`);
    }

    // Get the last registration (allows overriding)
    const registration = registrations[registrations.length - 1];

    switch (registration.options.lifecycle) {
      case 'singleton':
        if (!registration.instance) {
          registration.instance = registration.factory(this);
        }
        return registration.instance;

      case 'scoped':
        if (!this.scopedInstances.has(token)) {
          const instance = registration.factory(this);
          this.scopedInstances.set(token, instance);
        }
        return this.scopedInstances.get(token);

      case 'transient':
      default:
        return registration.factory(this);
    }
  }

  resolveAll<T>(token: string | symbol): T[] {
    const registrations = this.getRegistrations(token);
    if (!registrations) return [];

    return registrations.map(reg => {
      if (reg.options.lifecycle === 'singleton' && reg.instance) {
        return reg.instance;
      }
      return reg.factory(this);
    });
  }

  createScope(): IServiceContainer {
    return new ServiceContainer(this);
  }

  private getRegistrations(token: string | symbol): ServiceRegistration[] | undefined {
    const local = this.services.get(token);
    const parent = this.parent ? this.parent.getRegistrations(token) : undefined;

    if (local && parent) {
      return [...parent, ...local];
    }
    return local || parent;
  }

  // Helper method to dispose all singleton services
  dispose(): void {
    Array.from(this.services.values()).forEach(registrations => {
      registrations.forEach(reg => {
        if (reg.instance && typeof reg.instance.dispose === 'function') {
          reg.instance.dispose();
        }
      });
    });
    this.services.clear();
    this.scopedInstances.clear();
  }
}

/**
 * Configure production services
 */
export function configureProductionServices(container: IServiceContainer, env: any): void {
  // Register core services
  container.registerSingleton(SERVICE_TOKENS.BUDGET, (c) => new BudgetService(env));
  container.registerSingleton(SERVICE_TOKENS.KILL_SWITCH, (c) => new KillSwitchService(env));
  container.registerSingleton(SERVICE_TOKENS.AI_EXECUTOR, (c) => new AIExecutorService(env));
  container.registerSingleton(SERVICE_TOKENS.MONITORING, (c) => new MonitoringService(env));

  // Register database service
  container.registerSingleton(SERVICE_TOKENS.DATABASE, (c) => env.DB);

  // Register cache service
  container.registerSingleton(SERVICE_TOKENS.CACHE, (c) => env.KV);
}

/**
 * Configure test services with mocks
 */
export function configureTestServices(container: IServiceContainer, env?: any): void {
  // Register mock services
  container.registerSingleton(SERVICE_TOKENS.BUDGET, (c) => new MockBudgetService());
  container.registerSingleton(SERVICE_TOKENS.KILL_SWITCH, (c) => new MockKillSwitchService());
  container.registerSingleton(SERVICE_TOKENS.AI_EXECUTOR, (c) => new MockAIExecutorService());
  container.registerSingleton(SERVICE_TOKENS.MONITORING, (c) => new MonitoringService(env || {}));

  // Register mock database
  container.registerSingleton(SERVICE_TOKENS.DATABASE, (c) => ({
    prepare: () => ({
      bind: () => ({
        first: async () => ({}),
        all: async () => ({ results: [] }),
        run: async () => ({ success: true })
      })
    })
  }));

  // Register mock cache
  container.registerSingleton(SERVICE_TOKENS.CACHE, (c) => ({
    get: async (key: string) => null,
    put: async (key: string, value: string) => {},
    delete: async (key: string) => {},
    list: async () => ({ keys: [] })
  }));
}

/**
 * Service locator for global access (use sparingly)
 */
export class ServiceLocator {
  private static instance: IServiceContainer;

  static initialize(container: IServiceContainer): void {
    ServiceLocator.instance = container;
  }

  static get<T>(token: string | symbol): T {
    if (!ServiceLocator.instance) {
      throw new Error('ServiceLocator not initialized');
    }
    return ServiceLocator.instance.resolve<T>(token);
  }

  static getContainer(): IServiceContainer {
    if (!ServiceLocator.instance) {
      throw new Error('ServiceLocator not initialized');
    }
    return ServiceLocator.instance;
  }
}