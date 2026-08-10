'use server';

import { getRecommendations } from '@/api/generated/endpoints/recommendations';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import { getServerAccessToken } from '@/lib/getServerAccessToken';

export async function fetchRecommendProjects(presetId: number, size?: number) {
  try {
    const accessToken = await getServerAccessToken();
    const res = await getRecommendations(
      {
        searchFilterPresetId: presetId,
        ...(size ? { size } : {}),
      },
      {
        headers: {
          ...accessToken,
        },
      }
    );
    return res.projects || [];
  } catch (e) {
    const message = getApiErrorMessage(e);
    return { error: message };
  }
}
