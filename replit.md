# ProtoThrive - AI-First Visual Development Platform

## Overview

ProtoThrive is a comprehensive AI-powered platform that transforms how teams build, manage, and deploy software projects. The platform bridges the gap between visual prototyping and full-stack development through an innovative "Living ERP Graph" technology, multi-agent AI systems, and automated workflow orchestration.

The core vision is to democratize development by enabling "vibe coders" to build visually without traditional coding, while providing full engineering capabilities for technical teams and executive insights for stakeholders. The platform aims to solve the 70% prototype gap by guaranteeing successful project completion through AI agents and automated workflows.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with **Next.js 14/15** using a Pages Router architecture with TypeScript. The core UI features a revolutionary "Magic Canvas" that provides both 2D visualization through **React Flow** and 3D cosmic roadmaps via **Spline integration**. State management is handled by **Zustand** for predictable data flow across components.

The design system utilizes **Tailwind CSS** with a custom "thermonuclear" theme featuring neon gradients and cosmic aesthetics. The platform supports responsive design and includes specialized components like the InsightsPanel for real-time Thrive Score tracking and admin portals for system management.

Key architectural decisions:
- Pages Router over App Router for stability and compatibility
- Zustand over Redux for lightweight state management
- Custom hook architecture for API integration
- Static export capability for Cloudflare Pages deployment

### Backend Architecture
The backend leverages **Cloudflare Workers** with the **Hono** framework for serverless API deployment. Data persistence is handled through **Cloudflare D1** (SQLite-based) for relational data and **Cloudflare KV** for caching and configuration storage.

The API layer provides both REST endpoints and **GraphQL** through graphql-yoga integration. Authentication is implemented via JWT tokens with role-based access control supporting three user types: vibe_coder, engineer, and exec.

Core backend patterns:
- Multi-tenant architecture with user_id isolation
- Zod validation schemas for request/response validation
- Custom error handling with thermonuclear error codes (e.g., AUTH-401, VAL-400)
- Budget enforcement and cost monitoring for AI operations

### AI Core Architecture
The AI system is built in **Python** using **LangChain** and **CrewAI** for multi-agent orchestration. The architecture follows a three-agent pattern: **PlannerAgent** (task decomposition), **CoderAgent** (code generation), and **AuditorAgent** (quality validation).

The system includes a **PromptRouter** that optimizes model selection based on cost and task type, preferring Kimi for cost-effectiveness while routing specialized tasks to Claude or uxpilot.ai. Vector storage is implemented through **MockPinecone** with 50+ pre-built code snippets for RAG-enhanced generation.

Key AI decisions:
- CrewAI for agent workflow orchestration
- Cost-first routing with $0.10 per task budget limits
- HITL (Human-in-the-Loop) escalation for uncertain outputs
- MockKV caching for performance optimization

### Data Storage Solutions
The platform uses a hybrid storage approach:
- **Cloudflare D1**: Primary database for roadmaps, users, snippets, and agent logs
- **Cloudflare KV**: Configuration, API keys, and caching layer
- **MockPinecone**: Vector embeddings for code snippet search (768-dimensional)

Database design includes comprehensive multi-tenant support with user_id foreign keys across all tables, soft deletion for GDPR compliance, and optimized indexes for performance.

### Authentication and Authorization
Security is implemented through **JWT-based authentication** with role-based access control. The system supports three distinct user roles with different permission levels:
- **vibe_coder**: Visual editing only, no direct code access
- **engineer**: Full platform access including code generation
- **exec**: Read-only insights and analytics access

Additional security features include budget monitoring, API key rotation through a secure vault system, and automated security risk detection (ASRD) with multi-timeframe limits.

## External Dependencies

### AI Services
- **Claude API**: Premium code generation and complex reasoning tasks
- **Kimi API**: Cost-effective primary AI service for routine operations
- **uxpilot.ai**: Specialized UI/UX design and preview generation

### Cloudflare Ecosystem
- **Cloudflare Workers**: Serverless backend deployment
- **Cloudflare D1**: Primary database service
- **Cloudflare KV**: Key-value storage for configuration and caching
- **Cloudflare Pages**: Frontend static site hosting

### Development and Deployment
- **Wrangler**: Cloudflare Workers CLI for deployment and management
- **n8n**: Self-hosted workflow automation platform
- **Docker Compose**: Local development environment orchestration
- **Vercel**: Alternative deployment platform for frontend

### Third-Party Integrations
- **Spline**: 3D scene rendering for cosmic roadmap visualization
- **React Flow**: 2D graph visualization and interaction
- **Stripe**: Payment processing for subscription management
- **Clerk**: User authentication and management (alternative option)

### Monitoring and Analytics
- **OpenTelemetry**: Application performance monitoring
- **Datadog**: Infrastructure and application monitoring
- **Custom webhook integrations**: For CI/CD pipeline triggers

The platform is designed with a "mock-first" approach for development, allowing each component to operate independently with realistic dummy data before full integration. This architectural decision enables parallel development across teams while maintaining system coherence.