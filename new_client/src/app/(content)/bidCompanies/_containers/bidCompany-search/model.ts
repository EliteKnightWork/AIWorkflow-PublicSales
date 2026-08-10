import type { SearchBidCompaniesParams } from '@/api/generated/models';

// 選択済みの検索条件のチップ
export type SearchInputChip = {
  type: keyof SearchBidCompaniesParams;
  keyName: string;
  value: string;
  displayValue: string;
};
