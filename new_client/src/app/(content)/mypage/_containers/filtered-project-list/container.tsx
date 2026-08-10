'use client';
import { useEffect, useRef, useState } from 'react';
import { type Project, ProjectStatusTab, type SearchFilterPreset } from '@/api/generated/models';
import { fetchFilteredProjects } from '@/app/_actions/fetchFilteredProjects';
import { ProjectType } from '@/app/(content)/projects/types';
import { useSearchFilterPreset } from '@/context/SearchFilterPresetContext';
import FilteredProjectListPresentational from './presentational';

type Props = {
  initialPresets: SearchFilterPreset[];
  initialProjects: Project[];
  initialPresetId?: number | null;
};

export const FilteredProjectListContainer = ({
  initialPresets,
  initialProjects,
  initialPresetId,
}: Props) => {
  const [isExpand, setIsExpand] = useState(true);
  const [presets, setPresets] = useState<SearchFilterPreset[]>(initialPresets);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const initialSelectedPreset =
    initialPresets.find((preset) => preset.id === initialPresetId) ?? initialPresets[0];
  const [selectedPresetId, setSelectedPresetId] = useState<number | undefined>(
    initialSelectedPreset?.id ?? undefined
  );
  const [loading, setLoading] = useState(false);

  const { presets: allPresets, isLoading: isLoadingSearchFilterPresets } = useSearchFilterPreset();
  const skipInitialSyncRef = useRef(initialPresets.length > 0);
  const selectedPreset = presets.find((preset) => preset.id === selectedPresetId) ?? undefined;

  useEffect(() => {
    if (skipInitialSyncRef.current) {
      skipInitialSyncRef.current = false;
      return;
    }

    if (allPresets.length > 0) {
      const filteredPresets = allPresets
        .filter((preset) => preset.projectType === ProjectType.PROJECT)
        .sort((a, b) => (a.id ?? 0) - (b.id ?? 0));

      setPresets(filteredPresets);

      const hasSelectedPreset = filteredPresets.some((preset) => preset.id === selectedPresetId);

      if (hasSelectedPreset) {
        setLoading(false);
        return;
      }

      const initPreset = filteredPresets[0];
      setSelectedPresetId(initPreset?.id ?? undefined);

      if (initPreset?.id) {
        setLoading(true);
        fetchFilteredProjects(initPreset, ProjectStatusTab.new)
          .then((res) => {
            if (!('error' in res)) {
              setProjects(res);
            }
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setProjects([]);
        setLoading(false);
      }
    } else if (!isLoadingSearchFilterPresets) {
      setLoading(false);
      setPresets([]);
      setSelectedPresetId(undefined);
      setProjects([]);
    }
  }, [allPresets, isLoadingSearchFilterPresets, selectedPresetId]);

  const handleSelectedPreset = async (preset: SearchFilterPreset | undefined, expand = true) => {
    setSelectedPresetId(preset?.id ?? undefined);
    if (!preset) {
      setProjects([]);
      return;
    }

    setLoading(true);
    const fetchedProjects = await fetchFilteredProjects(preset, ProjectStatusTab.new);

    if ('error' in fetchedProjects) {
      // TODO: エラー発生通知
      return setLoading(false);
    }

    setProjects(fetchedProjects);
    if (expand) {
      setIsExpand(true);
    }

    setLoading(false);
  };

  return (
    <FilteredProjectListPresentational
      isExpand={isExpand}
      setIsExpand={setIsExpand}
      filteredProjects={projects}
      selecterPreset={selectedPreset ?? initialSelectedPreset}
      onSelectedPreset={handleSelectedPreset}
      loading={loading}
      presets={presets}
    />
  );
};
