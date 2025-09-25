const oauthConfig = {
  authUrl: process.env.REACT_APP_OAUTH_AUTH_URL || 'http://localhost:8073/realms/atozmart/protocol/openid-connect/auth',
  tokenUrl: process.env.REACT_APP_OAUTH_TOKEN_URL || 'http://localhost:8073/realms/atozmart/protocol/openid-connect/token',
  clientId: process.env.REACT_APP_OAUTH_CLIENT_ID || 'atozmart-ui',
  clientSecret: process.env.REACT_APP_OAUTH_CLIENT_SECRET || 'jDeHtG8qdGcnQm3z5yLEwI0QLbXBEpgH',
  redirectUri: process.env.REACT_APP_OAUTH_REDIRECT_URI || 'http://localhost:3000/oauth-callback',
  scope: 'openid profile email', // Common scopes for Keycloak
};

export default oauthConfig;