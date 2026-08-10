import type { Project } from '@/api/generated/models';
import { ProjectStatusTab, type SearchFilterPreset } from '@/api/generated/models';
import { fetchFilteredProjects } from '@/app/_actions/fetchFilteredProjects';
import { fetchFilterPresets } from '@/app/_actions/fetchFilterPresets';
import { ProjectType } from '@/app/(content)/projects/types';
import { FilteredProjectListContainer } from './container';

export default async function FilteredProjectList() {
  const presets = await fetchFilterPresets();

  if (presets && 'error' in presets) {
    return <FilteredProjectListContainer initialPresets={[]} initialProjects={[]} />;
  }

  const projectPresets: SearchFilterPreset[] = presets
    .filter((preset) => preset.projectType === ProjectType.PROJECT)
    .sort((a, b) => (a.id ?? 0) - (b.id ?? 0));

  const initialPreset = projectPresets[0];

  let projects: Project[] = [];

  if (initialPreset?.id) {
    const fetchedProjects = await fetchFilteredProjects(initialPreset, ProjectStatusTab.new);
    if (!('error' in fetchedProjects)) {
      projects = fetchedProjects;
    }
  }

  return (
    <FilteredProjectListContainer
      initialPresets={projectPresets}
      initialProjects={projects}
      initialPresetId={initialPreset?.id}
    />
  );
}
