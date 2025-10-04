# Multi-stage Dockerfile for ProtoThrive Backend
# Optimized for Cloudflare Workers development and testing

# Stage 1: Build environment
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/
COPY migrations/ ./migrations/

# Build TypeScript
RUN npm run build

# Stage 2: Development environment
FROM node:20-alpine AS development

WORKDIR /app

# Install wrangler globally
RUN npm install -g wrangler@4.40.2

# Copy package files and install all dependencies (including dev)
COPY package*.json ./
RUN npm ci

# Copy source and build files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/migrations ./migrations
COPY tsconfig.json ./
COPY wrangler.toml ./

# Create .dev.vars template
RUN echo 'JWT_SECRET=development_jwt_secret_minimum_64_chars_for_security_compliance_test' > .dev.vars && \
    echo 'NODE_ENV=development' >> .dev.vars

# Expose wrangler dev port
EXPOSE 8787

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8787/health || exit 1

# Default command
CMD ["npm", "run", "dev"]

# Stage 3: Production build (for testing deployment)
FROM node:20-alpine AS production

WORKDIR /app

# Install wrangler globally
RUN npm install -g wrangler@4.40.2

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations
COPY wrangler.toml ./

# Set production environment
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Command for production deployment
CMD ["wrangler", "deploy", "--env", "production"]