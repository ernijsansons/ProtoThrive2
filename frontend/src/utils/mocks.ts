// Basic mocks for development
export const mockFetch = async (url: string, options?: any) => {
  console.log(`Mock fetch: ${url}`, options);
  return {
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      data: 'mock-data',
      keys: [
        {
          id: '1',
          name: 'Development Key',
          key: 'dev_key_****',
          service: 'openai',
          created: new Date().toISOString(),
          lastRotated: new Date().toISOString(),
          status: 'active' as const
        },
        {
          id: '2',
          name: 'Production Key',
          key: 'prod_key_****',
          service: 'claude',
          created: new Date().toISOString(),
          lastRotated: new Date().toISOString(),
          status: 'active' as const
        }
      ]
    }),
    text: async () => 'mock-response'
  };
};

export const mockApiCall = async (endpoint: string, payload?: any) => {
  console.log(`Mock API call: ${endpoint}`, payload);
  return { success: true, data: payload || 'mock-data' };
};