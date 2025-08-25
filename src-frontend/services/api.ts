// Ref: CLAUDE.md Thermonuclear Unified - Frontend API Service
// Uses unified mocks from root utils/mocks

import { mockFetch, mockSplineLoader, createDummyData } from '../../utils/mocks';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface Roadmap {
  id: string;
  user_id: string;
  json_graph: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  vibe_mode: boolean;
  thrive_score: number;
  created_at: string;
  updated_at: string;
}

/**
 * Frontend API service using unified mocks
 * Ref: CLAUDE.md Phase 6 - Frontend Mock Integration
 */
export class ThermonuclearApiService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  /**
   * Fetch roadmaps for current user
   */
  async getRoadmaps(): Promise<ApiResponse<Roadmap[]>> {
    console.log('Thermonuclear Frontend: Fetching roadmaps');
    
    try {
      const response = await mockFetch(`${this.baseUrl}/api/roadmaps`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer mock-jwt-token',
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      // Return dummy roadmaps using unified mock data
      const dummyData = createDummyData();
      return {
        success: true,
        data: [
          {
            ...dummyData.roadmap,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'draft',
            user_id: dummyData.user.id
          } as Roadmap
        ]
      };
    } catch (error) {
      console.error('Thermonuclear Frontend API Error:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to fetch roadmaps'
      };
    }
  }

  /**
   * Create new roadmap
   */
  async createRoadmap(roadmapData: Partial<Roadmap>): Promise<ApiResponse<Roadmap>> {
    console.log('Thermonuclear Frontend: Creating roadmap', roadmapData);
    
    try {
      const response = await mockFetch(`${this.baseUrl}/api/roadmaps`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-jwt-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roadmapData)
      });

      const data = await response.json();
      const dummyData = createDummyData();
      
      return {
        success: true,
        data: {
          ...dummyData.roadmap,
          ...roadmapData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Roadmap
      };
    } catch (error) {
      console.error('Thermonuclear Frontend API Error:', error);
      return {
        success: false,
        data: {} as Roadmap,
        message: 'Failed to create roadmap'
      };
    }
  }

  /**
   * Load Spline 3D scene
   */
  async loadSplineScene(sceneUrl: string): Promise<boolean> {
    console.log('Thermonuclear Frontend: Loading Spline scene', sceneUrl);
    return await mockSplineLoader(sceneUrl);
  }

  /**
   * Get template snippets
   */
  async getTemplates(): Promise<ApiResponse<any[]>> {
    console.log('Thermonuclear Frontend: Fetching templates');
    
    try {
      const response = await mockFetch(`${this.baseUrl}/api/snippets`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      // Generate 50 dummy templates
      const templates = Array.from({length: 50}, (_, i) => ({
        id: `template-${i}`,
        category: ['ui', 'auth', 'deploy', 'api'][i % 4],
        label: `Template ${i}`,
        code: `console.log("Thermo Template ${i}");`,
        description: `Thermonuclear template ${i} for rapid prototyping`,
        ui_preview_url: 'mock_neon.png'
      }));
      
      return {
        success: true,
        data: templates
      };
    } catch (error) {
      console.error('Thermonuclear Frontend API Error:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to fetch templates'
      };
    }
  }
}

// Export singleton instance
export const apiService = new ThermonuclearApiService();

console.log('🚀 THERMONUCLEAR FRONTEND API: Service loaded with unified mocks');