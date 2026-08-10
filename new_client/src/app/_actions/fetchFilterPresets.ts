'use server';

import { getSearchFilterPresets } from '@/api/generated/endpoints/search-filter-presets';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import { getServerAccessToken } from '@/lib/getServerAccessToken';
import type { ProjectType } from '../(content)/projects/types';

export async function fetchFilterPresets(projectType?: ProjectType, recommended?: boolean) {
  try {
    const accessToken = await getServerAccessToken();
    const res = await getSearchFilterPresets(
      {
        ...(projectType ? { projectType } : {}),
        ...(recommended ? { recommended } : {}),
      },
      {
        headers: {
          ...accessToken,
        },
      }
    );
    return res.searchFilterPresets || [];
  } catch (e) {
    const message = getApiErrorMessage(e);
    return { error: message };
  }
}
