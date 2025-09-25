# Contributing to ProtoThrive

Thank you for your interest in contributing to ProtoThrive! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Process](#contributing-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@protothrive.com.

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.12+
- Docker and Docker Compose
- Git
- Cloudflare Wrangler CLI (for backend development)

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/ProtoThrive2.git
   cd ProtoThrive2
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Backend
   cd ../backend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start development servers**
   ```bash
   # Frontend (from frontend directory)
   npm run dev
   
   # Backend (from backend directory)
   npm run dev
   ```

## Contributing Process

### 1. Create an Issue

Before starting work, please:
- Check existing issues to avoid duplicates
- Create an issue describing your proposed changes
- Wait for maintainer approval before starting work

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 3. Make Changes

- Follow the coding standards
- Write tests for new functionality
- Update documentation as needed
- Ensure all tests pass

### 4. Commit Changes

Use conventional commit messages:

```
feat: add new feature
fix: resolve bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add or update tests
chore: maintenance tasks
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a pull request using the provided template.

## Coding Standards

### Frontend (Next.js/TypeScript)

- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Use functional components with hooks
- Implement proper error boundaries
- Follow accessibility guidelines (WCAG 2.1)

### Backend (Cloudflare Workers/TypeScript)

- Use TypeScript for all code
- Follow Hono framework patterns
- Implement proper error handling
- Use environment variables for configuration
- Follow security best practices

### General

- Write self-documenting code
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Follow DRY (Don't Repeat Yourself) principle

## Testing

### Frontend Testing

```bash
cd frontend
npm test              # Run unit tests
npm run test:e2e      # Run end-to-end tests
npm run test:a11y     # Run accessibility tests
```

### Backend Testing

```bash
cd backend
npm test              # Run unit tests
npm run test:integration  # Run integration tests
```

### Test Requirements

- All new features must have tests
- Maintain at least 80% code coverage
- Write both unit and integration tests
- Include accessibility tests for UI components

## Pull Request Process

### Before Submitting

- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] No console.log statements
- [ ] No sensitive data in code
- [ ] Branch is up to date with main

### PR Template

Use the provided pull request template and fill out all sections.

### Review Process

1. Automated checks must pass
2. At least one maintainer review required
3. Address all feedback
4. Maintainer will merge when ready

## Issue Guidelines

### Bug Reports

Use the bug report template and include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots if applicable

### Feature Requests

Use the feature request template and include:
- Clear description of the feature
- Use case and motivation
- Proposed solution
- Alternative solutions considered
- Acceptance criteria

### Security Issues

**Do not create public issues for security vulnerabilities.** Use the security vulnerability template or email security@protothrive.com.

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test improvements

### Commit Messages

Follow conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

### Release Process

1. Version bump in package.json
2. Update CHANGELOG.md
3. Create release notes
4. Tag release
5. Deploy to production

## Getting Help

- **Documentation**: Check the README and docs folder
- **Issues**: Search existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions
- **Email**: contact@protothrive.com

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

Thank you for contributing to ProtoThrive! 🚀
