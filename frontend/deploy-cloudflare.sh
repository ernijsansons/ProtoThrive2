#!/bin/bash
# Thermonuclear Cloudflare Pages Deployment

echo "🚀 Thermonuclear Deployment: ProtoThrive Frontend to Cloudflare Pages"
echo ""

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "Error: Not in frontend directory"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
fi

# Build the project
echo "🔨 Building frontend..."
npm run build

# Check if build was successful
if [ ! -d ".next" ]; then
    echo "❌ Build failed - no .next directory found"
    exit 1
fi

# Deploy to Cloudflare Pages
echo "☁️  Deploying to Cloudflare Pages..."
npx wrangler pages deploy .next \
    --project-name=protothrive-frontend \
    --branch=main \
    --commit-message="Thermonuclear deployment with admin portal"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔗 Your frontend will be available at:"
echo "   https://protothrive-frontend.pages.dev"
echo ""
echo "🔐 Admin Portal:"
echo "   https://protothrive-frontend.pages.dev/admin-login"
echo "   Email: admin@protothrive.com"
echo "   Password: ThermonuclearAdmin2025!"
echo ""
echo "📝 Next steps:"
echo "1. Visit the admin portal"
echo "2. Add your API keys"
echo "3. Start building with ProtoThrive!"