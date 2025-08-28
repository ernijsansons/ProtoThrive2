# ProtoThrive - AI-First SaaS Platform

## 🚀 Overview

ProtoThrive is a comprehensive AI-first SaaS platform that serves as a unified mission control for software engineering. Built with modern technologies and best practices.

## 🏗️ Architecture

- **Frontend**: Next.js with TypeScript and React
- **Backend**: Python FastAPI with CrewAI multi-agent automation
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Deployment**: Cloudflare Workers + Vercel
- **AI**: Anthropic Claude + OpenAI integration

## 🛠️ Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL
- Cloudflare account
- Vercel account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ProtoThrive2
   ```

2. **Set up Python environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

4. **Set up frontend**
   ```bash
   cd app-frontend
   npm install
   ```

5. **Run development servers**
   ```bash
   # Backend
   uvicorn main:app --reload
   
   # Frontend
   cd app-frontend
   npm run dev
   ```

## 🔧 Development

### Code Quality
- **Python**: Pylint, Black, MyPy
- **TypeScript**: ESLint, Prettier
- **Testing**: Pytest, Jest

### Running Tests
```bash
# Python tests
pytest

# Frontend tests
cd app-frontend
npm test
```

### Linting
```bash
# Python
pylint src/
black src/

# TypeScript
cd app-frontend
npm run lint
```

## 🚀 Deployment

### Staging
```bash
python deploy-protothrive.py --environment staging
```

### Production
```bash
python deploy-protothrive.py --environment production
```

## 📊 Features

- **Multi-Agent AI Automation**: CrewAI-powered agents for planning, coding, auditing, and deployment
- **Living ERP Graph**: 3D visual roadmap with React Flow and Spline
- **Thrive Score**: Real-time project health metrics
- **Security**: OAuth2, 2FA, JWT authentication
- **Performance**: Optimized React components, caching, and database queries
- **Monitoring**: Comprehensive logging and alerting

## 🔒 Security

- OAuth2 authentication
- Two-factor authentication (2FA)
- JWT token management
- Input validation and sanitization
- Rate limiting
- Vulnerability scanning

## 📈 Performance

- React component optimization
- Database query optimization
- Caching strategies (Redis)
- CDN integration
- Bundle size optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the CLAUDE.md file for detailed specifications

---

**Built with ❤️ by the ProtoThrive Team**
