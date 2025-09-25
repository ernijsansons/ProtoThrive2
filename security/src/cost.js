// Ref: CLAUDE.md Section 5 - Cost checking system with budget enforcement
// Thermonuclear Budget Management System

// Session tracking mock global - simulates user session budget
let current = 0;

function checkBudget(currentBudget, add) {
  const total = currentBudget + add;
  if (total > 0.10) {
    throw { 
      code: 'BUDGET-429', 
      message: 'Task budget exceeded - Thermonuclear cost limit reached' 
    };
  }
  console.log(`Thermonuclear Budget: $${total.toFixed(4)} / $0.10 (${(total/0.10*100).toFixed(1)}% used)`);
  return total;
}

// Session budget tracking with user isolation
class BudgetTracker {
  constructor() {
    this.sessions = new Map();
    console.log('Thermonuclear Budget Tracker Init: Cost Management Active');
  }

  initSession(userId) {
    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, { spent: 0, startTime: Date.now() });
      console.log(`Thermonuclear Budget: New session for ${userId} - $0.10 budget allocated`);
    }
    return this.sessions.get(userId);
  }

  checkUserBudget(userId, additionalCost) {
    const session = this.initSession(userId);
    return checkBudget(session.spent, additionalCost);
  }

  spendUserBudget(userId, cost) {
    const session = this.initSession(userId);
    const newTotal = this.checkUserBudget(userId, cost);
    session.spent = newTotal;
    console.log(`Thermonuclear Budget: User ${userId} spent $${cost.toFixed(4)} - Total: $${newTotal.toFixed(4)}`);
    return newTotal;
  }

  getUserBudgetStatus(userId) {
    const session = this.sessions.get(userId);
    if (!session) return { spent: 0, remaining: 0.10, percentUsed: 0 };
    
    return {
      spent: session.spent,
      remaining: 0.10 - session.spent,
      percentUsed: (session.spent / 0.10) * 100,
      sessionDuration: Date.now() - session.startTime
    };
  }

  resetUserBudget(userId) {
    if (this.sessions.has(userId)) {
      this.sessions.delete(userId);
      console.log(`Thermonuclear Budget: Reset budget for ${userId}`);
    }
  }
}

// Singleton budget tracker
export const budgetTracker = new BudgetTracker();

export { checkBudget, current, BudgetTracker };

// Dummy call with session track mock global current=0 as per CLAUDE.md
try {
  const result = checkBudget(current, 0.05);
  console.log(`Thermonuclear Budget Test: Passed - New total: $${result.toFixed(4)}`);
} catch (error) {
  console.log(`Thermonuclear Budget Test: Failed - ${error.message}`);
}

console.log('Thermonuclear Cost: Budget Enforcement System - Status: Active');