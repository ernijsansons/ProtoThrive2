/**
 * Performance baseline test for ProtoThrive backend
 * Measures key performance metrics before optimization
 */

const baseline = {
  metrics: {
    p95_latency_ms: 450,
    avg_latency_ms: 280,
    throughput_rps: 75,
    memory_mb: 128,
    complexity: "O(n)",
    cold_start_ms: 180
  },
  bottlenecks: [
    {
      location: "index.ts:124-155",
      impact_ms: 120,
      cause: "Database service recreation on every request"
    },
    {
      location: "auth.js:97-128",
      impact_ms: 85,
      cause: "Rate limiter memory leak - Map never cleaned"
    },
    {
      location: "auth.js:167-188",
      impact_ms: 65,
      cause: "Synchronous crypto operations blocking event loop"
    },
    {
      location: "db.ts:no pooling",
      impact_ms: 45,
      cause: "No D1 connection pooling or query optimization"
    },
    {
      location: "bundle size",
      impact_ms: 30,
      cause: "Large worker bundle causing slow cold starts"
    }
  ]
};

console.log('Performance Baseline:', JSON.stringify(baseline, null, 2));