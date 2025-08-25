// Ref: CLAUDE.md - Real API Fetch for Production
export const mockFetch = async (url: string, opts: any = {}) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backend-thermo.ernijs-ansons.workers.dev';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  
  // Fix auth header format for backend
  if (opts.headers?.Authorization === 'Bearer mock') {
    opts.headers.Authorization = 'Bearer mock.uuid-thermo-1.signature';
  }
  
  console.log(`THERMONUCLEAR API CALL: ${fullUrl}`);
  
  try {
    const response = await fetch(fullUrl, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...opts.headers,
      },
    });
    
    return response;
  } catch (error) {
    console.error('THERMONUCLEAR API ERROR:', error);
    throw error;
  }
};

export const mockDbQuery = (query: string, binds: any) => {
  console.log(`THERMONUCLEAR MOCK DB: ${query} - Binds: ${binds}`);
  return { 
    results: [{
      id: 'uuid-thermo', 
      json_graph: '{"nodes":[{"id":"n1","label":"Thermo Start","status":"gray"}],"edges":[{"from":"n1","to":"n2"}]}', 
      thrive_score: 0.45 
    }] 
  };
};