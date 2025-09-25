# ProtoThrive Authentication Setup Guide

## 🔧 Firebase OAuth Configuration

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or use existing project
3. Enter project name: `protothrive-production`
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Authentication
1. In Firebase console, click "Authentication" in left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable **Google** provider:
   - Click on Google
   - Toggle "Enable"
   - Enter your project's public-facing name
   - Select support email
   - Click "Save"
5. Enable **GitHub** provider:
   - Click on GitHub
   - Toggle "Enable"
   - Add GitHub OAuth App credentials (see GitHub setup below)
   - Click "Save"

### Step 3: Configure OAuth Domains
1. In "Sign-in method" tab, scroll down to "Authorized domains"
2. Add your production domains:
   - `protothrive-frontend.pages.dev`
   - Your custom domain (if any)
   - `localhost` (for development)

### Step 4: Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" > Web app icon
4. Enter app nickname: "ProtoThrive Frontend"
5. Copy the config values to your `.env.local` file

## 🐙 GitHub OAuth App Setup

### Step 1: Create GitHub OAuth App
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: ProtoThrive
   - **Homepage URL**: `https://your-domain.com`
   - **Authorization callback URL**: `https://your-project-id.firebaseapp.com/__/auth/handler`
4. Click "Register application"
5. Copy Client ID and Client Secret to Firebase GitHub provider settings

## 🔑 Environment Configuration

Create `frontend/.env.local`:

```bash
# Real Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAbc123...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Disable mock authentication
NEXT_PUBLIC_USE_MOCK_AUTH=false
```

## 🧪 Testing Authentication

### Development Mode (Mock):
```bash
# Enable mock mode for testing
NEXT_PUBLIC_USE_MOCK_AUTH=true
```

### Production Mode (Real):
```bash
# Use real Firebase authentication
NEXT_PUBLIC_USE_MOCK_AUTH=false
# or omit the variable entirely
```

## 🔒 Security Considerations

1. **Never commit real API keys** to version control
2. Use **environment-specific** configurations
3. Add **authorized domains** only for trusted domains
4. Monitor **authentication logs** in Firebase console
5. Set up **rate limiting** for auth endpoints

## 🚨 Troubleshooting

### Common Issues:

**"Popup blocked"**
- User needs to allow popups for your domain
- App shows helpful error message

**"Authentication cancelled"**
- User closed popup before completing auth
- App shows retry option

**"Account exists with different credential"**
- User previously signed up with different provider
- Need to link accounts or use original provider

**Mock auth still running**
- Check `NEXT_PUBLIC_USE_MOCK_AUTH` environment variable
- Verify Firebase config is properly set
- Check browser console for configuration warnings

## 🎯 Expected Behavior

✅ **Real Authentication:**
- Google/GitHub popup appears
- User must grant permissions
- Real user data returned
- Proper session management

❌ **Mock Authentication (old behavior):**
- No popup appears
- Fake user automatically logged in
- No real security validation