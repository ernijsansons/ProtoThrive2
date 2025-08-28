import { oauthConfig, OAuthUser } from './oauth-config';

export class OAuthService {
  static async initiateAuth(provider: keyof typeof oauthConfig.providers): Promise<string> {
    const config = oauthConfig.providers[provider];
    const state = this.generateState();
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope,
      response_type: 'code',
      state: state
    });
    
    // Store state for verification
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('oauth_state', state);
    }
    
    return `${config.authorizationUrl}?${params.toString()}`;
  }
  
  static async handleCallback(
    provider: keyof typeof oauthConfig.providers,
    code: string,
    state: string
  ): Promise<OAuthUser> {
    // Verify state
    const storedState = sessionStorage.getItem('oauth_state');
    if (state !== storedState) {
      throw new Error('Invalid OAuth state');
    }
    
    const config = oauthConfig.providers[provider];
    
    // Exchange code for token
    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: code,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code'
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    // Get user info
    const userInfo = await this.getUserInfo(provider, tokenData.access_token);
    
    return {
      ...userInfo,
      provider
    };
  }
  
  private static async getUserInfo(provider: string, accessToken: string): Promise<any> {
    const endpoints = {
      google: 'https://www.googleapis.com/oauth2/v2/userinfo',
      github: 'https://api.github.com/user',
      microsoft: 'https://graph.microsoft.com/v1.0/me'
    };
    
    const response = await fetch(endpoints[provider], {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    return response.json();
  }
  
  private static generateState(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
