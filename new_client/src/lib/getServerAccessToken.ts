import { AccessTokenError } from '@auth0/nextjs-auth0/errors';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { auth0 } from './auth0';

export const getServerAccessToken = cache(
  async (no_redirect?: boolean): Promise<{ Authorization: string } | undefined> => {
    try {
      const { token } = await auth0.getAccessToken();

      if (!token) {
        return undefined;
      }

      return {
        Authorization: `Bearer ${token}`,
      };
    } catch (error) {
      // TODO: エラーハンドリング
      if (error instanceof AccessTokenError) {
        console.log('AccessTokenError:', error.message);
      } else {
        console.log('Error retrieving access token:', error);
      }
      if (no_redirect) {
        return undefined;
      }
      redirect('/login');
    }
  }
);
