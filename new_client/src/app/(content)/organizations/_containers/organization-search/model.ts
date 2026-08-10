import type { SearchOrganizationsParams } from '@/api/generated/models';

export type PrefectureType = {
  regionCode: string;
  prefectureId: string;
  name: string;
};

// こだわり条件項目
export type AdditionalFilterCondition = {
  keywords?: string;
  notKeywords?: string;
  plannedPriceFrom?: number;
  plannedPriceTo?: number;
  publicationDateFrom?: string;
  publicationDateTo?: string;
};

// 選択済みの検索条件のチップ
export type SearchInputChip = {
  type: keyof SearchOrganizationsParams;
  keyName: string;
  value: string;
  displayValue: string;
};

export const SearchInputChipPriority = [
  'keywords',
  'orKeywords',
  'notKeywords',
  'prefectures',
  'procedureTypeGroups',
  'organizationNameArray',
  'publicationDateFrom',
  'publicationDateTo',
  'plannedPriceFrom',
  'plannedPriceTo',
  'bidCompanyName',
] as const;

export const OnlyProjectSearchInputChipKeys = [
  'procedureTypeGroups',
  'organizationNameArray',
  'publicationDateFrom',
  'publicationDateTo',
  'plannedPriceFrom',
  'plannedPriceTo',
];
