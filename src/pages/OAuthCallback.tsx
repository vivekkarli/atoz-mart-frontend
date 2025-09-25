import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import oauthService from '../services/oauthService';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');

  useEffect(() => {
    if (code) {
      oauthService.handleCallback(code).catch((error) => {
        console.error('OAuth callback error', error);
        window.location.href = '/login'; // Redirect to login on failure
      });
    }
  }, [code]);

  return <div>Processing authentication...</div>;
};

export default OAuthCallback;