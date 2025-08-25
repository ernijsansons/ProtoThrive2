#!/bin/bash
# Thermonuclear Frontend Deployment Script

echo "Thermonuclear Deployment: Initializing frontend build..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install --legacy-peer-deps
fi

# Build the frontend
echo "Building frontend..."
npm run build

echo "Thermonuclear Deployment: Build complete!"
echo ""
echo "To deploy to Vercel:"
echo "1. Install Vercel CLI: npm i -g vercel"
echo "2. Run: vercel --prod"
echo ""
echo "To deploy to Cloudflare Pages:"
echo "1. Push to GitHub"
echo "2. Connect repository in Cloudflare Pages dashboard"
echo "3. Build command: npm run build"
echo "4. Build output: .next"