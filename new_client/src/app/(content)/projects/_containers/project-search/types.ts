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

export const ProcedureList = [
  '一般競争入札',
  '指名競争入札',
  '企画競争入札',
  '随意契約',
  '見積もり合わせ',
  '資料招請',
  '意見招請',
  'その他',
];

export const ProcedureType = {
  GENERAL_COMPETITIVE: '一般競争入札',
  DESIGNATED_COMPETITIVE: '指名競争入札',
  PROPOSAL_COMPETITIVE: '企画競争入札',
  DISCRETIONARY: '随意契約',
  QUOTATION_COMPARISON: '見積もり合わせ',
  DOCUMENT_REQUEST: '資料招請',
  OPINION_REQUEST: '意見招請',
  OTHER: 'その他',
} as const;

export type ProcedureType = (typeof ProcedureType)[keyof typeof ProcedureType];
