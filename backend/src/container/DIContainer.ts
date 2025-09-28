/**
 * Dependency Injection Container for ProtoThrive
 */

import { DatabaseService, Env } from '../utils/db';
import { initializeJWTService } from '../utils/auth';

export class DIContainer {
  private static instance: DIContainer;
  private services: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }
    return service as T;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }
}

export function configureContainer(env: Env): DIContainer {
  const container = DIContainer.getInstance();

  // Register database service
  if (!container.has('database')) {
    container.register('database', new DatabaseService(env));
  }

  // Initialize JWT service
  const jwtSecret = (env as any).JWT_SECRET || 'default-secret-change-in-production';
  initializeJWTService(jwtSecret);

  return container;
}