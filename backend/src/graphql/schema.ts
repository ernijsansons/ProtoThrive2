// Ref: CLAUDE.md - GraphQL Schema with Hardened Input Validation
// Enterprise-grade GraphQL API with Zod-validated input types

import { GraphQLError, ValidationRule } from 'graphql';
import { createYoga, createSchema } from 'graphql-yoga';
import { depthLimit } from 'graphql-depth-limit';
import { costAnalysis } from 'graphql-cost-analysis';
import { z } from 'zod';
import {
  validate,
  validateWithRateLimit,
  CreateRoadmapSchema,
  UpdateRoadmapSchema,
  CreateSnippetSchema,
  ListQuerySchema,
  UUIDSchema,
  ValidationError,
  globalRateLimiter,
  DEFAULT_VALIDATION_CONFIG
} from '../validation/hardened-validation';

// GraphQL security configuration
export interface GraphQLSecurityConfig {
  maxDepth: number;
  maxComplexity: number;
  maxAliases: number;
  timeoutMs: number;
  introspectionDisabled: boolean;
}

export const DEFAULT_GRAPHQL_SECURITY_CONFIG: GraphQLSecurityConfig = {
  maxDepth: 10,
  maxComplexity: 1000,
  maxAliases: 15,
  timeoutMs: 30000, // 30 seconds
  introspectionDisabled: true // Disable in production
};

// Custom validation rule for alias limiting
function createAliasLimitRule(maxAliases: number): ValidationRule {
  return (context) => {
    const aliases = new Set<string>();

    return {
      Field(node) {
        if (node.alias) {
          aliases.add(node.alias.value);
          if (aliases.size > maxAliases) {
            context.reportError(
              new GraphQLError(
                `Query exceeded maximum alias limit of ${maxAliases}`,
                { nodes: [node] }
              )
            );
          }
        }
      }
    };
  };
}

// Security logger for GraphQL operations
class GraphQLSecurityLogger {
  private static instance: GraphQLSecurityLogger;
  private suspiciousQueries = new Map<string, number>();

  static getInstance(): GraphQLSecurityLogger {
    if (!GraphQLSecurityLogger.instance) {
      GraphQLSecurityLogger.instance = new GraphQLSecurityLogger();
    }
    return GraphQLSecurityLogger.instance;
  }

  logSuspiciousQuery(query: string, reason: string, context: any): void {
    const queryHash = this.hashQuery(query);
    const count = this.suspiciousQueries.get(queryHash) || 0;
    this.suspiciousQueries.set(queryHash, count + 1);

    console.warn('GraphQL Security Alert:', {
      reason,
      queryHash,
      count: count + 1,
      userAgent: context.request?.headers?.get('user-agent'),
      ip: context.request?.headers?.get('x-forwarded-for') || 'unknown',
      timestamp: new Date().toISOString()
    });

    // Alert on repeated suspicious queries
    if (count + 1 > 5) {
      console.error('GraphQL Attack Pattern Detected:', {
        queryHash,
        count: count + 1,
        reason
      });
    }
  }

  private hashQuery(query: string): string {
    // Simple hash function for query identification
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}

// GraphQL type definitions
const typeDefs = /* GraphQL */ `
  # Node position in 3D space
  type Position {
    x: Float!
    y: Float!
    z: Float!
  }

  # Graph node
  type Node {
    id: String!
    label: String!
    status: NodeStatus!
    position: Position!
    type: NodeType!
    metadata: JSON
  }

  # Graph edge
  type Edge {
    id: String
    from: String!
    to: String!
    label: String
    type: EdgeType!
  }

  # Graph structure
  type Graph {
    nodes: [Node!]!
    edges: [Edge!]!
  }

  # Roadmap type
  type Roadmap {
    id: ID!
    user_id: String!
    json_graph: Graph!
    title: String!
    description: String
    status: RoadmapStatus!
    vibe_mode: Boolean!
    visibility: Visibility!
    thrive_score: Float!
    tags: [String!]
    created_at: String!
    updated_at: String!
  }

  # Snippet type
  type Snippet {
    id: ID!
    category: String!
    code: String!
    title: String!
    description: String
    language: Language
    ui_preview_url: String
    tags: [String!]
    version: Int!
    created_at: String!
  }

  # Pagination info
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    totalCount: Int!
  }

  # Roadmap connection
  type RoadmapConnection {
    edges: [RoadmapEdge!]!
    pageInfo: PageInfo!
  }

  # Roadmap edge
  type RoadmapEdge {
    cursor: String!
    node: Roadmap!
  }

  # Validation error details
  type ValidationErrorDetail {
    field: String!
    message: String!
    type: String!
  }

  # Operation result
  type MutationResult {
    success: Boolean!
    message: String!
    id: ID
    errors: [ValidationErrorDetail!]
  }

  # Enums
  enum NodeStatus {
    gray
    neon
    active
    completed
    failed
  }

  enum NodeType {
    default
    start
    end
    decision
    process
    ui
    code
    deploy
  }

  enum EdgeType {
    default
    success
    failure
    conditional
  }

  enum RoadmapStatus {
    draft
    active
    completed
    archived
  }

  enum Visibility {
    private
    public
    team
  }

  enum Language {
    javascript
    typescript
    python
    java
    go
    rust
    sql
    html
    css
  }

  enum SortField {
    created_at
    updated_at
    title
    thrive_score
  }

  enum SortOrder {
    asc
    desc
  }

  # Input types with strict validation

  input PositionInput {
    x: Float!
    y: Float!
    z: Float
  }

  input NodeInput {
    id: String!
    label: String!
    status: NodeStatus
    position: PositionInput!
    type: NodeType
    metadata: JSON
  }

  input EdgeInput {
    id: String
    from: String!
    to: String!
    label: String
    type: EdgeType
  }

  input GraphInput {
    nodes: [NodeInput!]!
    edges: [EdgeInput!]
  }

  input CreateRoadmapInput {
    json_graph: GraphInput!
    title: String!
    description: String
    vibe_mode: Boolean
    visibility: Visibility
    tags: [String!]
  }

  input UpdateRoadmapInput {
    json_graph: GraphInput
    title: String
    description: String
    status: RoadmapStatus
    vibe_mode: Boolean
    visibility: Visibility
    thrive_score: Float
    tags: [String!]
  }

  input CreateSnippetInput {
    category: String!
    code: String!
    title: String!
    description: String
    language: Language
    ui_preview_url: String
    tags: [String!]
  }

  input FilterInput {
    status: RoadmapStatus
    visibility: Visibility
    tags: [String!]
    search: String
  }

  input ListQueryInput {
    limit: Int
    offset: Int
    sort: SortField
    order: SortOrder
    filter: FilterInput
  }

  # Queries
  type Query {
    # Get a single roadmap by ID
    roadmap(id: ID!): Roadmap

    # List roadmaps with pagination and filtering
    roadmaps(query: ListQueryInput): RoadmapConnection!

    # Get a single snippet by ID
    snippet(id: ID!): Snippet

    # List snippets
    snippets(
      category: String
      limit: Int
      offset: Int
    ): [Snippet!]!

    # Get user's thrive score summary
    thriveScore: Float!

    # Health check
    health: String!
  }

  # Mutations
  type Mutation {
    # Create a new roadmap
    createRoadmap(input: CreateRoadmapInput!): Roadmap!

    # Update an existing roadmap
    updateRoadmap(
      id: ID!
      input: UpdateRoadmapInput!
    ): Roadmap!

    # Delete a roadmap
    deleteRoadmap(id: ID!): MutationResult!

    # Create a new snippet
    createSnippet(input: CreateSnippetInput!): Snippet!

    # Delete a snippet
    deleteSnippet(id: ID!): MutationResult!
  }

  # Custom scalar for JSON data
  scalar JSON
`;

// Enhanced validation helper for GraphQL resolvers with rate limiting
function validateInputSecure<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
  context: any,
  errorMessage: string
): T {
  const securityLogger = GraphQLSecurityLogger.getInstance();

  // Get user identifier for rate limiting
  const userIdentifier = context.user?.id ||
    context.request?.headers?.get('x-forwarded-for') ||
    'anonymous';

  // Use rate-limited validation
  const result = validateWithRateLimit(schema, input, userIdentifier);

  if (!result.success) {
    // Log suspicious validation failures
    if (result.error.statusCode === 429) {
      securityLogger.logSuspiciousQuery(
        JSON.stringify(input),
        'Rate limit exceeded',
        context
      );
    } else if (result.error.details.length > 5) {
      securityLogger.logSuspiciousQuery(
        JSON.stringify(input),
        'Multiple validation errors',
        context
      );
    }

    // Transform validation errors to GraphQL errors
    const details = result.error.details.map(d => ({
      field: d.field,
      message: d.message,
      type: d.type
    }));

    throw new GraphQLError(errorMessage, {
      extensions: {
        code: result.error.statusCode === 429 ? 'RATE_LIMITED' : 'VALIDATION_ERROR',
        details,
        http: { status: result.error.statusCode }
      }
    });
  }

  return result.data;
}

// Legacy validation helper (for backwards compatibility)
function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
  errorMessage: string
): T {
  const result = validate(schema, input);

  if (!result.success) {
    const details = result.error.details.map(d => ({
      field: d.field,
      message: d.message,
      type: d.type
    }));

    throw new GraphQLError(errorMessage, {
      extensions: {
        code: 'VALIDATION_ERROR',
        details,
        http: { status: 400 }
      }
    });
  }

  return result.data;
}

// Transform GraphQL input to match Zod schema
function transformGraphInput(input: any): any {
  if (!input) return input;

  // Handle json_graph transformation
  if (input.json_graph && typeof input.json_graph === 'object') {
    return {
      ...input,
      json_graph: input.json_graph
    };
  }

  return input;
}

// Resolvers with validation
export const resolvers = {
  Query: {
    roadmap: async (parent: any, args: { id: string }, context: any) => {
      // Validate ID format
      const validatedId = validateInput(
        UUIDSchema,
        args.id,
        'Invalid roadmap ID format'
      );

      // Fetch from database
      const roadmap = await context.db.getRoadmap(validatedId, context.user.id);

      if (!roadmap) {
        throw new GraphQLError('Roadmap not found', {
          extensions: {
            code: 'NOT_FOUND',
            http: { status: 404 }
          }
        });
      }

      return roadmap;
    },

    roadmaps: async (parent: any, args: { query?: any }, context: any) => {
      // Validate query parameters
      const validatedQuery = validateInput(
        ListQuerySchema,
        args.query || {},
        'Invalid query parameters'
      );

      // Fetch from database
      const roadmaps = await context.db.listRoadmaps(
        context.user.id,
        validatedQuery
      );

      // Build connection response
      return {
        edges: roadmaps.map((roadmap: any, index: number) => ({
          cursor: Buffer.from(`cursor:${validatedQuery.offset + index}`).toString('base64'),
          node: roadmap
        })),
        pageInfo: {
          hasNextPage: roadmaps.length === validatedQuery.limit,
          hasPreviousPage: validatedQuery.offset > 0,
          totalCount: roadmaps.length
        }
      };
    },

    snippet: async (parent: any, args: { id: string }, context: any) => {
      const validatedId = validateInput(
        UUIDSchema,
        args.id,
        'Invalid snippet ID format'
      );

      const snippet = await context.db.getSnippet(validatedId);

      if (!snippet) {
        throw new GraphQLError('Snippet not found', {
          extensions: {
            code: 'NOT_FOUND',
            http: { status: 404 }
          }
        });
      }

      return snippet;
    },

    snippets: async (parent: any, args: any, context: any) => {
      const query = {
        limit: args.limit || 10,
        offset: args.offset || 0,
        filter: args.category ? { category: args.category } : undefined
      };

      const validatedQuery = validateInput(
        ListQuerySchema.partial(),
        query,
        'Invalid query parameters'
      );

      return await context.db.listSnippets(validatedQuery);
    },

    thriveScore: async (parent: any, args: any, context: any) => {
      const score = await context.db.getUserThriveScore(context.user.id);
      return score || 0.0;
    },

    health: () => 'GraphQL API is healthy'
  },

  Mutation: {
    createRoadmap: async (parent: any, args: { input: any }, context: any) => {
      // Transform and validate input
      const transformedInput = transformGraphInput(args.input);
      const validatedInput = validateInput(
        CreateRoadmapSchema,
        transformedInput,
        'Invalid roadmap creation data'
      );

      try {
        // Create in database
        const roadmap = await context.db.createRoadmap(
          context.user.id,
          validatedInput
        );

        return roadmap;
      } catch (error: any) {
        throw new GraphQLError('Failed to create roadmap', {
          extensions: {
            code: 'INTERNAL_ERROR',
            details: error.message,
            http: { status: 500 }
          }
        });
      }
    },

    updateRoadmap: async (parent: any, args: { id: string; input: any }, context: any) => {
      // Validate ID
      const validatedId = validateInput(
        UUIDSchema,
        args.id,
        'Invalid roadmap ID format'
      );

      // Transform and validate input
      const transformedInput = transformGraphInput(args.input);
      const validatedInput = validateInput(
        UpdateRoadmapSchema,
        transformedInput,
        'Invalid roadmap update data'
      );

      try {
        // Check ownership
        const existing = await context.db.getRoadmap(validatedId, context.user.id);
        if (!existing) {
          throw new GraphQLError('Roadmap not found or access denied', {
            extensions: {
              code: 'FORBIDDEN',
              http: { status: 403 }
            }
          });
        }

        // Update in database
        const updated = await context.db.updateRoadmap(
          validatedId,
          context.user.id,
          validatedInput
        );

        return updated;
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;

        throw new GraphQLError('Failed to update roadmap', {
          extensions: {
            code: 'INTERNAL_ERROR',
            details: error.message,
            http: { status: 500 }
          }
        });
      }
    },

    deleteRoadmap: async (parent: any, args: { id: string }, context: any) => {
      const validatedId = validateInput(
        UUIDSchema,
        args.id,
        'Invalid roadmap ID format'
      );

      try {
        // Check ownership
        const existing = await context.db.getRoadmap(validatedId, context.user.id);
        if (!existing) {
          throw new GraphQLError('Roadmap not found or access denied', {
            extensions: {
              code: 'FORBIDDEN',
              http: { status: 403 }
            }
          });
        }

        // Soft delete
        await context.db.deleteRoadmap(validatedId, context.user.id);

        return {
          success: true,
          message: 'Roadmap deleted successfully',
          id: validatedId
        };
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;

        throw new GraphQLError('Failed to delete roadmap', {
          extensions: {
            code: 'INTERNAL_ERROR',
            details: error.message,
            http: { status: 500 }
          }
        });
      }
    },

    createSnippet: async (parent: any, args: { input: any }, context: any) => {
      const validatedInput = validateInput(
        CreateSnippetSchema,
        args.input,
        'Invalid snippet creation data'
      );

      try {
        const snippet = await context.db.createSnippet(validatedInput);
        return snippet;
      } catch (error: any) {
        throw new GraphQLError('Failed to create snippet', {
          extensions: {
            code: 'INTERNAL_ERROR',
            details: error.message,
            http: { status: 500 }
          }
        });
      }
    },

    deleteSnippet: async (parent: any, args: { id: string }, context: any) => {
      const validatedId = validateInput(
        UUIDSchema,
        args.id,
        'Invalid snippet ID format'
      );

      try {
        await context.db.deleteSnippet(validatedId);

        return {
          success: true,
          message: 'Snippet deleted successfully',
          id: validatedId
        };
      } catch (error: any) {
        throw new GraphQLError('Failed to delete snippet', {
          extensions: {
            code: 'INTERNAL_ERROR',
            details: error.message,
            http: { status: 500 }
          }
        });
      }
    }
  }
};

// Create GraphQL schema
export const schema = createSchema({
  typeDefs,
  resolvers
});

// Create Yoga instance with enhanced security plugins
export const createGraphQLServer = (config: any) => {
  const securityConfig = {
    ...DEFAULT_GRAPHQL_SECURITY_CONFIG,
    ...config.security
  };

  const validationRules = [
    // Depth limiting
    depthLimit(securityConfig.maxDepth),

    // Alias limiting
    createAliasLimitRule(securityConfig.maxAliases),
  ];

  // Add complexity analysis if available
  if (typeof costAnalysis === 'function') {
    try {
      validationRules.push(
        costAnalysis({
          maximumCost: securityConfig.maxComplexity,
          onComplete: (cost: number) => {
            if (cost > securityConfig.maxComplexity * 0.8) {
              console.warn(`High GraphQL query complexity: ${cost}`);
            }
          }
        })
      );
    } catch (error) {
      console.warn('Cost analysis plugin not available:', error);
    }
  }

  return createYoga({
    schema,
    validationRules,

    context: async ({ request }: any) => {
      const securityLogger = GraphQLSecurityLogger.getInstance();

      // Add user and database to context
      const user = config.getUser ? await config.getUser(request) : null;
      const db = config.database;

      if (!user) {
        // Log unauthenticated access attempts
        securityLogger.logSuspiciousQuery(
          'Unauthenticated access attempt',
          'Authentication required',
          { request }
        );

        throw new GraphQLError('Authentication required', {
          extensions: {
            code: 'UNAUTHENTICATED',
            http: { status: 401 }
          }
        });
      }

      return {
        user,
        db,
        request,
        securityLogger
      };
    },

    plugins: [
      // Request timeout plugin
      {
        onRequest: async ({ request, fetchAPI, endResponse }) => {
          const timeout = setTimeout(() => {
            console.error('GraphQL request timeout');
            endResponse(
              fetchAPI.Response.json(
                { error: 'Request timeout' },
                { status: 408 }
              )
            );
          }, securityConfig.timeoutMs);

          return {
            onResponse: () => clearTimeout(timeout)
          };
        }
      },

      // Security monitoring plugin
      {
        onParse: ({ params, setParsedDocument }) => {
          const securityLogger = GraphQLSecurityLogger.getInstance();

          // Check for suspicious patterns in queries
          const queryString = params.source.toString();

          // Detect potential GraphQL injection attacks
          if (queryString.includes('__schema') || queryString.includes('__type')) {
            if (securityConfig.introspectionDisabled && config.env === 'production') {
              securityLogger.logSuspiciousQuery(
                queryString,
                'Introspection attempt in production',
                { params }
              );

              throw new GraphQLError('Introspection disabled', {
                extensions: {
                  code: 'FORBIDDEN',
                  http: { status: 403 }
                }
              });
            }
          }

          // Detect overly complex nested queries
          const nestedBraceCount = (queryString.match(/\{/g) || []).length;
          if (nestedBraceCount > 50) {
            securityLogger.logSuspiciousQuery(
              queryString,
              'Overly complex nested query',
              { params, nestedBraceCount }
            );
          }

          // Detect repeated field patterns (possible DoS attempt)
          const fieldMatches = queryString.match(/\w+\s*\{/g) || [];
          const fieldCounts = new Map<string, number>();

          fieldMatches.forEach(field => {
            const fieldName = field.replace(/\s*\{/, '');
            fieldCounts.set(fieldName, (fieldCounts.get(fieldName) || 0) + 1);
          });

          for (const [field, count] of fieldCounts) {
            if (count > 10) {
              securityLogger.logSuspiciousQuery(
                queryString,
                `Repeated field pattern detected: ${field} appears ${count} times`,
                { params }
              );
            }
          }
        }
      }
    ],

    maskedErrors: config.env === 'production',
    logging: config.env !== 'production',

    // Disable introspection in production
    introspection: !securityConfig.introspectionDisabled || config.env !== 'production',

    // Enhanced error formatting
    formatError: (error) => {
      const securityLogger = GraphQLSecurityLogger.getInstance();

      // Log GraphQL errors for monitoring
      if (error.extensions?.code !== 'VALIDATION_ERROR') {
        console.error('GraphQL Error:', {
          message: error.message,
          code: error.extensions?.code,
          path: error.path,
          timestamp: new Date().toISOString()
        });
      }

      // Don't expose sensitive information in production
      if (config.env === 'production') {
        return {
          message: error.message,
          extensions: {
            code: error.extensions?.code || 'INTERNAL_ERROR'
          }
        };
      }

      return error;
    }
  });
};