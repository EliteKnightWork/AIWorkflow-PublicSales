import type { SearchFilterPreset, SearchProjectsParams } from '@/api/generated/models';

/**
 * SearchFilterPresetをSearchProjectsParamsに変換する
 * @param preset 保存済み検索条件
 * @returns 検索パラメータ
 */
export const convertToSearchProjectParam = (preset: SearchFilterPreset): SearchProjectsParams => {
  if (!preset.filter) return {};

  return {
    keywords: preset.filter.keywords,
    notKeywords: preset.filter.notKeywords,
    orKeywords: preset.filter.orKeywords,
    prefectures: preset.filter.prefectures?.map(String),
    procedureTypes: preset.filter.procedureTypes,
    publicationDateFrom: preset.filter.publicationDateFrom,
    publicationDateTo: preset.filter.publicationDateTo,
  };
};
