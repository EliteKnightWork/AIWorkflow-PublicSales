'use client';
import { useEffect, useState } from 'react';
import { getRecommendations } from '@/api/generated/endpoints/recommendations';
import type { Project, SearchFilterPreset } from '@/api/generated/models';
import { useSearchFilterPreset } from '@/context/SearchFilterPresetContext';
import { useSelectedSearchFilterPreset } from '../../projects/_context/selectedSearchFilterPreset';
import { ProjectType } from '../../projects/types';
import MypageRecommendListPresentational from './presentational/mypage/mypagePresentational';
import ProjectRecommendListPresentational from './presentational/project/projectPresentational';
import { RecommendListType } from './type';

type Props = {
  displayType: RecommendListType;
};

export const RecommendListContainer = ({ displayType }: Props) => {
  const [isExpand, setIsExpand] = useState(false);

  const [presets, setPresets] = useState<SearchFilterPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<SearchFilterPreset | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [recommendedProjects, setRecommendedProjects] = useState<Project[]>([]);

  const { presets: allPresets, isLoading: isLoadingSearchFilterPresets } = useSearchFilterPreset();
  const { selectedSearchFilterPresetId } = useSelectedSearchFilterPreset();

  useEffect(() => {
    if (allPresets.length > 0) {
      setLoading(true);
      const filteredPresets = allPresets.filter(
        (preset) => preset.projectType === ProjectType.PROJECT && preset.recommended
      );

      setPresets(filteredPresets);

      const matchingPreset = selectedSearchFilterPresetId
        ? filteredPresets.find((preset) => preset.id === selectedSearchFilterPresetId)
        : undefined;

      if (matchingPreset?.id) {
        setSelectedPreset(matchingPreset);
        setIsExpand(true);

        getRecommendations({
          searchFilterPresetId: matchingPreset.id,
          size: 10,
        })
          .then((res) => {
            setRecommendedProjects(res.projects || []);
          })
          .catch((error) => {
            console.error('Failed to fetch recommendations:', error);
            setRecommendedProjects([]);
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setSelectedPreset(undefined);
        setIsExpand(false);
        setLoading(false);
      }
    } else {
      if (!isLoadingSearchFilterPresets) {
        setLoading(false);
      }
    }
  }, [allPresets, isLoadingSearchFilterPresets, selectedSearchFilterPresetId]);

  const onSelectedPreset = async (preset: SearchFilterPreset | undefined) => {
    setSelectedPreset(preset);
    if (preset) {
      await getRecommendProjects(preset);
      setIsExpand(true);
    }
  };

  const getRecommendProjects = async (preset: SearchFilterPreset) => {
    setLoading(true);
    if (preset.id) {
      try {
        const res = await getRecommendations({
          searchFilterPresetId: preset.id,
          size: 10,
        });
        setRecommendedProjects(res.projects || []);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
        setRecommendedProjects([]);
      }
    }
    setLoading(false);
  };

  if (displayType === RecommendListType.MYPAGE) {
    return (
      <MypageRecommendListPresentational
        isExpand={isExpand}
        setIsExpand={setIsExpand}
        selectedPreset={selectedPreset}
        onSelectedPreset={onSelectedPreset}
        recommendedProjects={recommendedProjects}
        loading={loading}
        presets={presets}
      />
    );
  }

  return (
    <ProjectRecommendListPresentational
      isExpand={isExpand}
      setIsExpand={setIsExpand}
      selectedPreset={selectedPreset}
      onSelectedPreset={onSelectedPreset}
      recommendedProjects={recommendedProjects}
      loading={loading}
      presets={presets}
    />
  );
};
