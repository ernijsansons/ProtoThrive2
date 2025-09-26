// Roadmap Business Logic Service
import { AppError, ErrorCode } from '../errors/AppError';
import logger from '../utils/logger';
import type { AuthUser } from '../middleware/auth';

export interface RoadmapData {
  id?: string;
  json_graph: string;
  status: 'draft' | 'active' | 'completed';
  vibe_mode: boolean;
  thrive_score: number;
  user_id?: string;
}

export class RoadmapService {
  constructor(private env: any) {}

  async createRoadmap(data: Omit<RoadmapData, 'id'>, user: AuthUser): Promise<RoadmapData> {
    try {
      // Validate JSON graph
      JSON.parse(data.json_graph);

      const roadmap: RoadmapData = {
        id: crypto.randomUUID(),
        ...data,
        user_id: user.id,
        thrive_score: 0.0
      };

      // Mock DB insert
      logger.business('Roadmap created', {
        roadmapId: roadmap.id,
        userId: user.id,
        vibeMode: data.vibe_mode
      });

      return roadmap;
    } catch (error) {
      throw AppError.validation('Invalid roadmap data');
    }
  }

  async getRoadmap(id: string, user: AuthUser): Promise<RoadmapData> {
    // Mock DB query with ownership check
    const mockRoadmap: RoadmapData = {
      id,
      json_graph: '{"nodes":[],"edges":[]}',
      status: 'draft',
      vibe_mode: true,
      thrive_score: 0.5,
      user_id: user.id
    };

    if (mockRoadmap.user_id !== user.id && user.role !== 'admin') {
      throw new AppError(ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS, 'Access denied', 403);
    }

    return mockRoadmap;
  }

  async updateRoadmap(id: string, updates: Partial<RoadmapData>, user: AuthUser): Promise<RoadmapData> {
    const existing = await this.getRoadmap(id, user);

    const updated = { ...existing, ...updates };

    logger.business('Roadmap updated', {
      roadmapId: id,
      userId: user.id,
      changes: Object.keys(updates)
    });

    return updated;
  }

  async deleteRoadmap(id: string, user: AuthUser): Promise<void> {
    await this.getRoadmap(id, user); // Check ownership

    logger.audit('Roadmap deleted', {
      roadmapId: id,
      userId: user.id
    });
  }
}