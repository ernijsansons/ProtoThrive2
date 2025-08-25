# DevCommand - AI-First Multi-Tenant SaaS Platform

DevCommand is a revolutionary AI-powered platform that transforms how teams build, manage, and deploy software projects. With our Living ERP Graph technology and multi-agent automation, we enable continuous improvement and intelligent project management.

## 🚀 Features

### Core Features (P0)
- **Magic Canvas**: Interactive 3D/2D roadmap visualization with React Flow and Spline
- **Drag & Drop Templates**: Pre-built components for rapid development
- **Real-time Collaboration**: WebSocket-powered multi-user editing
- **AI-Powered Insights**: Continuous project analysis and recommendations
- **Thrive Score**: Real-time project health metrics

### AI Capabilities
- **Multi-Agent System**: CrewAI and LangChain powered automation
- **Intelligent Planning**: AI-driven project roadmap generation
- **Code Generation**: Context-aware code suggestions
- **Continuous Auditing**: Automated security and performance checks
- **Smart Deployment**: One-click deployment with AI optimization

### Technical Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Cloudflare Workers, Hono, D1 Database
- **Real-time**: Durable Objects, WebSockets
- **AI Models**: Claude, Kimi, uxpilot.ai
- **3D Graphics**: Spline, Three.js
- **Authentication**: Clerk
- **Payments**: Stripe
- **Monitoring**: OpenTelemetry, Datadog

## 📋 Prerequisites

- Node.js 18+ and pnpm
- Cloudflare account with Workers paid plan
- Clerk account for authentication
- Stripe account for payments
- Access to AI API keys (Claude, etc.)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/devcommand.git
   cd devcommand
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Backend (.dev.vars):
   ```bash
   cp backend/.dev.vars.example backend/.dev.vars
   # Edit with your actual keys
   ```
   
   Frontend (.env.local):
   ```bash
   cp frontend/.env.example frontend/.env.local
   # Edit with your actual keys
   ```

4. **Initialize the database**
   ```bash
   cd backend
   wrangler d1 create devcommand
   wrangler d1 execute devcommand --file=./infrastructure/cloudflare/schema.sql
   ```

5. **Create KV namespaces**
   ```bash
   wrangler kv:namespace create CACHE
   wrangler kv:namespace create SNIPPETS
   ```

## 🚀 Development

1. **Start the backend**
   ```bash
   cd backend
   pnpm dev
   ```

2. **Start the frontend**
   ```bash
   cd frontend
   pnpm dev
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8787
   - GraphQL Playground: http://localhost:8787/graphql

## 📦 Project Structure

```
devcommand/
├── backend/                 # Cloudflare Workers backend
│   ├── src/
│   │   ├── index.ts        # Main entry point
│   │   ├── services/       # API services
│   │   ├── middleware/     # Auth, rate limiting, etc.
│   │   ├── durable-objects/# WebSocket rooms
│   │   └── types/          # TypeScript types
│   ├── wrangler.toml       # Cloudflare config
│   └── package.json
├── frontend/               # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   │   └── canvas/       # Magic Canvas components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities
│   └── package.json
├── shared/                # Shared types and utilities
│   ├── src/
│   │   ├── types/        # Zod schemas
│   │   └── utils/        # Common utilities
│   └── package.json
└── infrastructure/        # Deployment configs
    ├── cloudflare/       # D1 schema, wrangler configs
    └── docker/           # Docker configurations
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific workspace tests
pnpm --filter backend test
pnpm --filter frontend test

# E2E tests
pnpm test:e2e
```

## 🚢 Deployment

### Backend Deployment
```bash
cd backend
pnpm deploy:production
```

### Frontend Deployment
```bash
cd frontend
pnpm build
# Deploy to Vercel/Cloudflare Pages
```

## 🔐 Security

- All API endpoints require authentication via Clerk
- Multi-tenant data isolation at database level
- Rate limiting via Durable Objects
- Input validation with Zod schemas
- Encrypted environment variables

## 📊 Monitoring

- OpenTelemetry instrumentation
- Datadog APM integration
- Sentry error tracking
- Custom analytics via Cloudflare Analytics Engine

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with Cloudflare Workers for edge computing
- UI components from shadcn/ui
- 3D graphics powered by Spline
- AI capabilities via Anthropic Claude

## 📞 Support

- Documentation: https://docs.devcommand.com
- Discord: https://discord.gg/devcommand
- Email: support@devcommand.com