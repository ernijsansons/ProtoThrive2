// Ref: CLAUDE.md - Backend Mock Helpers
// Local mock helpers for backend to avoid importing from outside rootDir

import type { KVNamespace } from '@cloudflare/workers-types';

/**
 * Check kill-switch status from KV
 * Ref: CLAUDE.md Usage Guidelines - Kill-Switch
 */
export const checkKillSwitch = async (kv: KVNamespace | undefined): Promise<boolean> => {
  if (!kv) {
    console.log('THERMONUCLEAR: KV not available, kill-switch check skipped');
    return false;
  }
  
  try {
    const isPaused = await kv.get('proto_paused');
    console.log(`THERMONUCLEAR: Checking kill-switch - proto_paused = ${isPaused || 'false'}`);
    return isPaused === 'true';
  } catch (error) {
    console.error('THERMONUCLEAR: Kill-switch check failed', error);
    return false;
  }
};

/**
 * Budget check function
 * Ref: CLAUDE.md Phase 5 - Security Cost
 */
export const checkBudget = (currentBudget: number, additionalCost: number): number => {
  const total = currentBudget + additionalCost;
  const limit = 0.10; // $0.10 per task
  
  console.log(`Thermonuclear Budget: ${total.toFixed(4)}`);
  
  if (total > limit) {
    throw { 
      code: 'BUDGET-429', 
      message: `Task cost $${total.toFixed(4)} exceeds limit $${limit}` 
    };
  }
  
  return total;
};