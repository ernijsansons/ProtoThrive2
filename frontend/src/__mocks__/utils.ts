export const mockFetch = jest.fn(() => Promise.resolve({
  ok: true,
  json: async () => ({
    json_graph: JSON.stringify({
      nodes: [{id: 'n1', label: 'Thermo Start', status: 'gray', position: {x: 0, y: 0, z: 0}}],
      edges: []
    }),
    thrive_score: 0.45
  })
}));