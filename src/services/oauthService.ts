import axios from 'axios';
import oauthConfig from '../configs/oauthConfig';

// Generate PKCE code verifier and challenge
const generatePKCE = async () => {
  const verifier = crypto.getRandomValues(new Uint8Array(32)).join('');
  const challenge = btoa(String.fromCharCode(...new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  ))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return { verifier, challenge };
};

const oauthService = {
  initiateAuth: async (provider: string) => {
    const { verifier, challenge } = await generatePKCE(); // Await the async function
    sessionStorage.setItem('pkce_verifier', verifier);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: oauthConfig.clientId,
      redirect_uri: oauthConfig.redirectUri,
      scope: oauthConfig.scope,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });

    const authUrl = `${oauthConfig.authUrl}?${params.toString()}`;
    window.location.href = authUrl; // Redirect to Keycloak auth page
  },

  handleCallback: async (code: string) => {
    const verifier = sessionStorage.getItem('pkce_verifier');
    if (!verifier) throw new Error('PKCE verifier missing');

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: oauthConfig.redirectUri,
      client_id: oauthConfig.clientId,
      client_secret: oauthConfig.clientSecret,
      code_verifier: verifier,
    });

    const response = await axios.post(oauthConfig.tokenUrl, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token } = response.data;
    localStorage.setItem('jwt', access_token);
    sessionStorage.removeItem('pkce_verifier');
    window.location.href = '/'; // Redirect to home
  },
};

export default oauthService;