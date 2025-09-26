/**
 * Graph Parser Utility
 * Safely parse and validate graph JSON data
 */

import { Graph, Node, Edge, RawRoadmap, Roadmap } from '@/types';

export class GraphParser {
  /**
   * Parse JSON string to Graph object with validation
   */
  static parseGraph(jsonString: string | Graph): Graph {
    // If already a Graph object, validate and return
    if (typeof jsonString === 'object' && jsonString !== null) {
      return this.validateGraph(jsonString as Graph);
    }

    // Parse JSON string
    try {
      const parsed = JSON.parse(jsonString as string);
      return this.validateGraph(parsed);
    } catch (error) {
      console.error('Failed to parse graph JSON:', error);
      return this.getDefaultGraph();
    }
  }

  /**
   * Validate Graph object structure
   */
  static validateGraph(graph: any): Graph {
    if (!graph || typeof graph !== 'object') {
      return this.getDefaultGraph();
    }

    // Ensure nodes array exists and is valid
    const nodes = Array.isArray(graph.nodes)
      ? graph.nodes.map((node: any) => this.validateNode(node))
      : [];

    // Ensure edges array exists and is valid
    const edges = Array.isArray(graph.edges)
      ? graph.edges.map((edge: any) => this.validateEdge(edge))
      : [];

    return {
      nodes,
      edges,
      metadata: graph.metadata || undefined
    };
  }

  /**
   * Validate Node object
   */
  static validateNode(node: any): Node {
    if (!node || typeof node !== 'object') {
      throw new Error('Invalid node structure');
    }

    return {
      id: String(node.id || ''),
      label: String(node.label || 'Unnamed Node'),
      status: this.validateNodeStatus(node.status),
      position: this.validatePosition(node.position),
      type: node.type || 'default',
      data: node.data || undefined,
      metadata: node.metadata || undefined
    };
  }

  /**
   * Validate Edge object
   */
  static validateEdge(edge: any): Edge {
    if (!edge || typeof edge !== 'object') {
      throw new Error('Invalid edge structure');
    }

    return {
      id: edge.id || `edge-${edge.from}-${edge.to}`,
      from: String(edge.from || ''),
      to: String(edge.to || ''),
      label: edge.label || undefined,
      type: edge.type || 'default',
      weight: typeof edge.weight === 'number' ? edge.weight : undefined,
      metadata: edge.metadata || undefined
    };
  }

  /**
   * Validate node status
   */
  static validateNodeStatus(status: any): Node['status'] {
    const validStatuses: Node['status'][] = ['gray', 'neon', 'completed', 'failed', 'pending'];
    return validStatuses.includes(status) ? status : 'gray';
  }

  /**
   * Validate 3D position
   */
  static validatePosition(position: any): Node['position'] {
    if (!position || typeof position !== 'object') {
      return { x: 0, y: 0, z: 0 };
    }

    return {
      x: typeof position.x === 'number' ? position.x : 0,
      y: typeof position.y === 'number' ? position.y : 0,
      z: typeof position.z === 'number' ? position.z : 0
    };
  }

  /**
   * Get default empty graph
   */
  static getDefaultGraph(): Graph {
    return {
      nodes: [],
      edges: [],
      metadata: {
        version: '1.0.0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
  }

  /**
   * Convert Graph object to JSON string
   */
  static stringifyGraph(graph: Graph): string {
    try {
      return JSON.stringify(graph);
    } catch (error) {
      console.error('Failed to stringify graph:', error);
      return '{"nodes":[],"edges":[]}';
    }
  }

  /**
   * Convert RawRoadmap to Roadmap
   */
  static parseRoadmap(rawRoadmap: RawRoadmap): Roadmap {
    return {
      ...rawRoadmap,
      json_graph: this.parseGraph(rawRoadmap.json_graph)
    };
  }

  /**
   * Convert Roadmap to RawRoadmap for API
   */
  static serializeRoadmap(roadmap: Roadmap): RawRoadmap {
    return {
      ...roadmap,
      json_graph: this.stringifyGraph(roadmap.json_graph)
    };
  }

  /**
   * Create sample graph for testing
   */
  static createSampleGraph(): Graph {
    return {
      nodes: [
        {
          id: 'node-1',
          label: 'Start',
          status: 'completed',
          position: { x: 0, y: 0, z: 0 },
          type: 'milestone'
        },
        {
          id: 'node-2',
          label: 'Development',
          status: 'neon',
          position: { x: 100, y: 100, z: 0 },
          type: 'default'
        },
        {
          id: 'node-3',
          label: 'Testing',
          status: 'pending',
          position: { x: 200, y: 100, z: 0 },
          type: 'default'
        },
        {
          id: 'node-4',
          label: 'Deployment',
          status: 'gray',
          position: { x: 300, y: 200, z: 0 },
          type: 'milestone'
        }
      ],
      edges: [
        { id: 'edge-1', from: 'node-1', to: 'node-2', type: 'default' },
        { id: 'edge-2', from: 'node-2', to: 'node-3', type: 'default' },
        { id: 'edge-3', from: 'node-3', to: 'node-4', type: 'default' }
      ],
      metadata: {
        version: '1.0.0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        layout: 'hierarchical'
      }
    };
  }
}

export default GraphParser;