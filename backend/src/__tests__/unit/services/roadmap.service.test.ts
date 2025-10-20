/**
 * RoadmapService Unit Tests
 * Tests for roadmap business logic
 */

import { RoadmapService } from '../../../services/roadmap.service';
import { RoadmapRepository } from '../../../repositories/roadmap.repository';
import { UserRepository } from '../../../repositories/user.repository';

// Mock repositories
jest.mock('../../../repositories/roadmap.repository');
jest.mock('../../../repositories/user.repository');

describe('RoadmapService', () => {
  let roadmapService: RoadmapService;
  let mockDb: D1Database;
  let mockCache: KVNamespace;
  let mockRoadmapRepo: jest.Mocked<RoadmapRepository>;
  let mockUserRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    // Create mock database and cache
    mockDb = {} as D1Database;
    mockCache = {} as KVNamespace;

    // Create service
    roadmapService = new RoadmapService(mockDb, mockCache);

    // Get mocked repository instances
    mockRoadmapRepo = (roadmapService as any).roadmapRepository;
    mockUserRepo = (roadmapService as any).userRepository;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRoadmap', () => {
    it('should create a roadmap successfully', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        tenant_id: 'tenant_123',
      };

      const input = {
        userId: 'user_123',
        title: 'Test Roadmap',
        description: 'Test description',
        nodes: [
          {
            id: 'node_1',
            type: 'default',
            position: { x: 0, y: 0 },
            data: { label: 'Start' },
          },
        ],
        edges: [],
      };

      const mockRoadmap = {
        id: 'roadmap_123',
        user_id: 'user_123',
        tenant_id: 'tenant_123',
        title: 'Test Roadmap',
        description: 'Test description',
        status: 'draft',
        visibility: 'private',
        nodes: JSON.stringify(input.nodes),
        edges: JSON.stringify(input.edges),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      mockRoadmapRepo.create.mockResolvedValue(mockRoadmap as any);

      const result = await roadmapService.createRoadmap(input);

      expect(result).toEqual(mockRoadmap);
      expect(mockUserRepo.findById).toHaveBeenCalledWith('user_123');
      expect(mockRoadmapRepo.create).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(
        roadmapService.createRoadmap({
          userId: 'invalid_user',
          title: 'Test',
        })
      ).rejects.toThrow('User not found');
    });

    it('should throw error if title is empty', async () => {
      mockUserRepo.findById.mockResolvedValue({ id: 'user_123' } as any);

      await expect(
        roadmapService.createRoadmap({
          userId: 'user_123',
          title: '   ',
        })
      ).rejects.toThrow('Roadmap title is required');
    });

    it('should throw error if title is too long', async () => {
      mockUserRepo.findById.mockResolvedValue({ id: 'user_123' } as any);

      await expect(
        roadmapService.createRoadmap({
          userId: 'user_123',
          title: 'a'.repeat(201),
        })
      ).rejects.toThrow('Roadmap title must be 200 characters or less');
    });

    it('should validate nodes and edges', async () => {
      mockUserRepo.findById.mockResolvedValue({ id: 'user_123' } as any);

      // Invalid edge referencing non-existent node
      await expect(
        roadmapService.createRoadmap({
          userId: 'user_123',
          title: 'Test',
          nodes: [
            {
              id: 'node_1',
              type: 'default',
              position: { x: 0, y: 0 },
              data: { label: 'Node 1' },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'node_1', target: 'node_2' }, // node_2 doesn't exist
          ],
        })
      ).rejects.toThrow('Edge references non-existent target node');
    });

    it('should throw error if too many nodes', async () => {
      mockUserRepo.findById.mockResolvedValue({ id: 'user_123' } as any);

      const nodes = Array.from({ length: 501 }, (_, i) => ({
        id: `node_${i}`,
        type: 'default',
        position: { x: 0, y: 0 },
        data: { label: `Node ${i}` },
      }));

      await expect(
        roadmapService.createRoadmap({
          userId: 'user_123',
          title: 'Test',
          nodes,
        })
      ).rejects.toThrow('Maximum 500 nodes allowed per roadmap');
    });
  });

  describe('getRoadmap', () => {
    it('should return roadmap if user is owner', async () => {
      const mockRoadmap = {
        id: 'roadmap_123',
        user_id: 'user_123',
        visibility: 'private',
      };

      mockRoadmapRepo.findById.mockResolvedValue(mockRoadmap as any);

      const result = await roadmapService.getRoadmap('roadmap_123', 'user_123');

      expect(result).toEqual(mockRoadmap);
    });

    it('should return shared roadmap for non-owner', async () => {
      const mockRoadmap = {
        id: 'roadmap_123',
        user_id: 'user_123',
        visibility: 'shared',
      };

      mockRoadmapRepo.findById.mockResolvedValue(mockRoadmap as any);

      const result = await roadmapService.getRoadmap('roadmap_123', 'user_456');

      expect(result).toEqual(mockRoadmap);
    });

    it('should throw error if accessing private roadmap of another user', async () => {
      const mockRoadmap = {
        id: 'roadmap_123',
        user_id: 'user_123',
        visibility: 'private',
      };

      mockRoadmapRepo.findById.mockResolvedValue(mockRoadmap as any);

      await expect(
        roadmapService.getRoadmap('roadmap_123', 'user_456')
      ).rejects.toThrow('Unauthorized access to roadmap');
    });

    it('should return null if roadmap not found', async () => {
      mockRoadmapRepo.findById.mockResolvedValue(null);

      const result = await roadmapService.getRoadmap('invalid', 'user_123');

      expect(result).toBeNull();
    });
  });

  describe('calculateThriveScore', () => {
    it('should calculate thrive score correctly', async () => {
      const mockRoadmap = {
        id: 'roadmap_123',
        nodes: JSON.stringify([
          {
            id: 'node_1',
            type: 'default',
            position: { x: 0, y: 0 },
            data: { label: 'Node 1', status: 'completed' },
          },
          {
            id: 'node_2',
            type: 'default',
            position: { x: 0, y: 0 },
            data: { label: 'Node 2', status: 'in-progress' },
          },
          {
            id: 'node_3',
            type: 'default',
            position: { x: 0, y: 0 },
            data: { label: 'Node 3', status: 'pending' },
          },
        ]),
        edges: JSON.stringify([]),
      };

      mockRoadmapRepo.findById.mockResolvedValue(mockRoadmap as any);

      const result = await roadmapService.calculateThriveScore('roadmap_123');

      expect(result.breakdown.totalNodes).toBe(3);
      expect(result.breakdown.completedNodes).toBe(1);
      expect(result.breakdown.inProgressNodes).toBe(1);
      expect(result.breakdown.pendingNodes).toBe(1);
      expect(result.completionPercentage).toBe(33); // 1/3 * 100 rounded
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should handle empty roadmap', async () => {
      const mockRoadmap = {
        id: 'roadmap_123',
        nodes: JSON.stringify([]),
        edges: JSON.stringify([]),
      };

      mockRoadmapRepo.findById.mockResolvedValue(mockRoadmap as any);

      const result = await roadmapService.calculateThriveScore('roadmap_123');

      expect(result.completionPercentage).toBe(0);
      expect(result.breakdown.totalNodes).toBe(0);
    });

    it('should throw error if roadmap not found', async () => {
      mockRoadmapRepo.findById.mockResolvedValue(null);

      await expect(
        roadmapService.calculateThriveScore('invalid')
      ).rejects.toThrow('Roadmap not found');
    });
  });

  describe('updateRoadmap', () => {
    it('should update roadmap successfully', async () => {
      const mockExistingRoadmap = {
        id: 'roadmap_123',
        user_id: 'user_123',
        title: 'Old Title',
        nodes: JSON.stringify([]),
        edges: JSON.stringify([]),
      };

      const mockUpdatedRoadmap = {
        ...mockExistingRoadmap,
        title: 'New Title',
      };

      mockRoadmapRepo.findById
        .mockResolvedValueOnce(mockExistingRoadmap as any)
        .mockResolvedValueOnce(mockUpdatedRoadmap as any);
      mockRoadmapRepo.update.mockResolvedValue(undefined);

      const result = await roadmapService.updateRoadmap(
        'roadmap_123',
        'user_123',
        { title: 'New Title' }
      );

      expect(result.title).toBe('New Title');
      expect(mockRoadmapRepo.update).toHaveBeenCalled();
    });

    it('should throw error if user is not owner', async () => {
      const mockRoadmap = {
        id: 'roadmap_123',
        user_id: 'user_123',
      };

      mockRoadmapRepo.findById.mockResolvedValue(mockRoadmap as any);

      await expect(
        roadmapService.updateRoadmap('roadmap_123', 'user_456', {
          title: 'New Title',
        })
      ).rejects.toThrow('Unauthorized to update this roadmap');
    });

    it('should throw error if roadmap not found', async () => {
      mockRoadmapRepo.findById.mockResolvedValue(null);

      await expect(
        roadmapService.updateRoadmap('invalid', 'user_123', {
          title: 'New Title',
        })
      ).rejects.toThrow('Roadmap not found');
    });
  });

  describe('deleteRoadmap', () => {
    it('should delete roadmap successfully', async () => {
      const mockRoadmap = {
        id: 'roadmap_123',
        user_id: 'user_123',
      };

      mockRoadmapRepo.findById.mockResolvedValue(mockRoadmap as any);
      mockRoadmapRepo.delete.mockResolvedValue(undefined);

      await roadmapService.deleteRoadmap('roadmap_123', 'user_123');

      expect(mockRoadmapRepo.delete).toHaveBeenCalledWith('roadmap_123');
    });

    it('should throw error if user is not owner', async () => {
      const mockRoadmap = {
        id: 'roadmap_123',
        user_id: 'user_123',
      };

      mockRoadmapRepo.findById.mockResolvedValue(mockRoadmap as any);

      await expect(
        roadmapService.deleteRoadmap('roadmap_123', 'user_456')
      ).rejects.toThrow('Unauthorized to delete this roadmap');
    });
  });

  describe('cloneRoadmap', () => {
    it('should clone roadmap successfully', async () => {
      const mockOriginalRoadmap = {
        id: 'roadmap_123',
        user_id: 'user_123',
        tenant_id: 'tenant_123',
        title: 'Original Roadmap',
        description: 'Original description',
        visibility: 'private',
        nodes: JSON.stringify([
          {
            id: 'node_1',
            type: 'default',
            position: { x: 0, y: 0 },
            data: { label: 'Node 1' },
          },
        ]),
        edges: JSON.stringify([]),
        tags: JSON.stringify(['tag1', 'tag2']),
      };

      const mockClonedRoadmap = {
        ...mockOriginalRoadmap,
        id: 'roadmap_456',
        title: 'Original Roadmap (Copy)',
      };

      mockRoadmapRepo.findById.mockResolvedValue(mockOriginalRoadmap as any);
      mockUserRepo.findById.mockResolvedValue({ id: 'user_123' } as any);
      mockRoadmapRepo.create.mockResolvedValue(mockClonedRoadmap as any);

      const result = await roadmapService.cloneRoadmap('roadmap_123', 'user_123');

      expect(result.title).toBe('Original Roadmap (Copy)');
      expect(mockRoadmapRepo.create).toHaveBeenCalled();
    });

    it('should use custom title for cloned roadmap', async () => {
      const mockOriginalRoadmap = {
        id: 'roadmap_123',
        user_id: 'user_123',
        title: 'Original',
        nodes: JSON.stringify([]),
        edges: JSON.stringify([]),
      };

      mockRoadmapRepo.findById.mockResolvedValue(mockOriginalRoadmap as any);
      mockUserRepo.findById.mockResolvedValue({ id: 'user_123' } as any);
      mockRoadmapRepo.create.mockResolvedValue({
        ...mockOriginalRoadmap,
        title: 'Custom Title',
      } as any);

      const result = await roadmapService.cloneRoadmap(
        'roadmap_123',
        'user_123',
        'Custom Title'
      );

      expect(result.title).toBe('Custom Title');
    });
  });

  describe('listUserRoadmaps', () => {
    it('should list user roadmaps', async () => {
      const mockRoadmaps = [
        { id: 'roadmap_1', title: 'Roadmap 1' },
        { id: 'roadmap_2', title: 'Roadmap 2' },
      ];

      mockRoadmapRepo.findByUserId.mockResolvedValue(mockRoadmaps as any);

      const result = await roadmapService.listUserRoadmaps('user_123');

      expect(result).toEqual(mockRoadmaps);
      expect(mockRoadmapRepo.findByUserId).toHaveBeenCalledWith('user_123', undefined);
    });

    it('should filter by status', async () => {
      const mockRoadmaps = [{ id: 'roadmap_1', status: 'active' }];

      mockRoadmapRepo.findByUserId.mockResolvedValue(mockRoadmaps as any);

      await roadmapService.listUserRoadmaps('user_123', { status: 'active' });

      expect(mockRoadmapRepo.findByUserId).toHaveBeenCalledWith('user_123', {
        status: 'active',
      });
    });
  });

  describe('searchRoadmaps', () => {
    it('should search roadmaps by query', async () => {
      const mockResults = [{ id: 'roadmap_1', title: 'Test Roadmap' }];

      mockRoadmapRepo.search.mockResolvedValue(mockResults as any);

      const result = await roadmapService.searchRoadmaps('test', 'user_123');

      expect(result).toEqual(mockResults);
      expect(mockRoadmapRepo.search).toHaveBeenCalledWith('test', 'user_123', 20);
    });

    it('should use custom limit', async () => {
      mockRoadmapRepo.search.mockResolvedValue([]);

      await roadmapService.searchRoadmaps('test', 'user_123', 50);

      expect(mockRoadmapRepo.search).toHaveBeenCalledWith('test', 'user_123', 50);
    });
  });

  describe('getUserStats', () => {
    it('should return user roadmap statistics', async () => {
      const mockStats = {
        total: 10,
        draft: 2,
        active: 5,
        completed: 3,
        archived: 0,
        avgThriveScore: 75,
        avgCompletion: 65,
      };

      mockRoadmapRepo.getUserStats.mockResolvedValue(mockStats);

      const result = await roadmapService.getUserStats('user_123');

      expect(result).toEqual(mockStats);
      expect(mockRoadmapRepo.getUserStats).toHaveBeenCalledWith('user_123');
    });
  });
});
