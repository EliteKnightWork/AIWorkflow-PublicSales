import { cache } from 'react';
import { getCompanyMembers } from '@/api/generated/endpoints/companies';
import { getServerAccessToken } from './getServerAccessToken';

export const getCachedCompanyMembers = cache(async () => {
  const accessToken = await getServerAccessToken();

  if (!accessToken) {
    return { members: [] };
  }

  try {
    return await getCompanyMembers({
      headers: {
        ...accessToken,
      },
    });
  } catch (error: any) {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      return { members: [] };
    }
    throw error;
  }
});
