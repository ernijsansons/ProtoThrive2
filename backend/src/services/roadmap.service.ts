/**
 * Roadmap Service
 * Business logic for roadmap operations
 *
 * Features:
 * - Roadmap CRUD operations
 * - Thrive score calculation
 * - Node/edge management
 * - Validation and authorization
 * - Statistics and analytics
 */

import { RoadmapRepository, Roadmap, RoadmapNode, RoadmapEdge } from '../repositories/roadmap.repository';
import { UserRepository } from '../repositories/user.repository';

interface CreateRoadmapInput {
  userId: string;
  tenantId?: string;
  title: string;
  description?: string;
  visibility?: 'private' | 'shared' | 'public';
  nodes?: RoadmapNode[];
  edges?: RoadmapEdge[];
  tags?: string[];
}

interface UpdateRoadmapInput {
  title?: string;
  description?: string;
  visibility?: 'private' | 'shared' | 'public';
  status?: 'draft' | 'active' | 'completed' | 'archived';
  nodes?: RoadmapNode[];
  edges?: RoadmapEdge[];
  tags?: string[];
}

interface ThriveScoreResult {
  score: number;
  completionPercentage: number;
  breakdown: {
    completedNodes: number;
    totalNodes: number;
    inProgressNodes: number;
    pendingNodes: number;
    complexityScore: number;
    velocityScore: number;
  };
}

export class RoadmapService {
  private roadmapRepository: RoadmapRepository;
  private userRepository: UserRepository;

  constructor(db: D1Database, cache?: KVNamespace) {
    this.roadmapRepository = new RoadmapRepository(db, cache);
    this.userRepository = new UserRepository(db, cache);
  }

  /**
   * Create a new roadmap
   */
  async createRoadmap(input: CreateRoadmapInput): Promise<Roadmap> {
    try {
      // Verify user exists
      const user = await this.userRepository.findById(input.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Validate title
      if (!input.title || input.title.trim().length === 0) {
        throw new Error('Roadmap title is required');
      }

      if (input.title.length > 200) {
        throw new Error('Roadmap title must be 200 characters or less');
      }

      // Validate nodes and edges
      const nodes = input.nodes || [];
      const edges = input.edges || [];

      this.validateNodesAndEdges(nodes, edges);

      // Create roadmap entity
      const roadmap = await this.roadmapRepository.create({
        user_id: input.userId,
        tenant_id: input.tenantId || user.tenant_id || null,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        status: 'draft',
        visibility: input.visibility || 'private',
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
        tags: input.tags ? JSON.stringify(input.tags) : null,
        thrive_score: null,
        completion_percentage: null,
        last_calculated_at: null,
        metadata: null,
      } as any);

      // Calculate initial thrive score if nodes exist
      if (nodes.length > 0) {
        await this.calculateAndUpdateThriveScore(roadmap.id);
      }

      return roadmap;
    } catch (error: any) {
      console.error('Create roadmap error:', error);
      throw error;
    }
  }

  /**
   * Get roadmap by ID with authorization check
   */
  async getRoadmap(roadmapId: string, userId: string): Promise<Roadmap | null> {
    try {
      const roadmap = await this.roadmapRepository.findById(roadmapId);

      if (!roadmap) {
        return null;
      }

      // Authorization check
      if (
        roadmap.user_id !== userId &&
        roadmap.visibility === 'private'
      ) {
        throw new Error('Unauthorized access to roadmap');
      }

      return roadmap;
    } catch (error: any) {
      console.error('Get roadmap error:', error);
      throw error;
    }
  }

  /**
   * Update roadmap
   */
  async updateRoadmap(
    roadmapId: string,
    userId: string,
    updates: UpdateRoadmapInput
  ): Promise<Roadmap> {
    try {
      // Get existing roadmap
      const existingRoadmap = await this.roadmapRepository.findById(roadmapId);

      if (!existingRoadmap) {
        throw new Error('Roadmap not found');
      }

      // Authorization check
      if (existingRoadmap.user_id !== userId) {
        throw new Error('Unauthorized to update this roadmap');
      }

      // Validate title if provided
      if (updates.title !== undefined) {
        if (!updates.title || updates.title.trim().length === 0) {
          throw new Error('Roadmap title is required');
        }
        if (updates.title.length > 200) {
          throw new Error('Roadmap title must be 200 characters or less');
        }
      }

      // Validate nodes and edges if provided
      if (updates.nodes || updates.edges) {
        const nodes = updates.nodes || JSON.parse(existingRoadmap.nodes);
        const edges = updates.edges || JSON.parse(existingRoadmap.edges);
        this.validateNodesAndEdges(nodes, edges);
      }

      // Build update object
      const updateData: any = {};

      if (updates.title !== undefined) {
        updateData.title = updates.title.trim();
      }

      if (updates.description !== undefined) {
        updateData.description = updates.description?.trim() || null;
      }

      if (updates.visibility !== undefined) {
        updateData.visibility = updates.visibility;
      }

      if (updates.status !== undefined) {
        updateData.status = updates.status;
      }

      if (updates.nodes !== undefined) {
        updateData.nodes = JSON.stringify(updates.nodes);
      }

      if (updates.edges !== undefined) {
        updateData.edges = JSON.stringify(updates.edges);
      }

      if (updates.tags !== undefined) {
        updateData.tags = JSON.stringify(updates.tags);
      }

      // Update roadmap
      await this.roadmapRepository.update(roadmapId, updateData);

      // Recalculate thrive score if nodes/edges changed
      if (updates.nodes || updates.edges) {
        await this.calculateAndUpdateThriveScore(roadmapId);
      }

      // Return updated roadmap
      const updatedRoadmap = await this.roadmapRepository.findById(roadmapId);
      return updatedRoadmap!;
    } catch (error: any) {
      console.error('Update roadmap error:', error);
      throw error;
    }
  }

  /**
   * Delete roadmap (soft delete)
   */
  async deleteRoadmap(roadmapId: string, userId: string): Promise<void> {
    try {
      const roadmap = await this.roadmapRepository.findById(roadmapId);

      if (!roadmap) {
        throw new Error('Roadmap not found');
      }

      // Authorization check
      if (roadmap.user_id !== userId) {
        throw new Error('Unauthorized to delete this roadmap');
      }

      await this.roadmapRepository.softDelete(roadmapId);
    } catch (error: any) {
      console.error('Delete roadmap error:', error);
      throw error;
    }
  }

  /**
   * List roadmaps for a user
   */
  async listUserRoadmaps(
    userId: string,
    options?: {
      status?: Roadmap['status'];
      limit?: number;
      offset?: number;
    }
  ): Promise<Roadmap[]> {
    try {
      return await this.roadmapRepository.findByUserId(userId, options);
    } catch (error: any) {
      console.error('List roadmaps error:', error);
      throw error;
    }
  }

  /**
   * Calculate thrive score for a roadmap
   */
  async calculateThriveScore(roadmapId: string): Promise<ThriveScoreResult> {
    try {
      const roadmap = await this.roadmapRepository.findById(roadmapId);

      if (!roadmap) {
        throw new Error('Roadmap not found');
      }

      const nodes: RoadmapNode[] = JSON.parse(roadmap.nodes);
      const edges: RoadmapEdge[] = JSON.parse(roadmap.edges);

      // Count node statuses
      const completedNodes = nodes.filter(
        (n) => n.data.status === 'completed'
      ).length;
      const inProgressNodes = nodes.filter(
        (n) => n.data.status === 'in-progress'
      ).length;
      const pendingNodes = nodes.filter(
        (n) => n.data.status === 'pending' || !n.data.status
      ).length;

      const totalNodes = nodes.length;

      // Calculate completion percentage
      const completionPercentage =
        totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0;

      // Calculate complexity score (based on node count and edge density)
      const edgeDensity =
        totalNodes > 1 ? edges.length / (totalNodes * (totalNodes - 1)) : 0;
      const complexityScore = Math.min(
        100,
        (totalNodes * 5 + edgeDensity * 50)
      );

      // Calculate velocity score (progress over time)
      // Higher score for roadmaps with progress
      const velocityScore =
        totalNodes > 0
          ? ((completedNodes + inProgressNodes * 0.5) / totalNodes) * 100
          : 0;

      // Calculate overall thrive score (weighted average)
      const thriveScore = Math.round(
        completionPercentage * 0.5 +
          complexityScore * 0.2 +
          velocityScore * 0.3
      );

      return {
        score: thriveScore,
        completionPercentage: Math.round(completionPercentage),
        breakdown: {
          completedNodes,
          totalNodes,
          inProgressNodes,
          pendingNodes,
          complexityScore: Math.round(complexityScore),
          velocityScore: Math.round(velocityScore),
        },
      };
    } catch (error: any) {
      console.error('Calculate thrive score error:', error);
      throw error;
    }
  }

  /**
   * Calculate and update thrive score in database
   */
  async calculateAndUpdateThriveScore(roadmapId: string): Promise<ThriveScoreResult> {
    try {
      const result = await this.calculateThriveScore(roadmapId);

      await this.roadmapRepository.updateThriveScore(
        roadmapId,
        result.score,
        result.completionPercentage
      );

      return result;
    } catch (error: any) {
      console.error('Update thrive score error:', error);
      throw error;
    }
  }

  /**
   * Get user roadmap statistics
   */
  async getUserStats(userId: string) {
    try {
      return await this.roadmapRepository.getUserStats(userId);
    } catch (error: any) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }

  /**
   * Search roadmaps
   */
  async searchRoadmaps(
    query: string,
    userId?: string,
    limit: number = 20
  ): Promise<Roadmap[]> {
    try {
      return await this.roadmapRepository.search(query, userId, limit);
    } catch (error: any) {
      console.error('Search roadmaps error:', error);
      throw error;
    }
  }

  /**
   * Get shared roadmaps
   */
  async getSharedRoadmaps(limit: number = 20): Promise<Roadmap[]> {
    try {
      return await this.roadmapRepository.findShared({ limit });
    } catch (error: any) {
      console.error('Get shared roadmaps error:', error);
      throw error;
    }
  }

  /**
   * Get trending roadmaps
   */
  async getTrendingRoadmaps(limit: number = 10): Promise<Roadmap[]> {
    try {
      return await this.roadmapRepository.getTrending(limit);
    } catch (error: any) {
      console.error('Get trending roadmaps error:', error);
      throw error;
    }
  }

  /**
   * Validate nodes and edges
   */
  private validateNodesAndEdges(nodes: RoadmapNode[], edges: RoadmapEdge[]): void {
    // Validate node count
    if (nodes.length > 500) {
      throw new Error('Maximum 500 nodes allowed per roadmap');
    }

    // Validate edge count
    if (edges.length > 1000) {
      throw new Error('Maximum 1000 edges allowed per roadmap');
    }

    // Create node ID set for edge validation
    const nodeIds = new Set(nodes.map((n) => n.id));

    // Validate edges reference existing nodes
    for (const edge of edges) {
      if (!nodeIds.has(edge.source)) {
        throw new Error(`Edge references non-existent source node: ${edge.source}`);
      }
      if (!nodeIds.has(edge.target)) {
        throw new Error(`Edge references non-existent target node: ${edge.target}`);
      }
    }

    // Validate node structure
    for (const node of nodes) {
      if (!node.id || typeof node.id !== 'string') {
        throw new Error('Node must have a valid id');
      }

      if (!node.type || typeof node.type !== 'string') {
        throw new Error(`Node ${node.id} must have a valid type`);
      }

      if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
        throw new Error(`Node ${node.id} must have valid position coordinates`);
      }

      if (!node.data || !node.data.label) {
        throw new Error(`Node ${node.id} must have data with a label`);
      }
    }
  }

  /**
   * Clone roadmap (create a copy)
   */
  async cloneRoadmap(roadmapId: string, userId: string, newTitle?: string): Promise<Roadmap> {
    try {
      const originalRoadmap = await this.getRoadmap(roadmapId, userId);

      if (!originalRoadmap) {
        throw new Error('Roadmap not found');
      }

      // Parse nodes and edges
      const nodes: RoadmapNode[] = JSON.parse(originalRoadmap.nodes);
      const edges: RoadmapEdge[] = JSON.parse(originalRoadmap.edges);
      const tags: string[] = originalRoadmap.tags
        ? JSON.parse(originalRoadmap.tags)
        : [];

      // Create cloned roadmap
      return await this.createRoadmap({
        userId,
        tenantId: originalRoadmap.tenant_id || undefined,
        title: newTitle || `${originalRoadmap.title} (Copy)`,
        description: originalRoadmap.description || undefined,
        visibility: 'private', // Always private by default
        nodes,
        edges,
        tags,
      });
    } catch (error: any) {
      console.error('Clone roadmap error:', error);
      throw error;
    }
  }

  /**
   * Archive completed roadmaps older than specified days
   */
  async archiveOldRoadmaps(daysOld: number = 90): Promise<number> {
    try {
      return await this.roadmapRepository.archiveOldRoadmaps(daysOld);
    } catch (error: any) {
      console.error('Archive old roadmaps error:', error);
      throw error;
    }
  }
}
