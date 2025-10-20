/**
 * OAuth Routes - GitHub and Google Authentication Endpoints
 * Production-ready OAuth implementation with security best practices
 */

import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { OAuthService, OAuthUser } from '../services/oauth.service';
import { UserService } from '../services/user.service';
import { JWTService } from '../services/jwt.service';
import { DatabaseService } from '../services/database.service';

const oauth = new Hono();
const oauthService = OAuthService.getInstance();

// Environment validation
const validateOAuthEnv = (env: any) => {
  const required = ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'FRONTEND_URL'];
  const missing = required.filter(key => !env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing OAuth environment variables: ${missing.join(', ')}`);
  }
};

/**
 * GET /api/auth/github
 * Initiate GitHub OAuth flow
 */
oauth.get('/github', async (c) => {
  try {
    validateOAuthEnv(c.env);
    
    // Generate secure state parameter
    const state = oauthService.generateState();
    
    // Store state in secure cookie for validation
    setCookie(c, 'oauth_state', state, {
      httpOnly: true,
      secure: c.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 600, // 10 minutes
      path: '/'
    });
    
    // Generate GitHub OAuth URL
    const authUrl = oauthService.generateGitHubAuthUrl(c.env, state);
    
    return c.redirect(authUrl);
  } catch (error) {
    console.error('GitHub OAuth initiation error:', error);
    return c.json({ 
      success: false, 
      error: 'OAuth initialization failed' 
    }, 500);
  }
});

/**
 * GET /api/auth/github/callback
 * Handle GitHub OAuth callback
 */
oauth.get('/github/callback', async (c) => {
  try {
    validateOAuthEnv(c.env);
    
    const code = c.req.query('code');
    const state = c.req.query('state');
    const error = c.req.query('error');
    
    // Handle OAuth errors
    if (error) {
      console.error('GitHub OAuth error:', error);
      return c.redirect(`${c.env.FRONTEND_URL}/login?error=oauth_error`);
    }
    
    // Validate required parameters
    if (!code || !state) {
      return c.redirect(`${c.env.FRONTEND_URL}/login?error=missing_parameters`);
    }
    
    // Validate state parameter (CSRF protection)
    const storedState = getCookie(c, 'oauth_state');
    if (!storedState || !oauthService.validateState(state, storedState)) {
      return c.redirect(`${c.env.FRONTEND_URL}/login?error=invalid_state`);
    }
    
    // Clear state cookie
    setCookie(c, 'oauth_state', '', { maxAge: 0 });
    
    // Exchange code for access token
    const accessToken = await oauthService.getGitHubAccessToken(c.env, code);
    
    // Get user profile from GitHub
    const githubUser = await oauthService.getGitHubUser(accessToken);
    
    // Create or find user in database
    const user = await handleOAuthUser(githubUser, c.env);
    
    // Generate JWT token
    const jwtService = JWTService.getInstance();
    const token = await jwtService.generateToken(user, c.env.JWT_SECRET);
    
    // Set secure token cookie
    setCookie(c, 'auth_token', token, {
      httpOnly: true,
      secure: c.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });
    
    // Redirect to dashboard with success
    return c.redirect(`${c.env.FRONTEND_URL}/dashboard?auth=success`);
    
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    return c.redirect(`${c.env.FRONTEND_URL}/login?error=oauth_callback_failed`);
  }
});

/**
 * GET /api/auth/google
 * Initiate Google OAuth flow
 */
oauth.get('/google', async (c) => {
  try {
    validateOAuthEnv(c.env);
    
    // Generate secure state parameter
    const state = oauthService.generateState();
    
    // Store state in secure cookie for validation
    setCookie(c, 'oauth_state', state, {
      httpOnly: true,
      secure: c.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 600, // 10 minutes
      path: '/'
    });
    
    // Generate Google OAuth URL
    const authUrl = oauthService.generateGoogleAuthUrl(c.env, state);
    
    return c.redirect(authUrl);
  } catch (error) {
    console.error('Google OAuth initiation error:', error);
    return c.json({ 
      success: false, 
      error: 'OAuth initialization failed' 
    }, 500);
  }
});

/**
 * GET /api/auth/google/callback
 * Handle Google OAuth callback
 */
oauth.get('/google/callback', async (c) => {
  try {
    validateOAuthEnv(c.env);
    
    const code = c.req.query('code');
    const state = c.req.query('state');
    const error = c.req.query('error');
    
    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      return c.redirect(`${c.env.FRONTEND_URL}/login?error=oauth_error`);
    }
    
    // Validate required parameters
    if (!code || !state) {
      return c.redirect(`${c.env.FRONTEND_URL}/login?error=missing_parameters`);
    }
    
    // Validate state parameter (CSRF protection)
    const storedState = getCookie(c, 'oauth_state');
    if (!storedState || !oauthService.validateState(state, storedState)) {
      return c.redirect(`${c.env.FRONTEND_URL}/login?error=invalid_state`);
    }
    
    // Clear state cookie
    setCookie(c, 'oauth_state', '', { maxAge: 0 });
    
    // Exchange code for access token
    const tokenData = await oauthService.getGoogleAccessToken(c.env, code);
    
    // Get user profile from Google
    const googleUser = await oauthService.getGoogleUser(tokenData.access_token);
    
    // Create or find user in database
    const user = await handleOAuthUser(googleUser, c.env);
    
    // Generate JWT token
    const jwtService = JWTService.getInstance();
    const token = await jwtService.generateToken(user, c.env.JWT_SECRET);
    
    // Set secure token cookie
    setCookie(c, 'auth_token', token, {
      httpOnly: true,
      secure: c.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });
    
    // Redirect to dashboard with success
    return c.redirect(`${c.env.FRONTEND_URL}/dashboard?auth=success`);
    
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return c.redirect(`${c.env.FRONTEND_URL}/login?error=oauth_callback_failed`);
  }
});

/**
 * Handle OAuth user creation/retrieval
 */
async function handleOAuthUser(oauthUser: OAuthUser, env: any) {
  const userService = UserService.getInstance();
  const db = DatabaseService.getInstance().getDatabase(env);
  
  try {
    // Check if user exists by email
    let user = await userService.findByEmail(oauthUser.email, db);
    
    if (user) {
      // Update user with OAuth provider info if not already linked
      if (!user.oauth_providers?.includes(oauthUser.provider)) {
        const providers = user.oauth_providers ? 
          [...user.oauth_providers, oauthUser.provider] : 
          [oauthUser.provider];
        
        await userService.updateUser(user.id, {
          oauth_providers: providers,
          avatar_url: oauthUser.avatar_url || user.avatar_url,
          name: oauthUser.name || user.name
        }, db);
        
        user = { ...user, oauth_providers: providers };
      }
    } else {
      // Create new user from OAuth data
      const userData = {
        email: oauthUser.email,
        name: oauthUser.name,
        avatar_url: oauthUser.avatar_url,
        oauth_providers: [oauthUser.provider],
        provider_id: oauthUser.provider_id,
        email_verified: true, // OAuth emails are pre-verified
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      user = await userService.createUser(userData, db);
    }
    
    return user;
  } catch (error) {
    console.error('Error handling OAuth user:', error);
    throw new Error('Failed to create or retrieve user');
  }
}

export default oauth;