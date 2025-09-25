// Polyfills for server-side rendering compatibility
// Ref: CLAUDE.md - Frontend SSR Compatibility

// Only run polyfills on the server side
if (typeof window === 'undefined' && typeof global !== 'undefined') {
  // Polyfill self for server-side rendering
  if (typeof self === 'undefined') {
    global.self = global;
  }
}

export {};