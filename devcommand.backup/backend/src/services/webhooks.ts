// Webhooks service for external integrations
import { Hono } from 'hono';
import type { Env } from '../types/env';
import { formatSuccess, formatError, ERROR_CODES, extractMetadataFromDiff } from '@devcommand/shared';
import { z } from 'zod';

// Webhook validation schemas
const GitHubWebhookSchema = z.object({
  event_type: z.enum(['push', 'pull_request', 'issue']),
  repository: z.object({
    full_name: z.string(),
    html_url: z.string(),
  }),
  sender: z.object({
    login: z.string(),
  }),
  // We don't validate the entire payload, just what we need
});

const StripeWebhookSchema = z.object({
  type: z.string(),
  data: z.object({
    object: z.record(z.unknown()),
  }),
});

export function createWebhooksRouter() {
  const app = new Hono<{ Bindings: Env }>();

  // GitHub webhook endpoint
  app.post('/github', async (c) => {
    const signature = c.req.header('X-Hub-Signature-256');
    const event = c.req.header('X-GitHub-Event');
    
    if (!signature || !event) {
      return c.json(
        formatError(ERROR_CODES.INVALID_INPUT, 'Missing required headers'),
        400
      );
    }

    try {
      const body = await c.req.json();
      
      // Verify webhook signature
      // TODO: Implement HMAC verification with GITHUB_WEBHOOK_SECRET
      
      // Process based on event type
      switch (event) {
        case 'push':
          await handleGitHubPush(c, body);
          break;
        case 'pull_request':
          await handleGitHubPullRequest(c, body);
          break;
        default:
          console.log(`Unhandled GitHub event: ${event}`);
      }

      return c.json(formatSuccess({ received: true }));
    } catch (error) {
      console.error('GitHub webhook error:', error);
      throw new Error('Failed to process GitHub webhook');
    }
  });

  // Stripe webhook endpoint
  app.post('/stripe', async (c) => {
    const signature = c.req.header('Stripe-Signature');
    
    if (!signature) {
      return c.json(
        formatError(ERROR_CODES.INVALID_INPUT, 'Missing Stripe signature'),
        400
      );
    }

    try {
      const body = await c.req.text();
      
      // Verify webhook signature
      // TODO: Implement Stripe signature verification
      
      const event = JSON.parse(body);
      const validationResult = StripeWebhookSchema.safeParse(event);
      
      if (!validationResult.success) {
        throw new Error('Invalid webhook payload');
      }

      // Process based on event type
      switch (event.type) {
        case 'checkout.session.completed':
          await handleStripeCheckoutCompleted(c, event);
          break;
        case 'customer.subscription.updated':
          await handleStripeSubscriptionUpdated(c, event);
          break;
        case 'customer.subscription.deleted':
          await handleStripeSubscriptionDeleted(c, event);
          break;
        default:
          console.log(`Unhandled Stripe event: ${event.type}`);
      }

      return c.json(formatSuccess({ received: true }));
    } catch (error) {
      console.error('Stripe webhook error:', error);
      throw new Error('Failed to process Stripe webhook');
    }
  });

  // n8n webhook endpoint for workflow triggers
  app.post('/n8n/:workflowId', async (c) => {
    const workflowId = c.req.param('workflowId');
    const apiKey = c.req.header('X-N8N-API-Key');
    
    if (apiKey !== c.env.N8N_API_KEY) {
      return c.json(
        formatError(ERROR_CODES.UNAUTHORIZED, 'Invalid API key'),
        401
      );
    }

    try {
      const body = await c.req.json();
      
      // Process n8n workflow webhook
      await handleN8NWorkflow(c, workflowId, body);
      
      return c.json(formatSuccess({ processed: true }));
    } catch (error) {
      console.error('n8n webhook error:', error);
      throw new Error('Failed to process n8n webhook');
    }
  });

  // Vercel deployment webhook
  app.post('/vercel', async (c) => {
    const signature = c.req.header('X-Vercel-Signature');
    
    if (!signature) {
      return c.json(
        formatError(ERROR_CODES.INVALID_INPUT, 'Missing Vercel signature'),
        400
      );
    }

    try {
      const body = await c.req.json();
      
      // Process deployment event
      if (body.type === 'deployment' && body.payload?.state === 'READY') {
        await handleVercelDeployment(c, body);
      }
      
      return c.json(formatSuccess({ received: true }));
    } catch (error) {
      console.error('Vercel webhook error:', error);
      throw new Error('Failed to process Vercel webhook');
    }
  });

  return app;
}

// Handler functions
async function handleGitHubPush(c: Context<{ Bindings: Env }>, payload: unknown) {
  // Extract metadata from the push event
  const metadata = {
    repository: payload.repository?.full_name,
    branch: payload.ref?.replace('refs/heads/', ''),
    commits: payload.commits?.length || 0,
    pusher: payload.pusher?.name,
  };

  // Find associated roadmap by repository
  // TODO: Implement repository-to-roadmap mapping

  // Log the event
  console.log('GitHub push event:', metadata);

  // Trigger agent to process the changes
  // TODO: Queue agent task for processing
}

async function handleGitHubPullRequest(c: Context<{ Bindings: Env }>, payload: unknown) {
  const metadata = {
    repository: payload.repository?.full_name,
    action: payload.action,
    number: payload.number,
    title: payload.pull_request?.title,
    state: payload.pull_request?.state,
  };

  console.log('GitHub PR event:', metadata);
  
  // TODO: Update roadmap status based on PR events
}

async function handleStripeCheckoutCompleted(c: Context<{ Bindings: Env }>, event: unknown) {
  const session = event.data.object;
  const customerId = session.customer;
  const subscriptionId = session.subscription;
  
  // Update user's subscription in database
  // TODO: Map Stripe customer to user and update subscription
  
  console.log('Stripe checkout completed:', { customerId, subscriptionId });
}

async function handleStripeSubscriptionUpdated(c: Context<{ Bindings: Env }>, event: unknown) {
  const subscription = event.data.object;
  
  // Update subscription status
  await c.env.DB.prepare(
    `UPDATE subscriptions 
     SET status = ?, current_period_start = ?, current_period_end = ?, updated_at = CURRENT_TIMESTAMP
     WHERE stripe_subscription_id = ?`
  )
    .bind(
      subscription.status,
      new Date(subscription.current_period_start * 1000).toISOString(),
      new Date(subscription.current_period_end * 1000).toISOString(),
      subscription.id
    )
    .run();
}

async function handleStripeSubscriptionDeleted(c: Context<{ Bindings: Env }>, event: unknown) {
  const subscription = event.data.object;
  
  // Cancel subscription in database
  await c.env.DB.prepare(
    `UPDATE subscriptions 
     SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
     WHERE stripe_subscription_id = ?`
  )
    .bind(subscription.id)
    .run();
}

async function handleN8NWorkflow(c: Context<{ Bindings: Env }>, workflowId: string, data: unknown) {
  console.log('n8n workflow triggered:', { workflowId, data });
  
  // Process workflow results
  if (data.agentResults) {
    // Store agent execution results
    // TODO: Update roadmap and agent logs
  }
}

async function handleVercelDeployment(c: Context<{ Bindings: Env }>, payload: unknown) {
  const deployment = payload.payload;
  
  console.log('Vercel deployment ready:', {
    url: deployment.url,
    projectName: deployment.name,
  });
  
  // Update roadmap status
  // TODO: Find associated roadmap and update deployment status
}