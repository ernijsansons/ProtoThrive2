// Budget tracking middleware for cost control
import type { Context, Next } from 'hono';
import type { AuthUser } from './auth';

interface BudgetConfig {
  maxDailyBudget: number;
  costPerRequest: number;
  windowSize: number; // seconds
}

interface SessionBudget {
  totalCost: number;
  requestCount: number;
  lastUpdate: number;
  dailySpend: number;
}

type Bindings = {
  KV: any;
  MAX_DAILY_BUDGET?: string;
  COST_PER_REQUEST?: string;
  RATE_LIMIT_WINDOW?: string;
}

type Variables = {
  user: AuthUser;
}

// Generate budget key for user session
function getBudgetKey(userId: string): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `budget:${userId}:${today}`;
}

// Get budget configuration from environment
function getBudgetConfig(env: Bindings): BudgetConfig {
  return {
    maxDailyBudget: parseFloat(env.MAX_DAILY_BUDGET || '10.0'),
    costPerRequest: parseFloat(env.COST_PER_REQUEST || '0.05'),
    windowSize: parseInt(env.RATE_LIMIT_WINDOW || '3600')
  };
}

// Budget tracking middleware
export async function budgetTrackingMiddleware(c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) {
  const user = c.get('user');
  const env = c.env;

  if (!user || !env.KV) {
    console.warn('Budget tracking: Missing user context or KV storage');
    await next();
    return;
  }

  const config = getBudgetConfig(env);
  const budgetKey = getBudgetKey(user.id);

  try {
    // Get current budget data
    const budgetDataRaw = await env.KV.get(budgetKey);
    const currentBudget: SessionBudget = budgetDataRaw
      ? JSON.parse(budgetDataRaw)
      : {
          totalCost: 0,
          requestCount: 0,
          lastUpdate: Date.now(),
          dailySpend: 0
        };

    // Check if daily budget would be exceeded
    const projectedCost = currentBudget.totalCost + config.costPerRequest;

    if (projectedCost > config.maxDailyBudget) {
      console.error(`Budget exceeded for user ${user.id}: ${projectedCost} > ${config.maxDailyBudget}`);

      return c.json({
        error: 'BUDGET_EXCEEDED',
        message: 'Daily budget limit exceeded',
        details: {
          current: currentBudget.totalCost,
          limit: config.maxDailyBudget,
          cost_per_request: config.costPerRequest
        }
      }, 429);
    }

    // Update budget tracking
    const updatedBudget: SessionBudget = {
      totalCost: projectedCost,
      requestCount: currentBudget.requestCount + 1,
      lastUpdate: Date.now(),
      dailySpend: projectedCost
    };

    // Store updated budget with TTL (expire at end of day)
    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0);
    const ttl = Math.floor((tomorrow.getTime() - Date.now()) / 1000);

    await env.KV.put(budgetKey, JSON.stringify(updatedBudget), {
      expirationTtl: ttl
    });

    // Add budget info to response headers for monitoring
    c.header('X-Budget-Used', updatedBudget.totalCost.toString());
    c.header('X-Budget-Limit', config.maxDailyBudget.toString());
    c.header('X-Budget-Remaining', (config.maxDailyBudget - updatedBudget.totalCost).toString());

    console.log(`Budget tracking: User ${user.id} - Cost: ${updatedBudget.totalCost}/${config.maxDailyBudget}`);

  } catch (error) {
    console.error('Budget tracking error:', error);
    // Don't block request on budget tracking errors
    // But log for monitoring
  }

  await next();
}

// Rate limiting middleware
export async function rateLimitMiddleware(c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) {
  const user = c.get('user');
  const env = c.env;

  if (!user || !env.KV) {
    await next();
    return;
  }

  const config = getBudgetConfig(env);
  const rateLimitKey = `rate_limit:${user.id}:${Math.floor(Date.now() / (config.windowSize * 1000))}`;

  try {
    const currentCount = await env.KV.get(rateLimitKey) || '0';
    const count = parseInt(currentCount);

    const maxRequests = 100; // Default rate limit

    if (count >= maxRequests) {
      return c.json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
        details: {
          limit: maxRequests,
          window: config.windowSize,
          reset_time: (Math.floor(Date.now() / (config.windowSize * 1000)) + 1) * config.windowSize
        }
      }, 429);
    }

    // Increment counter
    await env.KV.put(rateLimitKey, String(count + 1), {
      expirationTtl: config.windowSize
    });

    // Add rate limit headers
    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', (maxRequests - count - 1).toString());
    c.header('X-RateLimit-Reset', ((Math.floor(Date.now() / (config.windowSize * 1000)) + 1) * config.windowSize).toString());

  } catch (error) {
    console.error('Rate limiting error:', error);
    // Don't block on rate limiting errors
  }

  await next();
}

// Budget monitoring endpoint for admins
export async function getBudgetStatus(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
  const user = c.get('user');
  const env = c.env;

  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  const config = getBudgetConfig(env);
  const budgetKey = getBudgetKey(user.id);

  try {
    const budgetDataRaw = await env.KV.get(budgetKey);
    const budgetData: SessionBudget = budgetDataRaw
      ? JSON.parse(budgetDataRaw)
      : {
          totalCost: 0,
          requestCount: 0,
          lastUpdate: Date.now(),
          dailySpend: 0
        };

    return c.json({
      user_id: user.id,
      budget_config: config,
      current_usage: budgetData,
      remaining_budget: config.maxDailyBudget - budgetData.totalCost,
      utilization_percent: (budgetData.totalCost / config.maxDailyBudget) * 100
    });

  } catch (error) {
    console.error('Budget status error:', error);
    return c.json({ error: 'Failed to retrieve budget status' }, 500);
  }
}