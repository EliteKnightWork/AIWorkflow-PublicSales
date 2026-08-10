import type {
  ParticipateQualification,
  SearchFilterPresetFilter,
  SearchProjectsParams,
} from '@/api/generated/models';
import { convertToSearchInputChip } from '../model';

export type FilterDifference = {
  added: string[];
  removed: string[];
};

/**
 * SearchFilterPresetFilterをSearchProjectsParamsに変換
 */
function convertFilterToSearchParams(filter: SearchFilterPresetFilter): SearchProjectsParams {
  return {
    ...filter,
    // number[]をstring[]に変換
    prefectures: filter.prefectures?.map((p) => String(p)),
    // organizationsをorganizationNameArrayに変換
    organizationNameArray: filter.organizations,
    // nullをundefinedに変換
    deadlineDaysRemaining: filter.deadlineDaysRemaining ?? undefined,
  };
}

/**
 * 検索フィルター条件の差分を計算する
 * @param originalFilter 元の保存条件のフィルター
 * @param currentFilter 現在の検索条件のフィルター
 * @param qualifications 参加資格データ
 * @param originalBusinessDescription 元の保存条件の事業内容
 * @param currentBusinessDescription 現在の検索条件の事業内容
 * @returns 追加・削除された条件の差分
 */
export function calculateFilterDifference(
  originalFilter: SearchFilterPresetFilter,
  currentFilter: SearchFilterPresetFilter,
  qualifications: ParticipateQualification[],
  originalBusinessDescription?: string | null,
  currentBusinessDescription?: string | null
): FilterDifference {
  // 各フィルターを検索チップ形式に変換
  const originalChips = convertToSearchInputChip(
    convertFilterToSearchParams(originalFilter),
    qualifications
  );
  const currentChips = convertToSearchInputChip(
    convertFilterToSearchParams(currentFilter),
    qualifications
  );

  // チップを比較しやすい文字列に変換
  const originalChipStrings = originalChips.map((chip) => `${chip.keyName}: ${chip.displayValue}`);
  const currentChipStrings = currentChips.map((chip) => `${chip.keyName}: ${chip.displayValue}`);

  // 事業内容の差分を追加
  const originalBusiness = originalBusinessDescription?.trim() || '';
  const currentBusiness = currentBusinessDescription?.trim() || '';

  if (originalBusiness && !currentBusiness) {
    originalChipStrings.push(
      `事業内容: ${originalBusiness.substring(0, 20)}${originalBusiness.length > 20 ? '...' : ''}`
    );
  } else if (!originalBusiness && currentBusiness) {
    currentChipStrings.push(
      `事業内容: ${currentBusiness.substring(0, 20)}${currentBusiness.length > 20 ? '...' : ''}`
    );
  } else if (originalBusiness && currentBusiness && originalBusiness !== currentBusiness) {
    originalChipStrings.push(
      `事業内容: ${originalBusiness.substring(0, 20)}${originalBusiness.length > 20 ? '...' : ''}`
    );
    currentChipStrings.push(
      `事業内容: ${currentBusiness.substring(0, 20)}${currentBusiness.length > 20 ? '...' : ''}`
    );
  }

  // 追加された条件を特定
  const added = currentChipStrings.filter((chip) => !originalChipStrings.includes(chip));

  // 削除された条件を特定
  const removed = originalChipStrings.filter((chip) => !currentChipStrings.includes(chip));

  return {
    added,
    removed,
  };
}
