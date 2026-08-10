import { useState } from 'react';
import { useGetSearchFilterPresets } from '@/api/generated/endpoints/search-filter-presets';
import { ProjectType } from '../../projects/types';
import RecommendSettingPresentational from './presentational';

export default function RecommendSetting() {
  const { data: searchFilterPresets } = useGetSearchFilterPresets({
    projectType: ProjectType.PROJECT,
    recommended: true,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <RecommendSettingPresentational
      searchFilterPresets={searchFilterPresets?.searchFilterPresets ?? []}
      isModalOpen={isModalOpen}
      onModalOpen={() => setIsModalOpen(true)}
      onModalClose={() => setIsModalOpen(false)}
    />
  );
}
