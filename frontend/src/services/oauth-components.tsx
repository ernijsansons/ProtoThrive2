import React from 'react';
import { OAuthService } from '../services/oauth-service';

interface OAuthButtonProps {
  provider: 'google' | 'github' | 'microsoft';
  onSuccess: (user: any) => void;
  onError: (error: Error) => void;
}

export const OAuthButton: React.FC<OAuthButtonProps> = ({
  provider,
  onSuccess,
  onError
}) => {
  const handleOAuthLogin = async () => {
    try {
      const authUrl = await OAuthService.initiateAuth(provider);
      window.location.href = authUrl;
    } catch (error) {
      onError(error as Error);
    }
  };
  
  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return '🔍';
      case 'github':
        return '🐙';
      case 'microsoft':
        return '🪟';
      default:
        return '🔐';
    }
  };
  
  const getProviderName = (provider: string) => {
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  };
  
  return (
    <button
      onClick={handleOAuthLogin}
      className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <span className="mr-2">{getProviderIcon(provider)}</span>
      Continue with {getProviderName(provider)}
    </button>
  );
};

export const OAuthCallback: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const provider = urlParams.get('provider') as 'google' | 'github' | 'microsoft';
      
      if (!code || !state || !provider) {
        setError('Invalid OAuth callback parameters');
        setLoading(false);
        return;
      }
      
      try {
        const user = await OAuthService.handleCallback(provider, code, state);
        // Handle successful authentication
        console.log('OAuth authentication successful:', user);
        // Redirect to dashboard or handle user session
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };
    
    handleCallback();
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Completing authentication...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }
  
  return null;
};
