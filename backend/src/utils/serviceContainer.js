/**
 * Service container for ProtoThrive backend
 * Implements singleton pattern for service instances to prevent recreation
 */
import { DatabaseService } from './db';
import { UserService } from '../services/UserService';
// Global service container - persists across requests
const serviceContainer = {};
/**
 * Get or create database service (singleton)
 */
export function getDatabaseService(db, kv) {
    if (!serviceContainer.dbService) {
        serviceContainer.dbService = new DatabaseService(db, kv);
        console.log('DatabaseService initialized (singleton)');
    }
    return serviceContainer.dbService;
}
/**
 * Get or create user service (singleton)
 */
export function getUserService(dbService) {
    if (!serviceContainer.userService) {
        serviceContainer.userService = new UserService(dbService);
        console.log('UserService initialized (singleton)');
    }
    return serviceContainer.userService;
}
/**
 * Reset service container (for testing only)
 */
export function resetServiceContainer() {
    serviceContainer.dbService = undefined;
    serviceContainer.userService = undefined;
}
/**
 * Get service container stats
 */
export function getServiceContainerStats() {
    return {
        dbServiceInitialized: !!serviceContainer.dbService,
        userServiceInitialized: !!serviceContainer.userService,
        timestamp: new Date().toISOString()
    };
}
