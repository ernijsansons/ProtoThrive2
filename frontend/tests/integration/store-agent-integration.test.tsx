import { act } from '@testing-library/react';
import { useStore } from '@/store';

const originalFetch = global.fetch;

describe('Store Agent Integration', () => {
  beforeEach(() => {
    // Reset store state
    useStore.setState({
      agentReport: null,
      currentRoadmapId: null,
      isLoading: false,
      error: null
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should store agent report when roadmap response contains agent_report', async () => {
    const mockAgentReport = {
      agent: 'enterprise',
      confidence: 0.85,
      cost: {
        estimate: 0.12,
        actual: 0.10,
        consumed: 0.10,
        remaining: 0.20
      },
      fallback_used: false,
      trace: [
        {
          agent: 'enterprise',
          success: true,
          confidence: 0.85,
          cost: 0.10
        }
      ]
    };

    const mockRoadmapResponse = {
      json_graph: JSON.stringify({
        nodes: [
          { id: 'n1', label: 'Start', status: 'gray', position: { x: 0, y: 0, z: 0 } },
          { id: 'n2', label: 'Next', status: 'gray', position: { x: 120, y: 80, z: 0 } }
        ],
        edges: [{ from: 'n1', to: 'n2' }]
      }),
      thrive_score: 0.82,
      user: { role: 'engineer' },
      agent_report: mockAgentReport
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockRoadmapResponse
    });

    await act(async () => {
      await useStore.getState().fetchRoadmap('test-roadmap-123');
    });

    const state = useStore.getState();
    expect(state.agentReport).toEqual(mockAgentReport);
    expect(state.currentRoadmapId).toBe('test-roadmap-123');
  });

  it('should not store agent report when roadmap response lacks agent_report', async () => {
    const mockRoadmapResponse = {
      json_graph: JSON.stringify({
        nodes: [{ id: 'n1', label: 'Start', status: 'gray', position: { x: 0, y: 0, z: 0 } }],
        edges: []
      }),
      thrive_score: 0.75,
      user: { role: 'engineer' }
      // No agent_report field
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockRoadmapResponse
    });

    await act(async () => {
      await useStore.getState().fetchRoadmap('test-roadmap-456');
    });

    const state = useStore.getState();
    expect(state.agentReport).toBeNull();
    expect(state.currentRoadmapId).toBe('test-roadmap-456');
  });

  it('should store error report when agent analysis fails', async () => {
    const mockErrorReport = {
      error: 'Agent execution failed',
      code: 'AGENT-500',
      metadata: { detail: 'Network timeout' }
    };

    const mockRoadmapResponse = {
      json_graph: JSON.stringify({
        nodes: [{ id: 'n1', label: 'Start', status: 'gray', position: { x: 0, y: 0, z: 0 } }],
        edges: []
      }),
      thrive_score: 0.75,
      user: { role: 'engineer' },
      agent_report: mockErrorReport
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockRoadmapResponse
    });

    await act(async () => {
      await useStore.getState().fetchRoadmap('test-roadmap-789');
    });

    const state = useStore.getState();
    expect(state.agentReport).toEqual(mockErrorReport);
  });

  it('should run agent analysis with correct parameters', async () => {
    const mockAgentResponse = {
      agent_report: {
        agent: 'enterprise',
        confidence: 0.9,
        cost: {
          estimate: 0.15,
          actual: 0.12,
          consumed: 0.12,
          remaining: 0.18
        },
        fallback_used: false,
        trace: [
          {
            agent: 'enterprise',
            success: true,
            confidence: 0.9,
            cost: 0.12
          }
        ]
      }
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockAgentResponse
    });

    await act(async () => {
      await useStore.getState().runAgentAnalysis('test-roadmap-123', {
        task: 'Analyze this roadmap',
        budget: 0.3,
        mode: 'fallback'
      });
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8787/api/agent/run',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          task: 'Analyze this roadmap',
          budget: 0.3,
          mode: 'fallback',
          roadmap_id: 'test-roadmap-123'
        })
      })
    );

    const state = useStore.getState();
    expect(state.agentReport).toEqual(mockAgentResponse.agent_report);
  });

  it('should handle agent analysis errors gracefully', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' })
    });

    await act(async () => {
      await useStore.getState().runAgentAnalysis('test-roadmap-123');
    });

    const state = useStore.getState();
    expect(state.error).toBe('Internal server error');
    expect(state.agentReport).toEqual({
      agent: 'error',
      confidence: 0,
      cost: { estimate: 0, actual: 0, consumed: 0, remaining: 0 },
      fallback_used: false,
      trace: [],
      error: 'Internal server error'
    });
  });
});
