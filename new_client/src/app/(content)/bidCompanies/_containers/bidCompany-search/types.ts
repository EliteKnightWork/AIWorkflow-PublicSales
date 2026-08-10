import type { SearchProjectsParams } from '@/api/generated/models';

export const FilterType = {
  ALL: 'all',
  AREA: 'area',
  ORGANIZATION: 'organization',
  PROCEDURE_TYPE: 'procedure_type',
  SEARCH_FILTER_PRESET: 'search_filter_preset',
  BID_COMPANY: 'bid_company',
} as const;

export type FilterType = (typeof FilterType)[keyof typeof FilterType];

export type SearchTagRow = {
  tagList: SearchTag[];
  selected?: boolean;
  meta?: Record<string, unknown>;
};

export type SearchTag = {
  tag_type: keyof SearchProjectsParams | 'search_filter_preset';
  tag_title: string;
  tag_value: string;
  meta?: Record<string, unknown>;
};

export const ProjectTabType = {
  ALL: 'all',
  OPEN: 'open',
  CLOSED: 'closed',
  AWARDED: 'awarded',
} as const;

export type ProjectTabType = (typeof ProjectTabType)[keyof typeof ProjectTabType];
