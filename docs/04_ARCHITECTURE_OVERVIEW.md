# Architecture Overview - ProtoThrive2

## System Design Philosophy
ProtoThrive follows a "Thermonuclear" architecture pattern emphasizing:
- Cost-aware AI orchestration ($0.10/task budget)
- Mock-first development with production toggles
- Edge-first deployment on Cloudflare infrastructure
- Multi-agent ensemble with fallback strategies

## Component Architecture

### Frontend Architecture
```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[User Interface]
        RC[React Components]
        ZS[Zustand Store]
        RF[React Flow Canvas]
        S3D[Spline 3D Scene]

        UI --> RC
        RC --> ZS
        RC --> RF
        RC --> S3D
        ZS --> |State Updates| RC
    end

    subgraph "API Layer"
        API[API Client]
        WS[WebSocket Client]
        SSE[SSE Client]

        RC --> API
        RC --> WS
        RC --> SSE
    end

    API --> Backend
    WS --> Backend
    SSE --> Backend
```

### Backend Architecture
```mermaid
graph LR
    subgraph "Edge Runtime"
        CF[Cloudflare Worker]
        MW[Middleware Stack]
        RT[Request Router]

        CF --> MW
        MW --> RT
    end

    subgraph "Services"
        RS[Roadmap Service]
        SS[Snippet Service]
        AS[Auth Service]
        AC[Agent Coordinator]

        RT --> RS
        RT --> SS
        RT --> AS
        RT --> AC
    end

    subgraph "Data Layer"
        D1[(D1 Database)]
        KV[KV Cache]

        RS --> D1
        SS --> D1
        AS --> D1
        AC --> KV
    end

    subgraph "AI Pipeline"
        EA[Enterprise Agent]
        FA[Fallback Agent]

        AC --> EA
        AC --> FA
    end
```

## Data Architecture

### Database Schema (D1)
```mermaid
erDiagram
    users ||--o{ roadmaps : creates
    users {
        text id PK
        text email UK
        text role
        timestamp created_at
        timestamp deleted_at
    }

    roadmaps ||--o{ agent_logs : generates
    roadmaps ||--o{ insights : produces
    roadmaps {
        text id PK
        text user_id FK
        text json_graph
        text status
        integer vibe_mode
        real thrive_score
        timestamp created_at
        timestamp updated_at
    }

    snippets {
        text id PK
        text category
        text code
        text ui_preview_url
        integer version
        timestamp created_at
        timestamp updated_at
    }

    agent_logs {
        text id PK
        text roadmap_id FK
        text task_type
        text output
        text status
        text model_used
        integer token_count
        timestamp timestamp
    }

    insights {
        text id PK
        text roadmap_id FK
        text type
        text data
        real score
        timestamp created_at
    }
```

## Security Architecture

### Authentication Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant JWT as JWT Service
    participant DB as Database

    U->>F: Login Request
    F->>B: POST /auth/login
    B->>DB: Validate Credentials
    DB-->>B: User Data
    B->>JWT: Generate Token
    JWT-->>B: JWT Token
    B-->>F: Token + User Info
    F->>F: Store in Context
    F-->>U: Authenticated UI

    Note over F,B: Subsequent Requests
    F->>B: API Call + Bearer Token
    B->>JWT: Validate Token
    JWT-->>B: User Claims
    B->>B: Authorize Action
    B->>DB: Execute Query
    DB-->>B: Results
    B-->>F: Response
```

## Agent Orchestration

### Dual-Agent Pipeline
```mermaid
flowchart TD
    TR[Task Request] --> AC[Agent Coordinator]
    AC --> CE{Cost Estimate}

    CE -->|Under Budget| RT{Route Decision}
    CE -->|Over Budget| ERR[Budget Error]

    RT -->|High Confidence| EA[Enterprise Agent v3.4]
    RT -->|Low Cost Need| FA[Fallback Agent]

    EA --> VAL1[Validation]
    FA --> VAL2[Validation]

    VAL1 -->|Pass| RES[Response]
    VAL1 -->|Fail| FA
    VAL2 -->|Pass| RES
    VAL2 -->|Fail| HITL[Human in Loop]

    RES --> LOG[Log Metrics]
    LOG --> RET[Return Result]
```

### Agent Configuration
- **Primary**: Enterprise Agent v3.4
  - Models: GPT-5 Codex, Claude Opus 4
  - Confidence threshold: 0.8
  - Budget: $0.40 default, $1.00 max

- **Fallback**: Lightweight Python Agent
  - Models: Local orchestrator
  - Budget: $0.05 minimum
  - Use case: Simple tasks, budget constraints

## Deployment Architecture

### CI/CD Pipeline
```mermaid
graph LR
    GH[GitHub Push] --> GA[GitHub Actions]
    GA --> LINT[Lint & Format]
    LINT --> TEST[Test Suites]
    TEST --> BUILD[Build]
    BUILD --> DEP{Environment}

    DEP -->|main| PROD[Production]
    DEP -->|dev| STAGE[Staging]

    PROD --> CFW[CF Workers]
    PROD --> CFP[CF Pages]
    STAGE --> CFWS[CF Workers Staging]
```

### Infrastructure
- **Edge Locations**: Cloudflare's 300+ PoPs
- **Database**: D1 with automatic replication
- **Cache**: KV with 60s TTL default
- **Static Assets**: Cloudflare Pages CDN

## Performance Architecture

### Optimization Strategies
1. **Edge Computing**: All logic at Cloudflare edge
2. **Database Indexing**: Composite indexes on hot paths
3. **Caching**: KV for agent results, user sessions
4. **Code Splitting**: Dynamic imports in frontend
5. **Asset Optimization**: WebP images, minified JS/CSS

### SLO Targets
- API Response: < 200ms p95
- Page Load: < 2s LCP
- Agent Response: < 5s for simple tasks
- Availability: 99.9% uptime

## Scalability Design

### Horizontal Scaling
- Cloudflare Workers: Auto-scales to millions of requests
- D1 Database: Read replicas across regions
- KV Cache: Globally distributed

### Vertical Scaling
- Worker CPU: 50ms - 50s limits
- Memory: 128MB per worker
- Database: 500GB D1 storage limit

## Monitoring & Observability

### Metrics Collection
```mermaid
graph TD
    APP[Application] --> LOG[Logs]
    APP --> MET[Metrics]
    APP --> TRC[Traces]

    LOG --> CFL[CF Logpush]
    MET --> CFA[CF Analytics]
    TRC --> DD[Datadog APM]

    CFL --> S3[S3 Archive]
    CFA --> DASH[Dashboards]
    DD --> ALERT[Alerts]
```

### Key Metrics
- Request latency (p50, p95, p99)
- Error rates by endpoint
- Agent cost per task
- Database query performance
- Cache hit rates

## Disaster Recovery

### Backup Strategy
- Database: Daily D1 backups
- Code: Git repository (GitHub)
- Configurations: Version controlled
- Secrets: Cloudflare encrypted storage

### Recovery Procedures
1. Database corruption: Restore from D1 backup
2. Service outage: Cloudflare automatic failover
3. Code regression: Git revert + redeploy
4. Data loss: Point-in-time recovery from backups