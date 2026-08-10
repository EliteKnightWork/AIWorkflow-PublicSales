import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useQueries } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { getGetBidPipelineCustomObjectsQueryOptions } from '@/api/generated/endpoints/bid-pipelines';
import type { BidPipeline, CustomObject, CustomObjectItem } from '@/api/generated/models';
import type { PipelineFilterCondition } from '../_components/pipelineFilterForm/pipelineFilterForm';
import { NO_ASSIGNED_ID } from '../_components/pipelineFilterForm/types';

const MAX_INTEGER_DIGITS = 15;
const MAX_FRACTION_DIGITS = 5;

const FRACTION_SCALE = BigInt(10) ** BigInt(MAX_FRACTION_DIGITS);

const sanitizeNumberString = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { normalized: '', isValid: true } as const;
  }

  const match = trimmed.match(/^(-?)(\d*)(?:\.(\d*))?$/);
  if (!match) {
    return { normalized: '', isValid: false } as const;
  }

  const [, sign, integerRaw = '', fractionRaw = ''] = match;
  let integerPart = integerRaw === '' ? '0' : integerRaw;
  integerPart = integerPart.replace(/^0+(?=\d)/, '');
  if (integerPart === '') integerPart = '0';
  integerPart = integerPart.slice(0, MAX_INTEGER_DIGITS);

  const fractionPart = fractionRaw.slice(0, MAX_FRACTION_DIGITS);

  const shouldKeepNegative = sign === '-' && (integerPart !== '0' || fractionPart.length > 0);
  const normalized = `${shouldKeepNegative ? '-' : ''}${integerPart}${
    fractionPart.length > 0 ? `.${fractionPart}` : ''
  }`;

  return { normalized, isValid: true } as const;
};

const toScaledInteger = (value: string): bigint => {
  const negative = value.startsWith('-');
  const unsigned = negative ? value.slice(1) : value;
  const [integerPartRaw, fractionPartRaw = ''] = unsigned.split('.');
  const integerPart = integerPartRaw === '' ? '0' : integerPartRaw;
  const fractionPart = (fractionPartRaw + '0'.repeat(MAX_FRACTION_DIGITS)).slice(
    0,
    MAX_FRACTION_DIGITS
  );
  const integerComponent = BigInt(integerPart) * FRACTION_SCALE;
  const fractionComponent = fractionPart === '' ? BigInt(0) : BigInt(fractionPart);
  const scaled = integerComponent + fractionComponent;
  return negative ? -scaled : scaled;
};

const toScaledIntegerFromUnknown = (value: string | null | undefined): bigint | null => {
  if (value == null) return null;
  const { normalized, isValid } = sanitizeNumberString(String(value));
  if (!isValid || normalized === '') {
    return null;
  }

  return toScaledInteger(normalized);
};

// フィルタリング対象のデータ型
export interface PipelineBoardList {
  id: string;
  pipelines: BidPipeline[];
  [key: string]: any;
}

export interface PipelineBoardData {
  list: Array<PipelineBoardList>;
}

// カスタムフックの戻り値型
export interface UsePipelineFilterReturn {
  filteredData: PipelineBoardData;
  filters: string[];
  setFilters: React.Dispatch<React.SetStateAction<string[]>>;
  filterCondition: PipelineFilterCondition;
  setFilterCondition: React.Dispatch<React.SetStateAction<PipelineFilterCondition>>;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  isFilterPopoverOpen: boolean;
  setIsFilterPopoverOpen: React.Dispatch<React.SetStateAction<boolean>>;
  hasActiveCustomFilters: boolean;
  isCustomFilterSettled: boolean;
}

/**
 * PipelineBoard用のフィルタリングカスタムフック
 * タイトル検索、詳細フィルター条件、URLパラメータ管理を統合的に処理
 */
export function usePipelineFilter(pipelineBoardData: PipelineBoardData): UsePipelineFilterReturn {
  const router = useRouter();
  const pathName = usePathname();
  const searchParams = useSearchParams();

  // 状態管理
  const [inputValue, setInputValue] = useState('');
  const [filters, setFilters] = useState<string[]>(searchParams.get('filters')?.split(',') || []);
  const [filterCondition, setFilterCondition] = useState<PipelineFilterCondition>({});
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);

  // フィルタリング処理
  const baseFilteredData = useMemo(() => {
    const filteredList = pipelineBoardData.list.map((list) => {
      const filteredPipelines = list.pipelines.filter((pipeline) => {
        // タイトル検索フィルター
        if (filters.length > 0) {
          const title = pipeline.project?.title || '';
          if (!filters.some((filter) => title.includes(filter))) {
            return false;
          }
        }

        // 案件ステータスフィルター
        if (filterCondition.statusId && pipeline.status?.id !== filterCondition.statusId) {
          return false;
        }

        // 担当者フィルター（複数選択・OR条件）
        if (filterCondition.assignedUserIds && filterCondition.assignedUserIds.length > 0) {
          // 担当者なしが選択されている場合
          if (filterCondition.assignedUserIds.includes(NO_ASSIGNED_ID)) {
            // assignedUsersがundefinedまたは空の配列のpipelineのみ通す
            if (pipeline.assignedUsers && pipeline.assignedUsers.length > 0) {
              return false;
            }
          } else {
            // 通常の担当者フィルター（OR条件）
            const hasAnyAssignedUser = pipeline.assignedUsers?.some((user) =>
              filterCondition.assignedUserIds?.includes(user.id ?? -999)
            );
            if (!hasAnyAssignedUser) {
              return false;
            }
          }
        }

        // 参加申込期日フィルター
        if (filterCondition.participationDeadlineFrom || filterCondition.participationDeadlineTo) {
          const participationDeadline = pipeline.project?.applicationDocumentDeadlineDate;
          if (!participationDeadline) {
            return false;
          }
          if (
            filterCondition.participationDeadlineFrom &&
            participationDeadline < filterCondition.participationDeadlineFrom
          ) {
            return false;
          }
          if (
            filterCondition.participationDeadlineTo &&
            participationDeadline > filterCondition.participationDeadlineTo
          ) {
            return false;
          }
        }

        // 提案書期日フィルター
        if (filterCondition.proposalDeadlineFrom || filterCondition.proposalDeadlineTo) {
          const proposalDeadline = pipeline.project?.proposalDocumentDeadlineDate;
          if (!proposalDeadline) {
            return false;
          }
          if (
            filterCondition.proposalDeadlineFrom &&
            proposalDeadline < filterCondition.proposalDeadlineFrom
          ) {
            return false;
          }
          if (
            filterCondition.proposalDeadlineTo &&
            proposalDeadline > filterCondition.proposalDeadlineTo
          ) {
            return false;
          }
        }

        return true;
      });

      return { ...list, pipelines: filteredPipelines };
    });

    return { ...pipelineBoardData, list: filteredList };
  }, [pipelineBoardData, filters, filterCondition]);

  // カスタムオブジェクトの絞り込み条件が有効かどうか
  const hasActiveCustomFilters = useMemo(() => {
    const cof = filterCondition.customObjectFilters || {};
    return Object.values(cof).some((v: any) => {
      if (!v) return false;
      switch (v.type) {
        case 'checkbox':
          return Array.isArray(v.selectedChoiceIds) && v.selectedChoiceIds.length > 0;
        case 'radio':
          return v.selectedChoiceId != null;
        case 'person':
          return v.userId != null;
        case 'free_text':
        case 'free_text_multiline':
          return Boolean(v.text && String(v.text).trim().length > 0);
        case 'url':
          return Boolean(v.url && String(v.url).trim().length > 0);
        case 'calendar': {
          const from = typeof v.from === 'string' ? v.from.trim() : '';
          const to = typeof v.to === 'string' ? v.to.trim() : '';
          return Boolean(from || to);
        }
        case 'number': {
          const from = typeof v.from === 'string' ? v.from.trim() : '';
          const to = typeof v.to === 'string' ? v.to.trim() : '';
          return Boolean(from || to);
        }
        default:
          return false;
      }
    });
  }, [filterCondition.customObjectFilters]);
  // ベースフィルター後のpipelineId一覧
  const baseFilteredPipelineIds = useMemo(() => {
    const ids: number[] = [];
    baseFilteredData.list.forEach((list) => {
      list.pipelines.forEach((p) => {
        if (typeof p.id === 'number') ids.push(p.id);
      });
    });
    return ids;
  }, [baseFilteredData]);
  // カスタムオブジェクトのデータを取得（必要時のみ）
  const queries = baseFilteredPipelineIds.map((id) =>
    getGetBidPipelineCustomObjectsQueryOptions(id, {
      query: {
        enabled: hasActiveCustomFilters && Number.isFinite(id),
        staleTime: 60_000,
      },
    })
  ) as unknown as UseQueryOptions<CustomObject[], unknown, CustomObject[], readonly unknown[]>[];

  const customObjectQueries = useQueries({ queries }) as UseQueryResult<CustomObject[], unknown>[];
  // pipelineId -> CustomObject[] のマップを作成
  const customObjectsByPipelineId = useMemo(() => {
    const map = new Map<number, CustomObject[]>();
    baseFilteredPipelineIds.forEach((id, idx) => {
      const data = customObjectQueries[idx]?.data;
      if (data) {
        map.set(id, data);
      }
    });
    return map;
  }, [baseFilteredPipelineIds, customObjectQueries]);

  // カスタムオブジェクトの取得がすべて完了（成功/失敗）し、かつフェッチ中でないか
  const isCustomFilterSettled = useMemo(() => {
    if (!hasActiveCustomFilters) return true;
    if (baseFilteredPipelineIds.length === 0) return true;
    if (customObjectQueries.length === 0) return false;
    return customObjectQueries.every((q) => (q?.isSuccess || q?.isError) && !q?.isFetching);
  }, [hasActiveCustomFilters, baseFilteredPipelineIds, customObjectQueries]);
  // カスタムオブジェクトの絞り込みロジック
  const matchesCustomFilters = (
    pipelineId: number,
    filtersMap: NonNullable<PipelineFilterCondition['customObjectFilters']>
  ) => {
    if (!hasActiveCustomFilters) return true;
    const customObjects = customObjectsByPipelineId.get(pipelineId);
    if (!customObjects) {
      // まだ取得できていない場合は一旦表示対象に含める
      return true;
    }
    // customObjectItemsをテンプレートアイテムID単位でグループ化
    const allItems = customObjects.flatMap(
      (co) => co.customObjectItems ?? []
    ) as CustomObjectItem[];
    const grouped: Record<number, CustomObjectItem[]> = allItems.reduce(
      (acc, item) => {
        const templateItemId = (item as unknown as { customObjectTemplateItemId?: number })
          .customObjectTemplateItemId as number | undefined;
        if (!templateItemId) return acc;
        if (!acc[templateItemId]) acc[templateItemId] = [];
        acc[templateItemId].push(item);
        return acc;
      },
      {} as Record<number, CustomObjectItem[]>
    );
    // すべての条件を満たすかチェック（AND）
    return Object.entries(filtersMap).every(([templateItemIdStr, cond]) => {
      const templateItemId = Number(templateItemIdStr);
      const items = grouped[templateItemId] ?? [];
      if (!cond || items.length === 0) return false;
      const getValueId = (it: CustomObjectItem) =>
        (it as unknown as { customObjectTemplateItemValueId?: number })
          .customObjectTemplateItemValueId as number | undefined;
      switch ((cond as any).type) {
        case 'checkbox': {
          const selected: number[] = (cond as any).selectedChoiceIds ?? [];
          if (selected.length === 0) return false;
          // すべて含む（AND）
          return selected.every((choiceId) =>
            items.some((it) => getValueId(it) === choiceId && Boolean(it.isChecked))
          );
        }
        case 'radio': {
          const selectedId: number | undefined = (cond as any).selectedChoiceId;
          if (selectedId == null) return false;
          return items.some((it) => getValueId(it) === selectedId && Boolean(it.isChecked));
        }
        case 'person': {
          const userId: number | undefined = (cond as any).userId;
          if (userId == null) return false;
          return items.some((it) => it.userId === userId);
        }
        case 'free_text':
        case 'free_text_multiline': {
          const text: string = String((cond as any).text ?? '').trim();
          if (!text) return false;
          return items.some((it) => (it.freeText ?? '').includes(text));
        }
        case 'url': {
          const url: string = String((cond as any).url ?? '').trim();
          if (!url) return false;
          return items.some((it) => (it.url ?? '').includes(url));
        }
        case 'calendar': {
          const from: string = String((cond as any).from ?? '').trim();
          const to: string = String((cond as any).to ?? '').trim();
          if (!from && !to) return false;
          return items.some((it) => {
            const value = (it.calendar ?? '').slice(0, 10);
            if (!value) return false;
            if (from && value < from) return false;
            if (to && value > to) return false;
            return true;
          });
        }
        case 'number': {
          const fromRaw = typeof (cond as any).from === 'string' ? (cond as any).from.trim() : '';
          const toRaw = typeof (cond as any).to === 'string' ? (cond as any).to.trim() : '';

          let normalizedFrom: string | undefined;
          let normalizedTo: string | undefined;

          if (fromRaw) {
            const { normalized, isValid } = sanitizeNumberString(fromRaw);
            if (!isValid || normalized === '') return false;
            normalizedFrom = normalized;
          }

          if (toRaw) {
            const { normalized, isValid } = sanitizeNumberString(toRaw);
            if (!isValid || normalized === '') return false;
            normalizedTo = normalized;
          }

          if (!normalizedFrom && !normalizedTo) return false;

          if (normalizedFrom && normalizedTo) {
            const fromScaled = toScaledInteger(normalizedFrom);
            const toScaled = toScaledInteger(normalizedTo);
            if (fromScaled > toScaled) {
              const [start, end] = [normalizedTo, normalizedFrom];
              normalizedFrom = start;
              normalizedTo = end;
            }
          }

          const fromScaled = normalizedFrom ? toScaledInteger(normalizedFrom) : null;
          const toScaled = normalizedTo ? toScaledInteger(normalizedTo) : null;

          return items.some((it) => {
            const scaled = toScaledIntegerFromUnknown(it.numberValue);
            if (scaled === null) return false;
            if (fromScaled !== null && scaled < fromScaled) return false;
            if (toScaled !== null && scaled > toScaled) return false;
            return true;
          });
        }
        default:
          return true;
      }
    });
  };
  // 最終的なフィルター結果：ベース結果にカスタムオブジェクト条件を適用
  const filteredData = useMemo(() => {
    if (!hasActiveCustomFilters) return baseFilteredData;
    const cof = filterCondition.customObjectFilters || {};
    const nextList = baseFilteredData.list.map((list) => ({
      ...list,
      pipelines: list.pipelines.filter((p) =>
        typeof p.id === 'number' ? matchesCustomFilters(p.id, cof) : true
      ),
    }));
    return { ...baseFilteredData, list: nextList };
  }, [
    baseFilteredData,
    hasActiveCustomFilters,
    filterCondition.customObjectFilters,
    customObjectsByPipelineId,
  ]);

  // URLパラメータの管理
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (filters.length > 0) {
      params.set('filters', filters.join(','));
    } else {
      params.delete('filters');
    }
    router.replace(`${pathName}?${params.toString()}`);
  }, [filters, pathName, router, searchParams]);

  return {
    filteredData,
    filters,
    setFilters,
    filterCondition,
    setFilterCondition,
    inputValue,
    setInputValue,
    isFilterPopoverOpen,
    setIsFilterPopoverOpen,
    hasActiveCustomFilters,
    isCustomFilterSettled,
  };
}
