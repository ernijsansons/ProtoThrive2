/**
 * Jest test setup for ProtoThrive backend
 */

// Mock crypto for Node.js environment if needed
const nodeCrypto = require('crypto');

// Extend global object with crypto if needed
if (!(global as any).crypto) {
  (global as any).crypto = nodeCrypto.webcrypto;
}

// Set test timeout
jest.setTimeout(30000);