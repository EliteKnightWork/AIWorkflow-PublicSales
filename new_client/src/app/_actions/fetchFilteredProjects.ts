'use server';

import { searchProjects } from '@/api/generated/endpoints/projects';
import type { ProjectStatusTab, SearchFilterPreset } from '@/api/generated/models';
import { convertToSearchProjectParam } from '@/api/lib/searchFilterPreset';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import { getServerAccessToken } from '@/lib/getServerAccessToken';

export async function fetchFilteredProjects(preset: SearchFilterPreset, tab?: ProjectStatusTab) {
  try {
    const accessToken = await getServerAccessToken();
    const projects = await searchProjects(
      {
        ...convertToSearchProjectParam(preset),
        ...(tab ? { tab } : {}),
      },
      {
        headers: {
          ...accessToken,
        },
      }
    );
    return projects.projects || [];
  } catch (e) {
    const message = getApiErrorMessage(e);
    return { error: message };
  }
}
