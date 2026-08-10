'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  addBidPipelineStatus,
  deleteBidPipelineStatus,
  updateBidPipelineStatus,
} from '@/api/generated/endpoints/bid-pipeline-statuses';
import {
  addBidPipelineTaskAttachment,
  deleteBidPipelineTaskAttachment,
} from '@/api/generated/endpoints/bid-pipeline-task-attachments';
import {
  addBidPipelineTask,
  deleteBidPipelineTask,
  updateBidPipelineTask,
} from '@/api/generated/endpoints/bid-pipeline-tasks';
import { addBidPipeline, updateBidPipeline } from '@/api/generated/endpoints/bid-pipelines';
import type {
  AddBidPipelineBody,
  AddBidPipelineStatusBody,
  AddBidPipelineTaskBody,
  BidPipeline,
  BidPipelineStatus,
  BidPipelineStatusStage,
  BidPipelineTask,
  BidPipelineTaskAttachment,
  BidPipelineTaskStatus,
  UpdateBidPipelineStatusBody,
  User,
} from '@/api/generated/models';
import { useToast } from '@/context/ToastContext';
import { sortTaskBoardLists } from '@/utils/statusSort';
import { getPipelineStatusColors, pipelineTaskStatusColorList } from '../types';

// Pipeline types
export type PipelineList = {
  id: string;
  title: string;
  color: string;
  borderColor: string;
  order: number;
  pipelines: BidPipeline[];
  isUneditable: boolean;
  stage: BidPipelineStatusStage;
};

type PipelineBoardData = {
  id: string;
  list: PipelineList[];
};

// Task types
type TaskStatusInfo = {
  id: string;
  title: string;
  color: string;
  borderColor: string;
  order: number;
  projects: BidPipelineTask[];
};

type PipelineTaskBoard = {
  id: string;
  list: TaskStatusInfo[];
};

// Combined context type
type ManagementContextType = {
  // Shared data
  bidPipelineStatuses: BidPipelineStatus[];
  bidPipelineTaskStatuses: BidPipelineTaskStatus[];
  companyMembers: User[];

  // Loading states
  isPipelineDataLoading: boolean;
  isTaskDataLoading: boolean;

  // Pipeline board data and functions
  pipelineBoardData: PipelineBoardData;
  movePipeline: (fromId: string, toId: string, pipelineId: number) => Promise<void>;
  onUpdatePipeline: (pipeline: BidPipeline) => Promise<void>;
  onAddPipeline: (pipelineData: AddBidPipelineBody) => Promise<BidPipeline | null>;
  setPipelineBoardData: (data: PipelineBoardData) => void;
  movePipelineBoardData: (fromListId: string, toIndex: number) => Promise<void>;
  addPipelineBoardData: (title: string, stage: BidPipelineStatusStage) => Promise<void>;
  updatePipelineBoardData: (id: string, title: string) => Promise<void>;
  deletePipelineBoardData: (id: string) => Promise<void>;

  // サイドバーからの案件更新用の関数
  updatePipelineStatus: (pipelineId: string, statusId: string) => Promise<BidPipeline | null>;
  updatePipelineAssignedUsers: (
    pipelineId: string,
    assignedUserIds: number[]
  ) => Promise<BidPipeline | null>;

  // Task board data and functions
  pipelineTaskData: PipelineTaskBoard;
  moveTask: (fromId: string, toId: string, taskId: number) => Promise<void>;
  onAddTask: (task: BidPipelineTask) => void;
  onDeleteTask: (task: BidPipelineTask) => void;
  onUpdateTask: (task: BidPipelineTask) => Promise<void>;
  deleteTask: (task: BidPipelineTask) => Promise<void>;
  createTask: (
    pipelineId: string,
    taskData: AddBidPipelineTaskBody
  ) => Promise<BidPipelineTask | null>;

  // サイドバーからのタスク更新用の関数
  updateTaskTitle: (
    taskId: string,
    pipelineId: string,
    title: string
  ) => Promise<BidPipelineTask | null>;
  updateTaskStatus: (
    taskId: string,
    pipelineId: string,
    statusId: string
  ) => Promise<BidPipelineTask | null>;
  updateTaskAssignedUsers: (
    taskId: string,
    pipelineId: string,
    assignedUserIds: number[]
  ) => Promise<BidPipelineTask | null>;
  updateTaskDueDate: (
    taskId: string,
    pipelineId: string,
    dueDate: string
  ) => Promise<BidPipelineTask | null>;
  updateTaskDescription: (
    taskId: string,
    pipelineId: string,
    description: string
  ) => Promise<BidPipelineTask | null>;
  addTaskAttachment: (taskId: string, pipelineId: string, files: File[]) => Promise<void>;
  deleteTaskAttachment: (taskId: string, pipelineId: string, attachmentId: string) => Promise<void>;
};

const ManagementContext = createContext<ManagementContextType | null>(null);

export const useManagementContext = () => {
  const context = useContext(ManagementContext);
  if (!context) {
    throw new Error('useManagementContext must be used within a ManagementProvider');
  }
  return context;
};

// For backward compatibility
export const usePipelineBoard = () => {
  const context = useManagementContext();
  return {
    pipelineBoardData: context.pipelineBoardData,
    movePipeline: context.movePipeline,
    onUpdatePipeline: context.onUpdatePipeline,
    onAddPipeline: context.onAddPipeline,
    setPipelineBoardData: context.setPipelineBoardData,
    movePipelineBoardData: context.movePipelineBoardData,
    addPipelineBoardData: context.addPipelineBoardData,
    updatePipelineBoardData: context.updatePipelineBoardData,
    deletePipelineBoardData: context.deletePipelineBoardData,
    updatePipelineStatus: context.updatePipelineStatus,
    updatePipelineAssignedUsers: context.updatePipelineAssignedUsers,
  };
};

export const useTaskBoard = () => {
  const context = useManagementContext();
  return {
    pipelineTaskData: context.pipelineTaskData,
    moveTask: context.moveTask,
    onAddTask: context.onAddTask,
    onDeleteTask: context.onDeleteTask,
    onUpdateTask: context.onUpdateTask,
    deleteTask: context.deleteTask,
    createTask: context.createTask,
    updateTaskTitle: context.updateTaskTitle,
    updateTaskStatus: context.updateTaskStatus,
    updateTaskAssignedUsers: context.updateTaskAssignedUsers,
    updateTaskDueDate: context.updateTaskDueDate,
    updateTaskDescription: context.updateTaskDescription,
    addTaskAttachment: context.addTaskAttachment,
    deleteTaskAttachment: context.deleteTaskAttachment,
  };
};

type Props = {
  children: React.ReactNode;
  statusList?: BidPipelineStatus[];
  pipelines?: BidPipeline[];
  initialTasks?: BidPipelineTask[];
  taskStatusList?: BidPipelineTaskStatus[];
  companyMembers?: User[];
};

export const ManagementProvider = ({
  children,
  statusList,
  pipelines,
  initialTasks,
  taskStatusList,
  companyMembers,
}: Props) => {
  const { enqueueToast } = useToast();

  // Loading states
  const [isPipelineDataLoading, setIsPipelineDataLoading] = useState<boolean>(true);
  const [isTaskDataLoading, setIsTaskDataLoading] = useState<boolean>(true);

  // Pipeline board state
  const [pipelineBoardData, setPipelineBoardData] = useState<PipelineBoardData>({
    id: 'pipeline-list',
    list: [],
  });

  // Task board state
  const [pipelineTaskData, setPipelineTaskData] = useState<PipelineTaskBoard>({
    id: 'pipeline-list',
    list: [],
  });

  // Initialize pipeline board data
  useEffect(() => {
    if (pipelineBoardData.list.length > 0 || statusList === undefined || pipelines === undefined)
      return;

    setIsPipelineDataLoading(true);

    setPipelineBoardData({
      id: 'pipeline-list',
      list: statusList
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .sort((a, b) => {
          if ((a.stage ?? 0) > (b.stage ?? 0)) {
            return -1;
          }
          return 1;
        })
        .map((status) => {
          const colors = getPipelineStatusColors(status.stage ?? '');
          return {
            id: status.id?.toString() ?? '',
            title: status.name ?? '',
            color: colors.color,
            borderColor: colors.borderColor,
            order: status.order ?? 0,
            pipelines: pipelines
              .filter((pipeline) => pipeline.status?.id === status.id)
              .sort((a, b) => (a.id ?? 0) - (b.id ?? 0)),
            isUneditable: status.isUneditable ?? true,
            stage: status.stage ?? 'doing',
          };
        }),
    });

    setIsPipelineDataLoading(false);
  }, [statusList, pipelines, pipelineBoardData.list.length]);

  // Initialize task board data
  useEffect(() => {
    if (
      pipelineTaskData.list.length > 0 ||
      taskStatusList === undefined ||
      initialTasks === undefined
    )
      return;

    setIsTaskDataLoading(true);

    setPipelineTaskData({
      id: 'pipeline-list',
      list: taskStatusList.map((status) => ({
        id: status.id?.toString() ?? '',
        title: status.name ?? '',
        color:
          pipelineTaskStatusColorList.find((color) => color.id === status.name)?.color ??
          'var(--bg-color-tag-text-active)',
        borderColor:
          pipelineTaskStatusColorList.find((color) => color.id === status.name)?.borderColor ??
          'var(--color-secondary)',
        order: status.order ?? 0,
        projects: initialTasks
          .filter((task) => task.status?.id === status.id)
          .sort((a, b) => (b.id ?? 0) - (a.id ?? 0)),
      })),
    });

    setIsTaskDataLoading(false);
  }, [taskStatusList, initialTasks, pipelineTaskData.list]);

  // Pipeline board functions
  const movePipeline = useCallback(
    async (fromId: string, toId: string, pipelineId: number) => {
      const currentList = [...pipelineBoardData.list];
      try {
        const fromList = currentList.find((list) => list.id === fromId);
        const toList = currentList.find((list) => list.id === toId);
        if (!fromList || !toList) return;

        const moveTicket = fromList.pipelines.find((project) => project.id === pipelineId);
        if (!moveTicket) return;

        const newFromTickets = fromList.pipelines.filter((project) => project.id !== pipelineId);
        const newToTickets = [...toList.pipelines, moveTicket];

        const newLists = currentList.map((list) => {
          if (list.id === fromId) return { ...list, pipelines: newFromTickets };
          if (list.id === toId) return { ...list, pipelines: newToTickets };
          return list;
        });

        setPipelineBoardData({ ...pipelineBoardData, list: newLists });

        const updatedPipeline = await updateBidPipeline(pipelineId.toString(), {
          bid_pipeline_status_id: Number.parseInt(toId),
        });

        // API成功後にローカルデータを更新
        if (updatedPipeline) {
          // bidPipelineStatusesから新しいstatusオブジェクトを取得
          const newStatus = (statusList ?? []).find(
            (status) => status.id === Number.parseInt(toId)
          );

          // pipelineのstatusを更新したオブジェクトを作成
          const pipelineWithUpdatedStatus = {
            ...moveTicket,
            status: newStatus || moveTicket.status,
          };

          // pipelineBoardDataを更新（移動先リスト内のpipelineオブジェクトのstatusも更新）
          const finalLists = newLists.map((list) => {
            if (list.id === toId) {
              return {
                ...list,
                pipelines: list.pipelines.map((p) =>
                  p.id === pipelineId ? pipelineWithUpdatedStatus : p
                ),
              };
            }
            return list;
          });

          setPipelineBoardData({ ...pipelineBoardData, list: finalLists });
        }

        enqueueToast('案件のステータスを更新しました');
      } catch {
        setPipelineBoardData({ ...pipelineBoardData, list: currentList });
        enqueueToast('案件のステータスを更新できませんでした');
      }
    },
    [pipelineBoardData, enqueueToast]
  );

  const onUpdatePipeline = useCallback(
    async (pipeline: BidPipeline) => {
      // パイプラインが存在するリストを探す
      const targetList = pipelineBoardData.list.find((list) =>
        list.pipelines.some((p) => p.id === pipeline.id)
      );
      if (!targetList) return;

      // ステータスが変更されているかチェック
      const newStatusId = pipeline.status?.id?.toString();
      if (newStatusId && newStatusId !== targetList.id) {
        // ステータスが変更された場合は、新しいステータスのリストに移動
        const newLists = pipelineBoardData.list.map((list) => {
          if (list.id === newStatusId) {
            // 新しいステータスのリストにパイプラインを追加
            return {
              ...list,
              pipelines: [...list.pipelines, pipeline],
            };
          }
          if (list.id === targetList.id) {
            // 元のリストからパイプラインを削除
            return {
              ...list,
              pipelines: list.pipelines.filter((p) => p.id !== pipeline.id),
            };
          }
          return list;
        });
        setPipelineBoardData({ ...pipelineBoardData, list: newLists });
        return;
      }

      // ステータスが変更されていない場合は、同じリスト内でパイプラインを更新
      const newLists = pipelineBoardData.list.map((list) => {
        if (list.id === targetList.id) {
          return {
            ...list,
            pipelines: list.pipelines.map((p) => (p.id === pipeline.id ? pipeline : p)),
          };
        }
        return list;
      });
      setPipelineBoardData({ ...pipelineBoardData, list: newLists });
    },
    [pipelineBoardData]
  );

  const movePipelineBoardData = useCallback(
    async (fromListId: string, toIndex: number) => {
      // 対象のstageのデータを変更した後、すべてのデータをpipelineBoardDataにsetする
      const currentList = [...pipelineBoardData.list];
      const fromList = currentList.find((l) => l.id === fromListId);
      if (!fromList) return;
      const currentStageList = currentList
        .filter((l) => l.stage === fromList.stage)
        .sort((a, b) => a.order - b.order);

      try {
        if (toIndex < 0 || currentStageList.length < toIndex) {
          throw Error('移動先のindexの指定が不正です');
        }
        const fromIndex = currentStageList.findIndex((l) => l.id === fromListId);
        if (fromIndex === -1) {
          throw Error('不正な案件ステータス移動です');
        }
        const target = currentStageList[fromIndex];
        const filteredList = currentStageList.filter((_, idx) => idx !== fromIndex);
        const updatedList = [
          ...filteredList.slice(0, toIndex),
          target,
          ...filteredList.slice(toIndex),
        ];
        const newStageList = updatedList.map((l, idx) => ({ ...l, order: idx + 1 }));
        const req: UpdateBidPipelineStatusBody = {
          order: toIndex + 1,
          name: target.title,
          stage: target.stage,
        };
        const newList = [...pipelineBoardData.list].map((l) => {
          const foundItem = newStageList.find((item) => item.id === l.id);
          return foundItem ? { ...l, order: foundItem.order } : l;
        });
        const sortedNewList = newList
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .sort((a, b) => {
            if ((a.stage ?? 0) > (b.stage ?? 0)) {
              return -1;
            }
            return 1;
          });
        // 画面描画のため、非同期処理よりも前に更新後の値を設定する
        setPipelineBoardData({
          ...pipelineBoardData,
          list: sortedNewList,
        });
        await updateBidPipelineStatus(Number(target.id), req);
        enqueueToast('案件ステータスを移動しました');
      } catch (error) {
        // 失敗した場合は更新前の状態に戻す
        setPipelineBoardData({
          ...pipelineBoardData,
          list: currentList,
        });
        enqueueToast('案件ステータスの移動ができませんでした');
        console.error(error);
      }
    },
    [pipelineBoardData, enqueueToast]
  );

  const addPipelineBoardData = useCallback(
    async (title: string, stage: BidPipelineStatusStage) => {
      const currentList = [...pipelineBoardData.list];
      const req: AddBidPipelineStatusBody = {
        name: title,
        stage: stage,
      };
      try {
        const res = await addBidPipelineStatus(req);
        if (
          res.companyId === undefined ||
          res.id === undefined ||
          res.isUneditable === undefined ||
          res.name === undefined ||
          res.order === undefined ||
          res.stage === undefined
        ) {
          throw Error('想定外のレスポンスです');
        }
        const colors = getPipelineStatusColors(res.stage);
        const pipelineList: PipelineList = {
          id: String(res.id),
          title: String(res.name),
          color: colors.color,
          borderColor: colors.borderColor,
          order: res.order,
          pipelines: [],
          isUneditable: res.isUneditable,
          stage: res.stage,
        };
        setPipelineBoardData({
          ...pipelineBoardData,
          list: currentList.concat(pipelineList),
        });
        enqueueToast('案件ステータスを追加しました');
      } catch (error) {
        setPipelineBoardData({
          ...pipelineBoardData,
          list: currentList,
        });
        enqueueToast('案件ステータスの追加ができませんでした');
        console.error(error);
      }
    },
    [pipelineBoardData, enqueueToast]
  );

  const updatePipelineBoardData = useCallback(
    async (id: string, title: string) => {
      const currentList = [...pipelineBoardData.list];
      const target = currentList.find((l) => l.id === id);
      if (!target) return;
      const req: UpdateBidPipelineStatusBody = {
        order: target.order,
        name: title,
        stage: target.stage,
      };
      try {
        const res = await updateBidPipelineStatus(Number(id), req);
        if (
          res.companyId === undefined ||
          res.id === undefined ||
          res.isUneditable === undefined ||
          res.name === undefined ||
          res.order === undefined ||
          res.stage === undefined
        ) {
          throw Error('想定外のレスポンスです');
        }
        setPipelineBoardData({
          ...pipelineBoardData,
          list: currentList.map((l) => (l.id === id ? { ...l, title } : l)),
        });
        enqueueToast('案件ステータスを更新しました');
      } catch (error) {
        setPipelineBoardData({
          ...pipelineBoardData,
          list: currentList,
        });
        enqueueToast('案件ステータスの更新ができませんでした');
        console.error(error);
      }
    },
    [pipelineBoardData, enqueueToast]
  );

  const deletePipelineBoardData = useCallback(
    async (id: string) => {
      const currentList = [...pipelineBoardData.list];
      const target = currentList.find((l) => l.id === id);
      if (!target) return;
      try {
        await deleteBidPipelineStatus(Number(id));
        const filteredList = currentList.filter((l) => l.id !== id);
        const reorderedList = filteredList
          .sort((a, b) => a.order - b.order)
          .map((item, index) => ({
            ...item,
            order: index + 1,
          }));
        setPipelineBoardData({
          ...pipelineBoardData,
          list: reorderedList,
        });
        enqueueToast('案件ステータスを削除しました');
      } catch (error) {
        setPipelineBoardData({
          ...pipelineBoardData,
          list: currentList,
        });
        enqueueToast('案件ステータスの削除ができませんでした');
        console.error(error);
      }
    },
    [pipelineBoardData, enqueueToast]
  );

  // Task board functions
  const moveTask = useCallback(
    async (fromId: string, toId: string, taskId: number) => {
      try {
        const fromList = pipelineTaskData.list.find((list) => list.id === fromId);
        const toList = pipelineTaskData.list.find((list) => list.id === toId);
        if (!fromList || !toList) return;

        const moveTicket = fromList.projects.find((project) => project.id === taskId);
        if (!moveTicket) return;

        const newFromTickets = fromList.projects
          .filter((project) => project.id !== taskId)
          .sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        const newToTickets = [...toList.projects, moveTicket].sort(
          (a, b) => (b.id ?? 0) - (a.id ?? 0)
        );

        const newLists = pipelineTaskData.list.map((list) => {
          if (list.id === fromId) return { ...list, projects: newFromTickets };
          if (list.id === toId) return { ...list, projects: newToTickets };
          return list;
        });
        // stageがtodo,doing,doneの順でそれぞれのorderでsort
        const sortedLists = taskStatusList
          ? sortTaskBoardLists(newLists, taskStatusList)
          : newLists;

        setPipelineTaskData({ ...pipelineTaskData, list: sortedLists });

        const updatedTask = await updateBidPipelineTask(
          moveTicket.pipeline?.pipelineId.toString() as string,
          taskId.toString(),
          {
            bid_pipeline_task_status_id: Number.parseInt(toId),
          }
        );

        // API成功後にローカルデータを更新
        if (updatedTask) {
          // bidPipelineTaskStatusesから新しいstatusオブジェクトを取得
          const newStatus = (taskStatusList ?? []).find(
            (status) => status.id === Number.parseInt(toId)
          );

          // taskのstatusを更新したオブジェクトを作成
          const taskWithUpdatedStatus = {
            ...moveTicket,
            status: newStatus || moveTicket.status,
          };

          // pipelineTaskDataを更新（移動先リスト内のtaskオブジェクトのstatusも更新）
          const finalLists = sortedLists.map((list) => {
            if (list.id === toId) {
              return {
                ...list,
                projects: list.projects
                  .map((t) => (t.id === taskId ? taskWithUpdatedStatus : t))
                  .sort((a, b) => (b.id ?? 0) - (a.id ?? 0)),
              };
            }
            return list;
          });

          setPipelineTaskData({ ...pipelineTaskData, list: finalLists });
        }

        enqueueToast('タスクのステータスを更新しました');
      } catch (error) {
        enqueueToast('タスクのステータスを更新できませんでした');
        throw error;
      }
    },
    [pipelineTaskData, enqueueToast, taskStatusList]
  );

  const deleteTask = useCallback(
    async (task: BidPipelineTask) => {
      try {
        const currentList = pipelineTaskData.list;

        const targetList = pipelineTaskData.list.find((list) =>
          list.projects.some((p) => p.id === task.id)
        );
        if (!targetList) return;

        const newLists = pipelineTaskData.list.map((list) => ({
          ...list,
          projects: list.projects
            .filter((p) => p.id !== task.id)
            .sort((a, b) => (b.id ?? 0) - (a.id ?? 0)),
        }));

        setPipelineTaskData({ ...pipelineTaskData, list: newLists });

        if (!task.pipeline?.pipelineId) {
          enqueueToast('タスクの削除処理中に想定外の事象が発生しました');
          return;
        }

        await deleteBidPipelineTask(task.pipeline?.pipelineId.toString(), task.id.toString())
          .then(() => {
            enqueueToast('タスクの削除が完了しました');
          })
          .catch(() => {
            // タスクの削除に失敗した場合、元のリストに戻す
            setPipelineTaskData({ ...pipelineTaskData, list: currentList });
            enqueueToast('タスクの削除に失敗しました');
          });
      } catch (_) {
        enqueueToast('タスクの削除に失敗しました');
      }
    },
    [pipelineTaskData, enqueueToast]
  );

  const onAddTask = useCallback(
    (task: BidPipelineTask) => {
      // タスクを追加するリストを見つける
      const targetListId = task.status?.id?.toString();
      if (!targetListId) return;

      // 新しいリスト配列を作成
      const newLists = pipelineTaskData.list.map((list) => {
        if (list.id === targetListId) {
          // 対象のリストに新しいタスクを追加
          return {
            ...list,
            projects: [...list.projects, task].sort((a, b) => (b.id ?? 0) - (a.id ?? 0)),
          };
        }
        return list;
      });

      // 新しいタスクデータでステートを更新
      setPipelineTaskData({ ...pipelineTaskData, list: newLists });
    },
    [pipelineTaskData]
  );

  const onDeleteTask = useCallback(
    (task: BidPipelineTask) => {
      // タスクが属するリストを見つける
      const targetListId = task.status?.id?.toString();
      if (!targetListId) return;

      // 新しいリスト配列を作成
      const newLists = pipelineTaskData.list.map((list) => {
        if (list.id === targetListId) {
          // 対象のリストから該当タスクを削除
          return {
            ...list,
            projects: list.projects
              .filter((p) => p.id !== task.id)
              .sort((a, b) => (b.id ?? 0) - (a.id ?? 0)),
          };
        }
        return list;
      });

      // 更新されたリストでステートを更新
      setPipelineTaskData({ ...pipelineTaskData, list: newLists });
    },
    [pipelineTaskData]
  );

  const onUpdateTask = useCallback(
    async (task: BidPipelineTask) => {
      // タスクのステータスが変更されているかチェック
      const newStatusId = task.status?.id?.toString();
      const targetList = pipelineTaskData.list.find((list) =>
        list.projects.some((p) => p.id === task.id)
      );
      if (!targetList) return;

      // ステータスが変更されている場合は、新しいステータスのリストに移動
      if (newStatusId && newStatusId !== targetList.id) {
        const newLists = pipelineTaskData.list.map((list) => {
          if (list.id === newStatusId) {
            // 新しいステータスのリストにタスクを追加
            return {
              ...list,
              projects: [...list.projects, task].sort((a, b) => (b.id ?? 0) - (a.id ?? 0)),
            };
          }
          if (list.id === targetList.id) {
            // 元のリストからタスクを削除
            return {
              ...list,
              projects: list.projects
                .filter((p) => p.id !== task.id)
                .sort((a, b) => (b.id ?? 0) - (a.id ?? 0)),
            };
          }
          return list;
        });
        setPipelineTaskData({ ...pipelineTaskData, list: newLists });
        return;
      }

      // ステータスが変更されていない場合は、同じリスト内でタスクを更新
      const newLists = pipelineTaskData.list.map((list) => {
        if (list.id === targetList.id) {
          return {
            ...list,
            projects: list.projects
              .map((p) => (p.id === task.id ? task : p))
              .sort((a, b) => (b.id ?? 0) - (a.id ?? 0)),
          };
        }
        return list;
      });

      setPipelineTaskData({ ...pipelineTaskData, list: newLists });
    },
    [pipelineTaskData]
  );

  // 案件の新規作成
  const onAddPipeline = useCallback(
    async (pipelineData: AddBidPipelineBody): Promise<BidPipeline | null> => {
      try {
        const newPipeline = await addBidPipeline(pipelineData);

        // 案件が作成されたら、対応するステータスのリストに追加
        if (newPipeline?.status?.id) {
          const statusId = newPipeline.status.id.toString();
          const newLists = pipelineBoardData.list.map((list) => {
            if (list.id === statusId) {
              return {
                ...list,
                pipelines: [...list.pipelines, newPipeline],
              };
            }
            return list;
          });
          setPipelineBoardData({ ...pipelineBoardData, list: newLists });
          enqueueToast('案件を作成しました');
        }

        return newPipeline;
      } catch (error) {
        enqueueToast('案件の作成に失敗しました');
        console.error(error);
        return null;
      }
    },
    [pipelineBoardData, enqueueToast]
  );

  // タスクの新規作成
  const createTask = useCallback(
    async (
      pipelineId: string,
      taskData: AddBidPipelineTaskBody
    ): Promise<BidPipelineTask | null> => {
      try {
        const newTask = await addBidPipelineTask(pipelineId, taskData);

        // タスクが作成されたら、対応するステータスのリストに追加
        if (newTask?.status?.id) {
          const statusId = newTask.status.id.toString();
          const newLists = pipelineTaskData.list.map((list) => {
            if (list.id === statusId) {
              return {
                ...list,
                projects: [...list.projects, newTask].sort((a, b) => (b.id ?? 0) - (a.id ?? 0)),
              };
            }
            return list;
          });
          setPipelineTaskData({ ...pipelineTaskData, list: newLists });
          enqueueToast('タスクを作成しました');
        }

        return newTask;
      } catch (error) {
        enqueueToast('タスクの作成に失敗しました');
        console.error(error);
        return null;
      }
    },
    [pipelineTaskData, enqueueToast]
  );

  // サイドバー用の案件更新関数
  const updatePipelineStatus = useCallback(
    async (pipelineId: string, statusId: string): Promise<BidPipeline | null> => {
      try {
        const result = await updateBidPipeline(pipelineId, {
          bid_pipeline_status_id: Number(statusId),
        });

        // contextの状態を更新
        await onUpdatePipeline(result);
        return result;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    [onUpdatePipeline]
  );

  const updatePipelineAssignedUsers = useCallback(
    async (pipelineId: string, assignedUserIds: number[]): Promise<BidPipeline | null> => {
      try {
        const result = await updateBidPipeline(pipelineId, {
          assigned_user_ids: assignedUserIds,
        });

        // contextの状態を更新
        await onUpdatePipeline(result);
        return result;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    [onUpdatePipeline]
  );

  // サイドバー用のタスク更新関数
  const updateTaskTitle = useCallback(
    async (taskId: string, pipelineId: string, title: string): Promise<BidPipelineTask | null> => {
      try {
        const result = await updateBidPipelineTask(pipelineId, taskId, { title });
        await onUpdateTask(result);
        enqueueToast('タスクのタイトルを変更しました');
        return result;
      } catch (error) {
        enqueueToast('タスクのタイトル変更に失敗しました');
        console.error(error);
        return null;
      }
    },
    [onUpdateTask, enqueueToast]
  );

  const updateTaskStatus = useCallback(
    async (
      taskId: string,
      pipelineId: string,
      statusId: string
    ): Promise<BidPipelineTask | null> => {
      try {
        const result = await updateBidPipelineTask(pipelineId, taskId, {
          bid_pipeline_task_status_id: Number(statusId),
        });
        await onUpdateTask(result);
        enqueueToast('タスクのステータスを変更しました');
        return result;
      } catch (error) {
        enqueueToast('タスクのステータス変更に失敗しました');
        console.error(error);
        return null;
      }
    },
    [onUpdateTask, enqueueToast]
  );

  const updateTaskAssignedUsers = useCallback(
    async (
      taskId: string,
      pipelineId: string,
      assignedUserIds: number[]
    ): Promise<BidPipelineTask | null> => {
      try {
        const result = await updateBidPipelineTask(pipelineId, taskId, {
          assigned_user_ids: assignedUserIds,
        });
        await onUpdateTask(result);
        enqueueToast('タスクの担当者を変更しました');
        return result;
      } catch (error) {
        enqueueToast('タスクの担当者変更に失敗しました');
        console.error(error);
        return null;
      }
    },
    [onUpdateTask, enqueueToast]
  );

  const updateTaskDueDate = useCallback(
    async (
      taskId: string,
      pipelineId: string,
      dueDate: string
    ): Promise<BidPipelineTask | null> => {
      try {
        const result = await updateBidPipelineTask(pipelineId, taskId, { dueDate });
        await onUpdateTask(result);
        enqueueToast('タスクの期日を変更しました');
        return result;
      } catch (error) {
        enqueueToast('タスクの期日変更に失敗しました');
        console.error(error);
        return null;
      }
    },
    [onUpdateTask, enqueueToast]
  );

  const updateTaskDescription = useCallback(
    async (
      taskId: string,
      pipelineId: string,
      description: string
    ): Promise<BidPipelineTask | null> => {
      try {
        const result = await updateBidPipelineTask(pipelineId, taskId, { description });
        await onUpdateTask(result);
        enqueueToast('タスクの詳細を変更しました');
        return result;
      } catch (error) {
        enqueueToast('タスクの詳細変更に失敗しました');
        console.error(error);
        return null;
      }
    },
    [onUpdateTask, enqueueToast]
  );

  const addTaskAttachment = useCallback(
    async (taskId: string, pipelineId: string, files: File[]): Promise<void> => {
      try {
        // Promise.allSettledを使用して全てのファイルアップロード処理を並行実行
        const results = await Promise.allSettled(
          files.map((file) =>
            addBidPipelineTaskAttachment(Number(pipelineId), Number(taskId), {
              'attachment[file]': file,
            })
              .then((res) => {
                enqueueToast(`ファイル名${file.name}を追加しました`);
                return res;
              })
              .catch((e) => {
                enqueueToast(`ファイル名${file.name}の追加に失敗しました`);
                throw e;
              })
          )
        );

        // 成功した結果のみをフィルタリング
        const successful = results
          .filter(
            (result): result is PromiseFulfilledResult<BidPipelineTaskAttachment> =>
              result.status === 'fulfilled'
          )
          .map((result) => result.value);

        if (successful.length > 0) {
          // タスクデータを更新するために現在のタスクを取得
          const currentList = pipelineTaskData.list;
          const targetList = currentList.find((list) =>
            list.projects.some((p) => p.id === Number(taskId))
          );

          if (targetList) {
            const currentTask = targetList.projects.find((p) => p.id === Number(taskId));
            if (currentTask) {
              const updatedTask = {
                ...currentTask,
                attachments: [...(currentTask.attachments ?? []), ...successful],
              };
              await onUpdateTask(updatedTask);
            }
          }
        }

        const failedCount = results.filter((result) => result.status === 'rejected').length;
        if (failedCount > 0 && successful.length > 0) {
          enqueueToast(
            `${files.length}個中${successful.length}個のファイルを追加しました。${failedCount}個は失敗しました。`
          );
        } else if (failedCount === files.length) {
          enqueueToast('すべてのファイルのアップロードに失敗しました');
        }
      } catch (error) {
        enqueueToast('ファイルのアップロード処理中にエラーが発生しました');
        console.error(error);
      }
    },
    [pipelineTaskData, onUpdateTask, enqueueToast]
  );

  const deleteTaskAttachment = useCallback(
    async (taskId: string, pipelineId: string, attachmentId: string): Promise<void> => {
      try {
        // 先にタスクを更新（楽観的更新）
        const currentList = pipelineTaskData.list;
        const targetList = currentList.find((list) =>
          list.projects.some((p) => p.id === Number(taskId))
        );

        if (targetList) {
          const currentTask = targetList.projects.find((p) => p.id === Number(taskId));
          if (currentTask) {
            const originalTask = { ...currentTask };
            const updatedTask = {
              ...currentTask,
              attachments: currentTask.attachments?.filter((a) => a.id !== Number(attachmentId)),
            };

            await onUpdateTask(updatedTask);

            try {
              await deleteBidPipelineTaskAttachment(
                Number(pipelineId),
                Number(taskId),
                Number(attachmentId)
              );
              enqueueToast('ファイルを削除しました');
            } catch (error) {
              // API失敗時は元に戻す
              await onUpdateTask(originalTask);
              enqueueToast('ファイル削除に失敗しました');
              throw error;
            }
          }
        }
      } catch (error) {
        console.error(error);
      }
    },
    [pipelineTaskData, onUpdateTask, enqueueToast]
  );

  return (
    <ManagementContext.Provider
      value={{
        // Shared data
        bidPipelineStatuses: statusList ?? [],
        bidPipelineTaskStatuses: taskStatusList ?? [],
        companyMembers: companyMembers ?? [],

        // Loading states
        isPipelineDataLoading,
        isTaskDataLoading,
        // Pipeline board
        pipelineBoardData,
        movePipeline,
        onUpdatePipeline,
        onAddPipeline,
        setPipelineBoardData,
        movePipelineBoardData,
        addPipelineBoardData,
        updatePipelineBoardData,
        deletePipelineBoardData,
        updatePipelineStatus,
        updatePipelineAssignedUsers,
        // Task board
        pipelineTaskData,
        moveTask,
        onAddTask,
        onDeleteTask,
        onUpdateTask,
        deleteTask,
        createTask,
        updateTaskTitle,
        updateTaskStatus,
        updateTaskAssignedUsers,
        updateTaskDueDate,
        updateTaskDescription,
        addTaskAttachment,
        deleteTaskAttachment,
      }}
    >
      {children}
    </ManagementContext.Provider>
  );
};

export default ManagementProvider;
