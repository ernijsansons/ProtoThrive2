# Cloudflare Workers Dockerfile for ProtoThrive Backend
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache libc6-compat curl

# Install Wrangler CLI globally
RUN npm install -g wrangler@latest

# Development stage
FROM base AS development
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Build arguments for Cloudflare configuration
ARG CLOUDFLARE_ACCOUNT_ID
ARG CLOUDFLARE_API_TOKEN
ARG ENVIRONMENT=development

# Set environment variables
ENV CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID
ENV CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN
ENV ENVIRONMENT=$ENVIRONMENT
ENV NODE_ENV=development

# Expose port for local development
EXPOSE 8787

# Health check for development
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8787/health || exit 1

# Run wrangler dev for local development
CMD ["wrangler", "dev", "--port", "8787", "--host", "0.0.0.0", "--local"]

# Production build stage
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build arguments
ARG CLOUDFLARE_ACCOUNT_ID
ARG CLOUDFLARE_API_TOKEN
ARG ENVIRONMENT=production

# Set environment variables
ENV CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID
ENV CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN
ENV ENVIRONMENT=$ENVIRONMENT

# Build the TypeScript worker
RUN npm run build

# Production stage (for local testing of built worker)
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 worker
RUN adduser --system --uid 1001 worker

# Copy built application and configuration
COPY --from=builder --chown=worker:worker /app/dist ./dist
COPY --from=builder --chown=worker:worker /app/wrangler.toml ./wrangler.toml
COPY --from=builder --chown=worker:worker /app/package.json ./package.json
COPY --from=builder --chown=worker:worker /app/node_modules ./node_modules

USER worker

EXPOSE 8787

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8787/health || exit 1

# For production, we would typically deploy to Cloudflare Workers
# This CMD is for local testing of the built worker
CMD ["wrangler", "dev", "--port", "8787", "--host", "0.0.0.0", "--local"]