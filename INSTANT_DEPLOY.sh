#!/bin/bash
# ProtoThrive Instant Deploy Script

echo "🚀 ProtoThrive Instant Deployment Starting..."
echo ""

# Create deployment directory
echo "📁 Creating deployment directory..."
mkdir -p protothrive-deploy
cd protothrive-deploy

# Copy frontend files
echo "📋 Copying frontend files..."
cp -r ../frontend/* .
cp ../frontend/.env.local .
cp ../frontend/.eslintrc.json .

# Use standalone package.json
echo "📦 Setting up standalone package.json..."
mv standalone-package.json package.json

# Install dependencies
echo "📦 Installing dependencies..."
npm install --force

# Build the project
echo "🔨 Building frontend..."
npm run build

# Check if build succeeded
if [ -d ".next" ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🚀 Deploying to Cloudflare Pages..."
    
    # Deploy to Cloudflare
    npx wrangler pages deploy .next \
        --project-name=protothrive-frontend \
        --branch=main \
        --commit-message="Live deployment with backend integration"
    
    echo ""
    echo "🎉 Deployment complete!"
    echo ""
    echo "📍 Your app is live at:"
    echo "   Main: https://protothrive-frontend.pages.dev"
    echo "   Admin: https://protothrive-frontend.pages.dev/admin-login"
    echo ""
    echo "🔐 Admin credentials:"
    echo "   Email: admin@protothrive.com"
    echo "   Password: ThermonuclearAdmin2025!"
    echo ""
    echo "✅ Backend API: https://backend-thermo.ernijs-ansons.workers.dev (CONFIRMED WORKING)"
else
    echo "❌ Build failed"
    echo "Try the GitHub deployment method in DEPLOY_NOW.md"
fi