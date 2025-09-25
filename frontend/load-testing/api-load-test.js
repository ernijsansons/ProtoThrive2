/**
 * API Load Testing for ProtoThrive Backend
 * Uses Artillery.js for comprehensive load testing of core APIs
 *
 * Ref: CLAUDE.md Phase 3 - Load Testing Framework
 */

const { beforeRequest, afterResponse } = require('./utils/test-helpers');

// Artillery configuration
module.exports = {
  config: {
    target: process.env.API_BASE_URL || 'http://localhost:8787',
    phases: [
      {
        name: 'Warm up',
        duration: 60,
        arrivalRate: 1,
        rampTo: 5
      },
      {
        name: 'Sustained load',
        duration: 300,
        arrivalRate: 10
      },
      {
        name: 'Spike test',
        duration: 120,
        arrivalRate: 50
      },
      {
        name: 'Cool down',
        duration: 60,
        arrivalRate: 5,
        rampTo: 1
      }
    ],
    payload: {
      path: './test-data.csv',
      fields: ['email', 'password', 'projectType', 'vision']
    },
    variables: {
      authToken: '',
      roadmapId: '',
      userId: ''
    },
    processor: './processor.js'
  },
  scenarios: [
    {
      name: 'Authentication Flow',
      weight: 30,
      flow: [
        {
          post: {
            url: '/auth/demo-token',
            headers: {
              'Content-Type': 'application/json'
            },
            capture: {
              json: '$.token',
              as: 'authToken'
            },
            expect: {
              statusCode: 200,
              hasProperty: 'token'
            }
          }
        },
        {
          post: {
            url: '/api/auth/validate',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer {{ authToken }}'
            },
            expect: {
              statusCode: 200,
              hasProperty: 'valid'
            }
          }
        }
      ]
    },
    {
      name: 'Roadmap CRUD Operations',
      weight: 50,
      flow: [
        // Get auth token first
        {
          post: {
            url: '/auth/demo-token',
            capture: {
              json: '$.token',
              as: 'authToken'
            }
          }
        },
        // Create roadmap
        {
          post: {
            url: '/api/roadmaps',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer {{ authToken }}'
            },
            json: {
              name: 'Load Test Roadmap {{ $randomString() }}',
              json_graph: JSON.stringify({
                nodes: [
                  {
                    id: 'n1',
                    label: 'Test Node',
                    status: 'pending',
                    position: { x: 0, y: 0, z: 0 }
                  }
                ],
                edges: []
              }),
              vibe_mode: true
            },
            capture: {
              json: '$.id',
              as: 'roadmapId'
            },
            expect: {
              statusCode: [200, 201],
              hasProperty: 'id'
            }
          }
        },
        // Get roadmap
        {
          get: {
            url: '/api/roadmaps/{{ roadmapId }}',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            expect: {
              statusCode: 200,
              hasProperty: 'json_graph'
            }
          }
        },
        // Update roadmap
        {
          put: {
            url: '/api/roadmaps/{{ roadmapId }}',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer {{ authToken }}'
            },
            json: {
              json_graph: JSON.stringify({
                nodes: [
                  {
                    id: 'n1',
                    label: 'Updated Test Node',
                    status: 'completed',
                    position: { x: 0, y: 0, z: 0 }
                  }
                ],
                edges: []
              })
            },
            expect: {
              statusCode: 200
            }
          }
        },
        // List roadmaps
        {
          get: {
            url: '/api/roadmaps',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            expect: {
              statusCode: 200,
              contentType: 'application/json'
            }
          }
        }
      ]
    },
    {
      name: 'AI Agent Analysis',
      weight: 20,
      flow: [
        // Get auth token
        {
          post: {
            url: '/auth/demo-token',
            capture: {
              json: '$.token',
              as: 'authToken'
            }
          }
        },
        // Run agent analysis
        {
          post: {
            url: '/api/agent/run',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer {{ authToken }}'
            },
            json: {
              task: 'Analyze roadmap for optimization opportunities',
              budget: 0.5,
              mode: 'fallback',
              roadmap_id: 'test-roadmap-{{ $randomString() }}'
            },
            expect: {
              statusCode: 200,
              hasProperty: ['success', 'agent_report']
            }
          }
        },
        // Check agent status
        {
          get: {
            url: '/api/agent/status',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            expect: {
              statusCode: 200
            }
          }
        }
      ]
    }
  ]
};

console.log('Thermonuclear Load Testing: Artillery configuration loaded for API stress testing');