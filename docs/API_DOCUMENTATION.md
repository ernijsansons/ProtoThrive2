# ProtoThrive API Documentation

## Overview
ProtoThrive provides a comprehensive REST API for managing interactive roadmaps, AI-powered orchestration, and enterprise workflows. The API is built on Cloudflare Workers with Hono framework and follows RESTful principles.

**Base URL**: `https://backend-thermo.ernijs-ansons.workers.dev`
**Staging URL**: `https://backend-thermo-staging.ernijs-ansons.workers.dev`

## Authentication
All API endpoints (except `/health`) require Bearer token authentication:
```bash
Authorization: Bearer <your-token>
```

For development, the API accepts any token and uses mock authentication.

## Error Codes
ProtoThrive uses structured error codes for better debugging:

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VAL-400` | Validation error | 400 |
| `AUTH-401` | Authentication error | 401 |
| `GRAPH-404` | Roadmap not found | 404 |
| `COST-402` | Budget exceeded | 402 |
| `ERR-DB` | Database error | 500 |
| `ERR-500` | Internal server error | 500 |

## Core Endpoints

### Health Check
Check API status and database connectivity.

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-18T12:00:00Z",
  "service": "protothrive-backend-thermo",
  "version": "2.0.0",
  "database": {
    "status": "healthy",
    "latency": 45
  },
  "environment": "production"
}
```

## Roadmap Management

### Get Roadmap
Retrieve a specific roadmap by ID.

```http
GET /api/roadmaps/{id}
```

**Parameters:**
- `id` (string, required): UUID of the roadmap

**Response:**
```json
{
  "id": "uuid-roadmap-123",
  "user_id": "uuid-user-456",
  "json_graph": {
    "nodes": [
      {
        "id": "n1",
        "label": "Planning Phase",
        "status": "neon",
        "position": { "x": 0, "y": 0, "z": 0 }
      }
    ],
    "edges": [
      { "from": "n1", "to": "n2" }
    ]
  },
  "status": "active",
  "vibe_mode": true,
  "thrive_score": 0.85,
  "created_at": "2025-01-18T10:00:00Z",
  "updated_at": "2025-01-18T11:30:00Z"
}
```

### List User Roadmaps
Get all roadmaps for the authenticated user with pagination.

```http
GET /api/roadmaps?limit=50&offset=0
```

**Query Parameters:**
- `limit` (integer, optional): Number of results (1-100, default: 50)
- `offset` (integer, optional): Number of results to skip (default: 0)

**Response:**
```json
{
  "roadmaps": [
    {
      "id": "uuid-roadmap-123",
      "user_id": "uuid-user-456",
      "json_graph": {...},
      "status": "active",
      "vibe_mode": true,
      "thrive_score": 0.85,
      "created_at": "2025-01-18T10:00:00Z",
      "updated_at": "2025-01-18T11:30:00Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### Create Roadmap
Create a new roadmap.

```http
POST /api/roadmaps
```

**Request Body:**
```json
{
  "json_graph": {
    "nodes": [
      {
        "id": "n1",
        "label": "Start Phase",
        "status": "gray",
        "position": { "x": 0, "y": 0, "z": 0 }
      }
    ],
    "edges": []
  },
  "vibe_mode": true,
  "status": "draft"
}
```

**Response:**
```json
{
  "id": "uuid-new-roadmap",
  "message": "Roadmap created successfully",
  "json_graph": {...},
  "vibe_mode": true,
  "status": "draft",
  "thrive_score": 0.0
}
```

### Update Roadmap
Update an existing roadmap (partial updates supported).

```http
PUT /api/roadmaps/{id}
```

**Request Body (all fields optional):**
```json
{
  "status": "active",
  "json_graph": {...},
  "thrive_score": 0.75,
  "vibe_mode": false
}
```

**Response:**
```json
{
  "message": "Roadmap updated successfully",
  "id": "uuid-roadmap-123"
}
```

### Delete Roadmap
Soft delete a roadmap (marks as deleted, doesn't remove from database).

```http
DELETE /api/roadmaps/{id}
```

**Response:**
```json
{
  "message": "Roadmap deleted successfully",
  "id": "uuid-roadmap-123"
}
```

## Code Snippets

### Get Snippets
Retrieve code snippets with optional category filtering.

```http
GET /api/snippets?category=ui&limit=50
```

**Query Parameters:**
- `category` (string, optional): Filter by snippet category
- `limit` (integer, optional): Number of results (1-100, default: 50)

**Response:**
```json
{
  "snippets": [
    {
      "id": "sn-123",
      "category": "ui",
      "code": "console.log('Thermonuclear UI Component');",
      "ui_preview_url": "https://example.com/preview.png",
      "version": 1,
      "created_at": "2025-01-18T10:00:00Z"
    }
  ],
  "total": 1,
  "category": "ui",
  "limit": 50
}
```

### Create Snippet
Add a new code snippet.

```http
POST /api/snippets
```

**Request Body:**
```json
{
  "category": "ui",
  "code": "const Button = () => <button className=\"btn-primary\">Click me</button>;",
  "ui_preview_url": "https://example.com/button-preview.png",
  "version": 1
}
```

**Response:**
```json
{
  "id": "sn-new-456",
  "message": "Snippet created successfully",
  "category": "ui",
  "code": "const Button = () => <button className=\"btn-primary\">Click me</button>;",
  "ui_preview_url": "https://example.com/button-preview.png",
  "version": 1
}
```

## Agent Logs

### Get Agent Logs
Retrieve AI agent execution logs for a roadmap with calculated thrive score.

```http
GET /api/agent-logs/{roadmapId}?limit=50
```

**Parameters:**
- `roadmapId` (string, required): UUID of the roadmap
- `limit` (integer, optional): Number of results (1-100, default: 50)

**Response:**
```json
{
  "logs": [
    {
      "id": "log-123",
      "roadmap_id": "uuid-roadmap-123",
      "task_type": "ui",
      "output": "// Generated thermonuclear UI component",
      "status": "success",
      "model_used": "kimi",
      "token_count": 150,
      "timestamp": "2025-01-18T11:00:00Z"
    }
  ],
  "roadmap_id": "uuid-roadmap-123",
  "thrive_score": 0.85,
  "total": 1,
  "limit": 50
}
```

## Data Types

### Roadmap Status
- `draft`: Initial state, not yet active
- `active`: Currently being worked on
- `completed`: All tasks finished
- `archived`: Completed and archived

### Node Status
- `gray`: Inactive/pending
- `neon`: Active/thriving (high priority)
- `green`: Completed successfully
- `red`: Requires attention/failed

### Agent Log Status
- `success`: Task completed successfully
- `fail`: Task failed
- `timeout`: Task timed out
- `escalated`: Escalated to human review

### User Roles
- `vibe_coder`: Developer with UI focus
- `engineer`: Backend/infrastructure developer
- `exec`: Executive/management role

## Thrive Score Calculation
The thrive score is calculated using the formula:
```
completion = (success_logs / total_logs) * 0.6
ui_polish = (ui_logs / total_logs) * 0.3  
risk = (1 - fail_logs / total_logs) * 0.1
thrive_score = completion + ui_polish + risk
```

Score ranges:
- `0.7+`: Excellent (neon status)
- `0.4-0.7`: Good progress
- `0.0-0.4`: Needs attention

## Rate Limits
- 100 requests per minute per user
- 1000 requests per hour per user
- Database operations: 10 per second

## Legacy Compatibility
The API maintains compatibility with v1.x endpoints:

```http
GET /roadmaps/{id}  # Maps to /api/roadmaps/{id}
POST /roadmaps      # Maps to /api/roadmaps
```

## SDK Integration
For JavaScript/TypeScript integration, use the ProtoThrive client:

```typescript
import { ProtoThriveClient } from '@protothrive/client';

const client = new ProtoThriveClient({
  baseUrl: 'https://backend-thermo.ernijs-ansons.workers.dev',
  apiKey: 'your-bearer-token'
});

const roadmaps = await client.roadmaps.list();
```

## WebSocket Support
Real-time updates available via WebSocket connection:
```
wss://backend-thermo.ernijs-ansons.workers.dev/ws
```

Supported events:
- `roadmap.updated`
- `thrive_score.changed`
- `agent.completed`

## Error Handling
All endpoints return structured error responses:

```json
{
  "error": "Roadmap not found",
  "code": "GRAPH-404",
  "timestamp": "2025-01-18T12:00:00Z",
  "request_id": "uuid-request-789"
}
```

## Testing
Use the health endpoint to verify API connectivity:
```bash
curl -X GET https://backend-thermo.ernijs-ansons.workers.dev/health
```

For authenticated endpoints:
```bash
curl -X GET \
  https://backend-thermo.ernijs-ansons.workers.dev/api/roadmaps \
  -H "Authorization: Bearer your-token"
```