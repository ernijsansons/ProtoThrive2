// Billing service for Stripe integration
import { Hono } from 'hono';
import type { Env } from '../types/env';
import { 
  formatSuccess, 
  formatError, 
  ERROR_CODES, 
  generateId,
  SUBSCRIPTION_FEATURES,
  SUBSCRIPTION_TIERS,
} from '@devcommand/shared';
import { z } from 'zod';

// Request schemas
const CreateCheckoutSessionSchema = z.object({
  tier: z.enum(['free', 'pro', 'team', 'enterprise']),
  returnUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

const CreatePortalSessionSchema = z.object({
  returnUrl: z.string().url(),
});

const UpdatePaymentMethodSchema = z.object({
  paymentMethodId: z.string(),
});

// Stripe price IDs (would be stored in environment variables)
const STRIPE_PRICE_IDS = {
  pro: 'price_pro_monthly',
  team: 'price_team_monthly',
  enterprise: 'price_enterprise_monthly',
};

export function createBillingRouter() {
  const app = new Hono<{ Bindings: Env }>();

  // GET /api/billing/subscription - Get current subscription
  app.get('/subscription', async (c) => {
    const userId = c.get('userId');

    try {
      const subscription = await c.env.DB.prepare(
        `SELECT * FROM subscriptions 
         WHERE user_id = ? AND deleted_at IS NULL 
         ORDER BY created_at DESC 
         LIMIT 1`
      )
        .bind(userId)
        .first();

      if (!subscription) {
        // Return free tier if no subscription
        return c.json(formatSuccess({
          tier: 'free',
          status: 'active',
          features: SUBSCRIPTION_FEATURES.free,
        }));
      }

      // Get features for the tier
      const features = SUBSCRIPTION_FEATURES[subscription.tier as keyof typeof SUBSCRIPTION_FEATURES];

      return c.json(formatSuccess({
        id: subscription.id,
        userId: subscription.user_id,
        tier: subscription.tier,
        status: subscription.status,
        stripeCustomerId: subscription.stripe_customer_id,
        stripeSubscriptionId: subscription.stripe_subscription_id,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        features,
        createdAt: subscription.created_at,
        updatedAt: subscription.updated_at,
      }));
    } catch (error) {
      throw new Error('Failed to fetch subscription');
    }
  });

  // POST /api/billing/checkout - Create Stripe checkout session
  app.post('/checkout', async (c) => {
    const userId = c.get('userId');
    const userEmail = c.get('userEmail');
    const body = await c.req.json();

    // Validate request
    const validationResult = CreateCheckoutSessionSchema.safeParse(body);
    if (!validationResult.success) {
      return c.json(
        formatError(ERROR_CODES.INVALID_INPUT, 'Invalid request data', {
          errors: validationResult.error.errors,
        }),
        400
      );
    }

    const { tier, returnUrl, cancelUrl } = validationResult.data;

    if (tier === 'free') {
      return c.json(
        formatError(ERROR_CODES.INVALID_INPUT, 'Cannot create checkout for free tier'),
        400
      );
    }

    try {
      // Check if user already has an active subscription
      const existingSubscription = await c.env.DB.prepare(
        'SELECT * FROM subscriptions WHERE user_id = ? AND status = "active"'
      )
        .bind(userId)
        .first();

      if (existingSubscription) {
        return c.json(
          formatError(ERROR_CODES.INVALID_INPUT, 'User already has an active subscription'),
          400
        );
      }

      // Create Stripe checkout session
      const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'payment_method_types[]': 'card',
          'line_items[0][price]': STRIPE_PRICE_IDS[tier as keyof typeof STRIPE_PRICE_IDS],
          'line_items[0][quantity]': '1',
          'mode': 'subscription',
          'success_url': returnUrl,
          'cancel_url': cancelUrl,
          'customer_email': userEmail,
          'metadata[user_id]': userId,
          'metadata[tier]': tier,
        }),
      });

      if (!stripeResponse.ok) {
        const error = await stripeResponse.text();
        console.error('Stripe error:', error);
        throw new Error('Failed to create checkout session');
      }

      const session = await stripeResponse.json();

      return c.json(formatSuccess({
        checkoutUrl: session.url,
        sessionId: session.id,
      }));
    } catch (error) {
      console.error('Checkout error:', error);
      throw new Error('Failed to create checkout session');
    }
  });

  // POST /api/billing/portal - Create Stripe customer portal session
  app.post('/portal', async (c) => {
    const userId = c.get('userId');
    const body = await c.req.json();

    // Validate request
    const validationResult = CreatePortalSessionSchema.safeParse(body);
    if (!validationResult.success) {
      return c.json(
        formatError(ERROR_CODES.INVALID_INPUT, 'Invalid request data', {
          errors: validationResult.error.errors,
        }),
        400
      );
    }

    const { returnUrl } = validationResult.data;

    try {
      // Get user's subscription
      const subscription = await c.env.DB.prepare(
        'SELECT stripe_customer_id FROM subscriptions WHERE user_id = ? AND status = "active"'
      )
        .bind(userId)
        .first();

      if (!subscription || !subscription.stripe_customer_id) {
        return c.json(
          formatError(ERROR_CODES.NOT_FOUND, 'No active subscription found'),
          404
        );
      }

      // Create Stripe portal session
      const stripeResponse = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'customer': subscription.stripe_customer_id as string,
          'return_url': returnUrl,
        }),
      });

      if (!stripeResponse.ok) {
        throw new Error('Failed to create portal session');
      }

      const session = await stripeResponse.json();

      return c.json(formatSuccess({
        portalUrl: session.url,
      }));
    } catch (error) {
      throw new Error('Failed to create portal session');
    }
  });

  // GET /api/billing/usage - Get usage statistics
  app.get('/usage', async (c) => {
    const userId = c.get('userId');

    try {
      // Get current billing period
      const subscription = await c.env.DB.prepare(
        'SELECT current_period_start, current_period_end, tier FROM subscriptions WHERE user_id = ? AND status = "active"'
      )
        .bind(userId)
        .first();

      const tier = subscription?.tier || 'free';
      const periodStart = subscription?.current_period_start || new Date().toISOString();
      const periodEnd = subscription?.current_period_end || new Date().toISOString();

      // Get usage counts
      const [roadmapCount, agentTaskCount, apiCallCount] = await Promise.all([
        // Roadmap count
        c.env.DB.prepare(
          'SELECT COUNT(*) as count FROM roadmaps WHERE user_id = ? AND deleted_at IS NULL'
        )
          .bind(userId)
          .first(),

        // Agent task count for current period
        c.env.DB.prepare(
          `SELECT COUNT(*) as count 
           FROM agent_logs al
           JOIN roadmaps r ON al.roadmap_id = r.id
           WHERE r.user_id = ? AND al.timestamp >= ? AND al.timestamp <= ?`
        )
          .bind(userId, periodStart, periodEnd)
          .first(),

        // API call count (would be tracked separately)
        Promise.resolve({ count: 0 }), // Placeholder
      ]);

      const features = SUBSCRIPTION_FEATURES[tier as keyof typeof SUBSCRIPTION_FEATURES];

      return c.json(formatSuccess({
        tier,
        periodStart,
        periodEnd,
        usage: {
          roadmaps: {
            used: roadmapCount?.count || 0,
            limit: features.maxRoadmaps,
          },
          agentTasks: {
            used: agentTaskCount?.count || 0,
            limit: features.maxAgentTasks,
          },
          apiCalls: {
            used: apiCallCount?.count || 0,
            limit: features.maxApiCalls,
          },
        },
        features,
      }));
    } catch (error) {
      throw new Error('Failed to fetch usage statistics');
    }
  });

  // POST /api/billing/cancel - Cancel subscription
  app.post('/cancel', async (c) => {
    const userId = c.get('userId');

    try {
      const subscription = await c.env.DB.prepare(
        'SELECT * FROM subscriptions WHERE user_id = ? AND status = "active"'
      )
        .bind(userId)
        .first();

      if (!subscription || !subscription.stripe_subscription_id) {
        return c.json(
          formatError(ERROR_CODES.NOT_FOUND, 'No active subscription found'),
          404
        );
      }

      // Cancel subscription at period end in Stripe
      const stripeResponse = await fetch(
        `https://api.stripe.com/v1/subscriptions/${subscription.stripe_subscription_id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${c.env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            'cancel_at_period_end': 'true',
          }),
        }
      );

      if (!stripeResponse.ok) {
        throw new Error('Failed to cancel subscription');
      }

      // Update local database
      await c.env.DB.prepare(
        `UPDATE subscriptions 
         SET status = 'canceling', updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`
      )
        .bind(subscription.id)
        .run();

      return c.json(formatSuccess({
        message: 'Subscription will be canceled at the end of the current period',
        cancelAt: subscription.current_period_end,
      }));
    } catch (error) {
      throw new Error('Failed to cancel subscription');
    }
  });

  // POST /api/billing/reactivate - Reactivate canceled subscription
  app.post('/reactivate', async (c) => {
    const userId = c.get('userId');

    try {
      const subscription = await c.env.DB.prepare(
        'SELECT * FROM subscriptions WHERE user_id = ? AND status = "canceling"'
      )
        .bind(userId)
        .first();

      if (!subscription || !subscription.stripe_subscription_id) {
        return c.json(
          formatError(ERROR_CODES.NOT_FOUND, 'No canceling subscription found'),
          404
        );
      }

      // Reactivate subscription in Stripe
      const stripeResponse = await fetch(
        `https://api.stripe.com/v1/subscriptions/${subscription.stripe_subscription_id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${c.env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            'cancel_at_period_end': 'false',
          }),
        }
      );

      if (!stripeResponse.ok) {
        throw new Error('Failed to reactivate subscription');
      }

      // Update local database
      await c.env.DB.prepare(
        `UPDATE subscriptions 
         SET status = 'active', updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`
      )
        .bind(subscription.id)
        .run();

      return c.json(formatSuccess({
        message: 'Subscription reactivated successfully',
      }));
    } catch (error) {
      throw new Error('Failed to reactivate subscription');
    }
  });

  return app;
}