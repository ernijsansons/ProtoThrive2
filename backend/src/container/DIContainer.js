/**
 * Dependency Injection Container for ProtoThrive
 */
import { DatabaseService } from '../utils/db';
import { initializeJWTService } from '../utils/auth';
export class DIContainer {
    static instance;
    services = new Map();
    constructor() { }
    static getInstance() {
        if (!DIContainer.instance) {
            DIContainer.instance = new DIContainer();
        }
        return DIContainer.instance;
    }
    register(name, service) {
        this.services.set(name, service);
    }
    get(name) {
        const service = this.services.get(name);
        if (!service) {
            throw new Error(`Service ${name} not found`);
        }
        return service;
    }
    has(name) {
        return this.services.has(name);
    }
}
export function configureContainer(env) {
    const container = DIContainer.getInstance();
    // Register database service
    if (!container.has('database')) {
        container.register('database', new DatabaseService(env.DB, env.KV_STORE));
    }
    // Initialize JWT service
    const jwtSecret = env.JWT_SECRET || 'default-secret-change-in-production';
    initializeJWTService(jwtSecret);
    return container;
}
