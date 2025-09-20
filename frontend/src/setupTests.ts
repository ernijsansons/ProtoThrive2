import { TextEncoder, TextDecoder } from "util";
(globalThis as any).TextEncoder ??= TextEncoder;
(globalThis as any).TextDecoder ??= TextDecoder;
import { ReadableStream, TransformStream } from "web-streams-polyfill/dist/ponyfill.js";

import 'whatwg-fetch';
import '@testing-library/jest-dom';

// Mock environment variables
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123';
process.env.CLERK_SECRET_KEY = 'sk_test_123';

global.fetch = jest.fn((url, options) => {
  if (url === '/api/admin-auth' && options?.method === 'POST') {
    // Mock for missing credentials
    const body = JSON.parse(options.body as string);
    if (!body.username || !body.password) {
      return Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Missing credentials' }),
      });
    }
    // Mock for successful login
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ message: 'Login successful' }),
    });
  } else if (url === '/api/admin-auth' && options?.method === 'GET') {
    // Mock for invalid method
    return Promise.resolve({
      ok: false,
      status: 405,
      json: () => Promise.resolve({ error: 'Method not allowed' }),
    });
  }

  // Default mock for other requests
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('OK'),
  });
}) as jest.Mock;
if (typeof (globalThis as any).BroadcastChannel === "undefined") {
  class MockBroadcastChannel {
    constructor() {}
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  }
  (globalThis as any).BroadcastChannel = MockBroadcastChannel as unknown as typeof BroadcastChannel;
}

if (!(globalThis as any).ReadableStream) {
  (globalThis as any).ReadableStream = ReadableStream as unknown as typeof ReadableStream;
}
if (!(globalThis as any).TransformStream) {
  (globalThis as any).TransformStream = TransformStream as unknown as typeof TransformStream;
}

