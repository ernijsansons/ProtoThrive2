/**
 * OAuth Service - Complete Social Authentication Implementation
 * Supports GitHub and Google OAuth with secure JWT integration
 */

export interface OAuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  provider: 'github' | 'google';
  provider_id: string;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

export class OAuthService {
  private static instance: OAuthService;
  
  public static getInstance(): OAuthService {
    if (!OAuthService.instance) {
      OAuthService.instance = new OAuthService();
    }
    return OAuthService.instance;
  }

  // GitHub OAuth Configuration
  private getGitHubConfig(env: any): OAuthConfig {
    return {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      redirectUri: `${env.FRONTEND_URL}/api/auth/github/callback`,
      scope: ['user:email', 'read:user']
    };
  }

  // Google OAuth Configuration
  private getGoogleConfig(env: any): OAuthConfig {
    return {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      redirectUri: `${env.FRONTEND_URL}/api/auth/google/callback`,
      scope: ['openid', 'email', 'profile']
    };
  }

  // Generate OAuth URL for GitHub
  generateGitHubAuthUrl(env: any, state: string): string {
    const config = this.getGitHubConfig(env);
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope.join(' '),
      state,
      response_type: 'code'
    });
    
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  // Generate OAuth URL for Google
  generateGoogleAuthUrl(env: any, state: string): string {
    const config = this.getGoogleConfig(env);
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope.join(' '),
      state,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });
    
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Exchange GitHub code for access token
  async getGitHubAccessToken(env: any, code: string): Promise<string> {
    const config = this.getGitHubConfig(env);
    
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`GitHub OAuth error: ${data.error_description}`);
    }
    
    return data.access_token;
  }

  // Exchange Google code for access token
  async getGoogleAccessToken(env: any, code: string): Promise<any> {
    const config = this.getGoogleConfig(env);
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Google OAuth error: ${data.error_description}`);
    }
    
    return data;
  }

  // Get GitHub user profile
  async getGitHubUser(accessToken: string): Promise<OAuthUser> {
    // Get user profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'ProtoThrive-App',
      },
    });
    
    const userData = await userResponse.json();
    
    // Get user emails
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'ProtoThrive-App',
      },
    });
    
    const emailData = await emailResponse.json();
    const primaryEmail = emailData.find((email: any) => email.primary)?.email || userData.email;
    
    return {
      id: userData.id.toString(),
      email: primaryEmail,
      name: userData.name || userData.login,
      avatar_url: userData.avatar_url,
      provider: 'github',
      provider_id: userData.id.toString(),
    };
  }

  // Get Google user profile
  async getGoogleUser(accessToken: string): Promise<OAuthUser> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    const userData = await response.json();
    
    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      avatar_url: userData.picture,
      provider: 'google',
      provider_id: userData.id,
    };
  }

  // Generate secure state parameter
  generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Validate state parameter
  validateState(receivedState: string, expectedState: string): boolean {
    return receivedState === expectedState;
  }
}