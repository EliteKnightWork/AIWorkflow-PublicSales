import type { BidPipelineStatus, BidPipelineTaskStatus } from '@/api/generated/models';

/**
 * パイプラインステータスをstageとorderでソートする
 * stageの順序: doing → done
 * 同一stage内ではorderの降順
 */
export function sortPipelineStatuses<T extends Pick<BidPipelineStatus, 'stage' | 'order'>>(
  statuses: T[]
): T[] {
  return statuses.sort((a, b) => {
    // stageで比較（doing < done）
    if (a.stage === 'doing' && b.stage === 'done') return -1;
    if (a.stage === 'done' && b.stage === 'doing') return 1;

    // 同じstageの場合はorderで比較（降順）
    return (b.order ?? 0) - (a.order ?? 0);
  });
}

/**
 * タスクステータスをstageとorderでソートする
 * stageの順序: todo → doing → done
 * 同一stage内ではorderの降順
 */
export function sortTaskStatuses<T extends Pick<BidPipelineTaskStatus, 'stage' | 'order'>>(
  statuses: T[]
): T[] {
  return statuses.sort((a, b) => {
    // stageで比較（todo < doing < done）
    const stageOrder: Record<string, number> = { todo: 0, doing: 1, done: 2 };
    const aStageOrder = stageOrder[a.stage ?? ''] ?? 999;
    const bStageOrder = stageOrder[b.stage ?? ''] ?? 999;

    if (aStageOrder !== bStageOrder) {
      return aStageOrder - bStageOrder;
    }

    // 同じstageの場合はorderで比較（降順）
    return (b.order ?? 0) - (a.order ?? 0);
  });
}

/**
 * ステータスリストをstageとorderでソートする
 * リスト内の各アイテムに対してstatusListを参照してソートを実行
 */
export function sortStatusLists<
  T extends { id: string; order: number },
  S extends Pick<BidPipelineStatus | BidPipelineTaskStatus, 'id' | 'stage' | 'order'>,
>(lists: T[], statusList: S[], sortFunction: (statuses: S[]) => S[]): T[] {
  return lists.sort((a, b) => {
    const statusA = statusList.find((s) => s.id?.toString() === a.id);
    const statusB = statusList.find((s) => s.id?.toString() === b.id);

    if (!statusA || !statusB) {
      return b.order - a.order; // fallback to order sorting
    }

    // 一時的な配列を作成してソート順を取得
    const sortedStatuses = sortFunction([statusA, statusB]);
    return sortedStatuses[0].id === statusA.id ? -1 : 1;
  });
}

/**
 * パイプラインボードのリストをソートする
 */
export function sortPipelineBoardLists<T extends { id: string; order: number }>(
  lists: T[],
  statusList: BidPipelineStatus[]
): T[] {
  return sortStatusLists(lists, statusList, sortPipelineStatuses);
}

/**
 * タスクボードのリストをソートする
 */
export function sortTaskBoardLists<T extends { id: string; order: number }>(
  lists: T[],
  statusList: BidPipelineTaskStatus[]
): T[] {
  return sortStatusLists(lists, statusList, sortTaskStatuses);
}
