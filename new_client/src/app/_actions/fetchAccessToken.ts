'use server';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import { getServerAccessToken } from '@/lib/getServerAccessToken';

export async function fetchAccessToken() {
  try {
    const bearerToken = await getServerAccessToken();
    return bearerToken;
  } catch (e) {
    const message = getApiErrorMessage(e);
    return { error: message };
  }
}
