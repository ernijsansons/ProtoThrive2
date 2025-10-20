# 🔐 OAUTH SETUP GUIDE - GitHub & Google

## **STEP 1: GitHub OAuth App Setup**

### **1.1 Create GitHub OAuth App**
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in details:
   ```
   Application name: ProtoThrive
   Homepage URL: https://your-domain.com
   Authorization callback URL: https://your-domain.com/api/auth/github/callback
   ```
4. Save the Client ID and Client Secret

### **1.2 GitHub Environment Variables**
```bash
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

---

## **STEP 2: Google OAuth Setup**

### **2.1 Create Google Cloud Project**
1. Go to Google Cloud Console
2. Create new project or select existing
3. Enable Google+ API and OAuth 2.0

### **2.2 Configure OAuth Consent Screen**
1. Go to APIs & Services → OAuth consent screen
2. Choose External user type
3. Fill in app information:
   ```
   App name: ProtoThrive
   User support email: your-email@domain.com
   Developer contact: your-email@domain.com
   ```

### **2.3 Create OAuth 2.0 Credentials**
1. Go to APIs & Services → Credentials
2. Create OAuth 2.0 Client ID
3. Choose Web application
4. Add authorized redirect URIs:
   ```
   https://your-domain.com/api/auth/google/callback
   http://localhost:3000/api/auth/google/callback (for development)
   ```

### **2.4 Google Environment Variables**
```bash
GOOGLE_CLIENT_ID=your_google_client_id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

## **STEP 3: Backend Integration**

### **3.1 Update wrangler.toml**
```toml
[env.production.vars]
GITHUB_CLIENT_ID = "your_github_client_id"
GOOGLE_CLIENT_ID = "your_google_client_id.googleusercontent.com"
FRONTEND_URL = "https://your-domain.com"

[env.production.secrets]
GITHUB_CLIENT_SECRET = "your_github_client_secret"
GOOGLE_CLIENT_SECRET = "your_google_client_secret"
```

### **3.2 Add OAuth Routes to main app**
```typescript
// In backend/src/index.ts
import oauth from './routes/oauth.routes';

app.route('/api/auth', oauth);
```

---

## **STEP 4: Database Schema Updates**

### **4.1 Add OAuth fields to users table**
```sql
ALTER TABLE users ADD COLUMN oauth_providers TEXT;
ALTER TABLE users ADD COLUMN provider_id TEXT;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
```

---

## **STEP 5: Frontend Integration**

### **5.1 Update Login Page**
```typescript
// Replace social auth section in login.tsx
import { SocialAuthSection } from '../components/SocialAuth';

// Replace the static buttons with:
<SocialAuthSection />
```

### **5.2 Update Register Page**
```typescript
// Replace social auth section in register.tsx
import { SocialAuthSection } from '../components/SocialAuth';

// Replace the static buttons with:
<SocialAuthSection />
```

---

## **STEP 6: Production Deployment**

### **6.1 Set Cloudflare Secrets**
```bash
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put JWT_SECRET
```

### **6.2 Deploy Backend**
```bash
cd backend
wrangler deploy --env production
```

### **6.3 Update Frontend URLs**
Update any hardcoded localhost URLs to production URLs.

---

## **STEP 7: Testing**

### **7.1 Test OAuth Flow**
1. Go to login page
2. Click "GitHub" or "Google"
3. Complete OAuth authorization
4. Verify redirect to dashboard
5. Check user created in database

### **7.2 Error Testing**
1. Test with invalid state parameter
2. Test OAuth cancellation
3. Test network errors
4. Verify error messages display correctly

---

## **SECURITY CHECKLIST**

- ✅ State parameter validation (CSRF protection)
- ✅ Secure cookie settings (httpOnly, sameSite)
- ✅ Environment variable protection
- ✅ OAuth scope limitation
- ✅ Token expiration handling
- ✅ Error message sanitization

---

## **PRODUCTION READY**

After completing all steps, your OAuth implementation will be:
- ✅ **Secure**: Industry-standard security practices
- ✅ **Scalable**: Handles multiple OAuth providers
- ✅ **User-friendly**: Smooth authentication experience  
- ✅ **Maintainable**: Clean, documented code
- ✅ **Enterprise-ready**: Production-grade implementation