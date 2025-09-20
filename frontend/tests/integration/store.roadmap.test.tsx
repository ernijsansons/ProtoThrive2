import { act } from '@testing-library/react';
import { useStore } from '@/store';

const originalFetch = global.fetch;

const initialSnapshot = (() => {
  const state = useStore.getState();
  return {
    thriveScore: state.thriveScore,
    userRole: state.userRole,
    nodes: state.nodes.map((node) => ({ ...node, position: { ...node.position } })),
    edges: state.edges.map((edge) => ({ ...edge })),
  };
})();

beforeEach(() => {
  const { thriveScore, userRole, nodes, edges } = initialSnapshot;
  useStore.setState({
    thriveScore,
    userRole,
    nodes: nodes.map((node) => ({ ...node, position: { ...node.position } })),
    edges: edges.map((edge) => ({ ...edge })),
    isLoading: false,
    error: null,
  });
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe('Store roadmap fetch', () => {
  it('updates thrive score when backend responds', async () => {
    const graph = {
      nodes: [
        { id: 'n1', label: 'Start', status: 'gray', position: { x: 0, y: 0, z: 0 } },
        { id: 'n2', label: 'Next', status: 'gray', position: { x: 120, y: 80, z: 0 } },
      ],
      edges: [{ from: 'n1', to: 'n2' }],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        json_graph: JSON.stringify(graph),
        thrive_score: 0.82,
        user: { role: 'engineer' },
      }),
    }) as unknown as typeof fetch;

    await act(async () => {
      await useStore.getState().fetchRoadmap('some-id');
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(useStore.getState().thriveScore).toBeCloseTo(0.82, 2);
    expect(useStore.getState().userRole).toBe('engineer');
  });
});