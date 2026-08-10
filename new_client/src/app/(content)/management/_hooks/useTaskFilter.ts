import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { BidPipelineTask } from '@/api/generated/models';
import type { TaskFilterCondition } from '../_components/taskFilterForm/taskFilterForm';
import { NO_ASSIGNED_ID } from '../_components/taskFilterForm/types';

// フィルタリング対象のデータ型
export interface TaskBoardData {
  list: Array<{
    id: string;
    projects: BidPipelineTask[];
    [key: string]: any;
  }>;
}

// カスタムフックの戻り値型
export interface UseTaskFilterReturn {
  filteredData: TaskBoardData;
  filters: string[];
  setFilters: React.Dispatch<React.SetStateAction<string[]>>;
  filterCondition: TaskFilterCondition;
  setFilterCondition: React.Dispatch<React.SetStateAction<TaskFilterCondition>>;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  isFilterPopoverOpen: boolean;
  setIsFilterPopoverOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * TaskBoard用のフィルタリングカスタムフック
 * タイトル検索、詳細フィルター条件、URLパラメータ管理を統合的に処理
 */
export function useTaskFilter(taskBoardData: TaskBoardData): UseTaskFilterReturn {
  const router = useRouter();
  const pathName = usePathname();
  const searchParams = useSearchParams();

  // 状態管理
  const [inputValue, setInputValue] = useState('');
  const [filters, setFilters] = useState<string[]>(searchParams.get('filters')?.split(',') || []);
  const [filterCondition, setFilterCondition] = useState<TaskFilterCondition>({});
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);

  // フィルタリング処理
  const filteredData = useMemo(() => {
    const filteredList = taskBoardData.list.map((list) => {
      const filteredProjects = list.projects.filter((task) => {
        // タイトル検索フィルター
        if (filters.length > 0) {
          const title = task.title || '';
          const projectTitle = task.pipeline?.projectTitle || '';
          if (!filters.some((filter) => title.includes(filter) || projectTitle.includes(filter))) {
            return false;
          }
        }

        // タスクステータスフィルター
        if (filterCondition.statusId && task.status?.id !== filterCondition.statusId) {
          return false;
        }

        // 担当者フィルター（複数選択・OR条件）
        if (filterCondition.assignedUserIds && filterCondition.assignedUserIds.length > 0) {
          // 担当者なしが選択されている場合
          if (filterCondition.assignedUserIds.includes(NO_ASSIGNED_ID)) {
            // assignedUsersがundefinedまたは空の配列のtaskのみ通す
            if (task.assignedUsers && task.assignedUsers.length > 0) {
              return false;
            }
          } else {
            // 通常の担当者フィルター（OR条件）
            const hasAnyAssignedUser = task.assignedUsers?.some((user) =>
              filterCondition.assignedUserIds?.includes(user.id ?? -999)
            );
            if (!hasAnyAssignedUser) {
              return false;
            }
          }
        }

        // 期日フィルター
        if (filterCondition.dueDateFrom || filterCondition.dueDateTo) {
          const dueDate = task.dueDate;
          if (!dueDate) {
            return false;
          }
          if (filterCondition.dueDateFrom && dueDate < filterCondition.dueDateFrom) {
            return false;
          }
          if (filterCondition.dueDateTo && dueDate > filterCondition.dueDateTo) {
            return false;
          }
        }

        return true;
      });

      return { ...list, projects: filteredProjects };
    });

    return { ...taskBoardData, list: filteredList };
  }, [taskBoardData, filters, filterCondition]);

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
  };
}
