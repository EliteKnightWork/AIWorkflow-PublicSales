import { Auth0Client } from '@auth0/nextjs-auth0/server';
import { cache } from 'react';

export const auth0 = new Auth0Client({
  logoutStrategy: 'v2',
  signInReturnToPath: '/mypage',
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: process.env.AUTH0_SCOPE,
  },
});

export const getCachedSession = cache(() => auth0.getSession());
