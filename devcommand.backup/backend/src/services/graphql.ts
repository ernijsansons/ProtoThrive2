// GraphQL service
import { Hono } from 'hono';
import { graphqlServer } from '@hono/graphql-server';
import { buildSchema } from 'graphql';
import type { Env } from '../types/env';
import { formatError, ERROR_CODES } from '@devcommand/shared';

// GraphQL schema definition
const schema = buildSchema(`
  type User {
    id: ID!
    email: String!
    role: String!
    createdAt: String!
    updatedAt: String!
  }

  type Node {
    id: ID!
    type: String!
    position: Position!
    data: NodeData!
  }

  type Position {
    x: Float!
    y: Float!
    z: Float
  }

  type NodeData {
    label: String!
    status: String!
    templateMatch: String
    uiPreview: String
  }

  type Edge {
    id: ID!
    source: String!
    target: String!
    animated: Boolean
  }

  type RoadmapGraph {
    nodes: [Node!]!
    edges: [Edge!]!
  }

  type Roadmap {
    id: ID!
    userId: String!
    jsonGraph: RoadmapGraph!
    status: String!
    vibeMode: Boolean!
    thriveScore: Float!
    createdAt: String!
    updatedAt: String!
  }

  type AgentLog {
    id: ID!
    roadmapId: String!
    taskType: String!
    output: String
    status: String!
    tokenCount: Int!
    modelUsed: String
    timestamp: String!
  }

  type Insight {
    id: ID!
    roadmapId: String!
    type: String!
    data: String!
    score: Float!
    createdAt: String!
  }

  type Query {
    # User queries
    me: User

    # Roadmap queries
    roadmaps: [Roadmap!]!
    roadmap(id: ID!): Roadmap

    # Agent log queries
    agentLogs(roadmapId: ID!): [AgentLog!]!

    # Insight queries
    insights(roadmapId: ID!): [Insight!]!
  }

  type Mutation {
    # Roadmap mutations
    createRoadmap(vision: String!, vibeMode: Boolean): Roadmap!
    updateRoadmap(id: ID!, jsonGraph: String, status: String, vibeMode: Boolean): Roadmap!
    deleteRoadmap(id: ID!): Boolean!

    # Agent mutations
    triggerAgent(roadmapId: ID!, taskType: String!): AgentLog!
  }

  type Subscription {
    # Real-time updates
    roadmapUpdated(id: ID!): Roadmap!
    agentProgress(roadmapId: ID!): AgentLog!
  }
`);

// GraphQL resolvers
const rootResolver = {
  // Query resolvers
  me: async (args: unknown, context: unknown) => {
    const userId = context.userId;
    const user = await context.env.DB.prepare(
      'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL'
    )
      .bind(userId)
      .first();
    
    return user;
  },

  roadmaps: async (args: unknown, context: unknown) => {
    const userId = context.userId;
    const { results } = await context.env.DB.prepare(
      `SELECT * FROM roadmaps 
       WHERE user_id = ? AND deleted_at IS NULL 
       ORDER BY updated_at DESC`
    )
      .bind(userId)
      .all();

    return results.map((r: unknown) => ({
      ...r,
      jsonGraph: JSON.parse(r.json_graph),
      userId: r.user_id,
      vibeMode: Boolean(r.vibe_mode),
      thriveScore: r.thrive_score,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  roadmap: async (args: { id: string }, context: unknown) => {
    const userId = context.userId;
    const roadmap = await context.env.DB.prepare(
      `SELECT * FROM roadmaps 
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
      .bind(args.id, userId)
      .first();

    if (!roadmap) {
      throw new Error('Roadmap not found');
    }

    return {
      ...roadmap,
      jsonGraph: JSON.parse(roadmap.json_graph),
      userId: roadmap.user_id,
      vibeMode: Boolean(roadmap.vibe_mode),
      thriveScore: roadmap.thrive_score,
      createdAt: roadmap.created_at,
      updatedAt: roadmap.updated_at,
    };
  },

  agentLogs: async (args: { roadmapId: string }, context: unknown) => {
    const userId = context.userId;
    
    // Verify roadmap belongs to user
    const roadmap = await context.env.DB.prepare(
      'SELECT id FROM roadmaps WHERE id = ? AND user_id = ?'
    )
      .bind(args.roadmapId, userId)
      .first();

    if (!roadmap) {
      throw new Error('Roadmap not found');
    }

    const { results } = await context.env.DB.prepare(
      `SELECT * FROM agent_logs 
       WHERE roadmap_id = ? AND deleted_at IS NULL 
       ORDER BY timestamp DESC`
    )
      .bind(args.roadmapId)
      .all();

    return results.map((log: unknown) => ({
      ...log,
      roadmapId: log.roadmap_id,
      taskType: log.task_type,
      tokenCount: log.token_count,
      modelUsed: log.model_used,
    }));
  },

  insights: async (args: { roadmapId: string }, context: unknown) => {
    const userId = context.userId;
    
    // Verify roadmap belongs to user
    const roadmap = await context.env.DB.prepare(
      'SELECT id FROM roadmaps WHERE id = ? AND user_id = ?'
    )
      .bind(args.roadmapId, userId)
      .first();

    if (!roadmap) {
      throw new Error('Roadmap not found');
    }

    const { results } = await context.env.DB.prepare(
      `SELECT * FROM insights 
       WHERE roadmap_id = ? 
       ORDER BY created_at DESC`
    )
      .bind(args.roadmapId)
      .all();

    return results.map((insight: unknown) => ({
      ...insight,
      roadmapId: insight.roadmap_id,
      createdAt: insight.created_at,
    }));
  },

  // Mutation resolvers
  createRoadmap: async (args: { vision: string; vibeMode?: boolean }, context: unknown) => {
    // Implementation would be similar to REST endpoint
    // For brevity, returning a placeholder
    throw new Error('Not implemented - use REST API');
  },

  updateRoadmap: async (args: unknown, context: unknown) => {
    throw new Error('Not implemented - use REST API');
  },

  deleteRoadmap: async (args: { id: string }, context: unknown) => {
    throw new Error('Not implemented - use REST API');
  },

  triggerAgent: async (args: { roadmapId: string; taskType: string }, context: unknown) => {
    throw new Error('Not implemented - use REST API');
  },
};

export function createGraphQLRouter() {
  const app = new Hono<{ Bindings: Env }>();

  app.use(
    '/',
    graphqlServer({
      schema,
      rootResolver,
      graphiql: true, // Enable GraphiQL in development
    })
  );

  return app;
}