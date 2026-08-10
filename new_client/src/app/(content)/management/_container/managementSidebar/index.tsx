'use client';

import { Box, Flex, Tabs, Text } from '@radix-ui/themes';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import {
  deleteBidPipeline,
  prefetchGetBidPipelineCustomObjectsQuery,
} from '@/api/generated/endpoints/bid-pipelines';
import { getMyCompany } from '@/api/generated/endpoints/companies';
import {
  createCompanyProject,
  deleteCompanyProject,
  updateCompanyProject,
} from '@/api/generated/endpoints/company-projects';
import { type BidPipelineTask, type Company, FeatureKey } from '@/api/generated/models';
import NeuralButtonGroup from '@/app/(content)/_components/projectChat/chat-button/NeuralButtonGroup';
import { ProjectChatSideBar } from '@/app/(content)/projects/_components/projectChatSideBar/ProjectChatSideBar';
import { useToast } from '@/context/ToastContext';
import PipelineCreateCard from '../../_components/PipelineEditCard/PipelineCreateCard';
import PipelineEditCard from '../../_components/PipelineEditCard/PipelineEditCard';
import PipelineDetailCard from '../../_components/pipelineDetailCard/PipelineDetailCard';
import TaskDetailCard from '../../_components/taskDetailCard/TaskDetailCard';
import TaskForm from '../../_components/taskForm/TaskForm';
import {
  useManagementContext,
  usePipelineBoard,
  useTaskBoard,
} from '../../_context/ManagementContext';
import styles from './styles.module.css';
import { MenagementSidebarTab, SidebarDisplayMode } from './types';

type Props = {
  isOpen: boolean;
  isPipeline?: boolean;
  pipelineId?: number;
  defaultStatusId?: string;
  taskId?: number;
  onCreateTask?: (task: BidPipelineTask) => void;
  onDeleteTask?: (task: BidPipelineTask) => void;
  onClose: () => void;
};

export default function ManagementSideBar({
  isOpen,
  isPipeline = true,
  pipelineId,
  defaultStatusId,
  taskId,
  onCreateTask,
  onDeleteTask,
  onClose,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // ManagementContext hooks
  const { bidPipelineStatuses, bidPipelineTaskStatuses, companyMembers, pipelineBoardData } =
    useManagementContext();
  const {
    updatePipelineStatus,
    updatePipelineAssignedUsers,
    onUpdatePipeline,
    onAddPipeline,
    setPipelineBoardData,
  } = usePipelineBoard();
  const {
    pipelineTaskData,
    createTask,
    deleteTask: deleteTaskFromContext,
    updateTaskTitle,
    updateTaskStatus,
    updateTaskAssignedUsers,
    updateTaskDueDate,
    updateTaskDescription,
    addTaskAttachment,
    deleteTaskAttachment,
    onUpdateTask: onUpdateTaskFromContext,
  } = useTaskBoard();

  // Get pipelines from context
  const pipelines = pipelineBoardData.list.flatMap((list) => list.pipelines);

  // Get tasks from context
  const tasks = pipelineTaskData.list.flatMap((list) => list.projects);

  // taskIdからContextの最新データを取得
  const task = taskId ? tasks.find((t) => t.id === taskId) : undefined;

  const targetPipeline = pipelineId
    ? pipelines.find((p) => p.id === pipelineId)
    : task?.pipeline?.pipelineId
      ? pipelines.find((p) => p.id === task?.pipeline?.pipelineId)
      : undefined;

  const [targetTask, setTargetTask] = useState<BidPipelineTask | undefined>(undefined);

  const [selectedTab, setSelectedTab] = useState<MenagementSidebarTab | undefined>(undefined);

  const [displayMode, setDisplayMode] = useState<SidebarDisplayMode>(SidebarDisplayMode.PROJECT);

  const [myCompany, setMyCompany] = useState<Company | undefined>(undefined);

  const [isChatSideBarOpen, setIsChatSideBarOpen] = useState(false);

  const { enqueueToast } = useToast();

  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      // 最新のタスクデータをセット（Contextから取得したもの）
      if (task) {
        setTargetTask(task);
      } else if (taskId) {
        // taskIdはあるが、まだContextから取得できていない場合（初回読み込み時など）
        const foundTask = tasks.find((t) => t.id === taskId);
        if (foundTask) {
          setTargetTask(foundTask);
        }
      } else {
        setTargetTask(undefined);
      }

      if (!selectedTab) {
        if (isPipeline) {
          setSelectedTab(MenagementSidebarTab.PROJECT);
          if (pipelineId) {
            setDisplayMode(SidebarDisplayMode.PROJECT);
          } else {
            setDisplayMode(SidebarDisplayMode.PROJECT_CREATE);
          }
        } else {
          setSelectedTab(MenagementSidebarTab.TASK);
          if (!taskId) {
            setDisplayMode(SidebarDisplayMode.TASK_CREATE);
          } else {
            setDisplayMode(SidebarDisplayMode.TASK_DETAIL);
          }
        }
      }

      getMyCompany().then((company) => {
        setMyCompany(company);
      });
      return;
    }
    // サイドバーが閉じられた時のみ初期化
    setSelectedTab(undefined);
    setTargetTask(undefined);
    setIsChatSideBarOpen(false);
  }, [isOpen, isPipeline, taskId, pipelineId, task]);

  useEffect(() => {
    if (!isOpen) return;
    if (taskId) {
      const selectedTask = tasks.find((t) => t.id === taskId);
      if (selectedTask) {
        setTargetTask(selectedTask);
      }
      return;
    }
    if (targetTask?.id) {
      const latest = tasks.find((t) => t.id === targetTask.id);
      if (latest) setTargetTask(latest);
    }
  }, [tasks, isOpen, taskId, targetTask?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Prefetch memo (custom objects) while sidebar is opening/loading
  useEffect(() => {
    if (!isOpen) return;
    const pid = pipelineId ?? task?.pipeline?.pipelineId ?? targetPipeline?.id;
    if (pid) {
      prefetchGetBidPipelineCustomObjectsQuery(queryClient, pid);
    }
  }, [isOpen, pipelineId, task?.pipeline?.pipelineId, targetPipeline?.id, queryClient]);

  const onBack = () => {
    setDisplayMode(SidebarDisplayMode.PROJECT);
  };

  const onEdit = () => {
    setDisplayMode(SidebarDisplayMode.PROJECT_EDIT);
  };

  const onDelete = async () => {
    if (!targetPipeline?.id || !targetPipeline.project?.companyProjectId) return;
    try {
      // 1) 案件管理の紐付け解除（入札パイプライン削除）
      await deleteBidPipeline(targetPipeline.id.toString());

      // ローカルのパイプラインボードから該当パイプラインを除去
      const newLists = pipelineBoardData.list.map((list) => ({
        ...list,
        pipelines: list.pipelines.filter((p) => p.id !== targetPipeline.id),
      }));
      setPipelineBoardData({ ...pipelineBoardData, list: newLists });

      // 2) 会社プロジェクトを削除
      await deleteCompanyProject(targetPipeline.project.companyProjectId);
      enqueueToast('会社独自案件を削除しました');

      // 3) サイドバーを閉じる
      onClose();
    } catch {
      enqueueToast('削除に失敗しました');
    }
  };

  return (
    <AnimatePresence mode='wait'>
      {isOpen && (
        <>
          <Box asChild>
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              ref={overlayRef}
            />
          </Box>
          <Box
            className={styles.managementSideBar}
            style={{ width: isChatSideBarOpen ? '80vw' : '50vw' }}
          >
            <motion.div
              className={styles.modal}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 100, stiffness: 600 }}
              layout
              style={{ width: '100%' }}
            >
              <Box className={styles.container}>
                <Flex direction='column' style={{ height: '100%', overflowY: 'auto' }}>
                  <Tabs.Root
                    value={selectedTab}
                    onValueChange={(value) => {
                      if (value === MenagementSidebarTab.TASK) {
                        setDisplayMode(SidebarDisplayMode.TASK_INFO);
                      }
                      if (value === MenagementSidebarTab.PROJECT) {
                        setDisplayMode(SidebarDisplayMode.PROJECT);
                      }
                      setSelectedTab(value as MenagementSidebarTab);
                    }}
                    className={styles.tabsRoot}
                  >
                    <Tabs.List className={styles.tabsList}>
                      <Tabs.Trigger
                        value={MenagementSidebarTab.PROJECT}
                        className={styles.tabsTrigger}
                        disabled={!targetPipeline && !targetTask}
                      >
                        <Flex align='center' gap='2'>
                          <span
                            className='material-icons'
                            translate='no'
                            aria-hidden='true'
                            style={{ color: '#EBCE47' }}
                          >
                            work
                          </span>
                          <Text>入札情報</Text>
                        </Flex>
                      </Tabs.Trigger>
                      <Tabs.Trigger
                        value={MenagementSidebarTab.TASK}
                        className={styles.tabsTrigger}
                        disabled={!targetPipeline}
                      >
                        <Flex align='center' gap='2'>
                          <span className='material-icons' style={{ color: '#0762FE' }}>
                            task
                          </span>
                          <Text>タスク</Text>
                        </Flex>
                      </Tabs.Trigger>
                    </Tabs.List>

                    <Box className={styles.tabsContent}>
                      <Tabs.Content value='project'>
                        {displayMode === SidebarDisplayMode.PROJECT && (
                          <PipelineDetailCard
                            pipeline={targetPipeline}
                            statuses={bidPipelineStatuses}
                            users={companyMembers}
                            onClose={onClose}
                            onEdit={targetPipeline?.project?.companyProjectId ? onEdit : undefined}
                            onDelete={
                              targetPipeline?.project?.companyProjectId ? onDelete : undefined
                            }
                            onUpdateStatus={async (statusId) => {
                              if (!targetPipeline) return;

                              // 楽観的更新：まずローカル状態を更新
                              const updatedPipeline = {
                                ...targetPipeline,
                                status: bidPipelineStatuses.find(
                                  (s) => s.id?.toString() === statusId
                                ),
                              };
                              onUpdatePipeline(updatedPipeline);

                              // バックエンドにも更新リクエストを送信
                              try {
                                if (!targetPipeline.id) {
                                  throw new Error('Pipeline IDが存在しません');
                                }
                                await updatePipelineStatus(targetPipeline.id.toString(), statusId);
                                enqueueToast('案件のステータスを変更しました');
                              } catch {
                                // API失敗時は元の状態に戻す
                                onUpdatePipeline(targetPipeline);
                                enqueueToast('案件のステータス変更に失敗しました');
                              }
                            }}
                            onUpdateAssignedUser={async (assignedUserIds) => {
                              if (!targetPipeline) return;

                              // 楽観的更新：まずローカル状態を更新
                              const updatedPipeline = {
                                ...targetPipeline,
                                assignedUsers: companyMembers.filter((user) =>
                                  assignedUserIds.includes(user.id ?? 0)
                                ),
                              };
                              onUpdatePipeline(updatedPipeline);

                              // バックエンドにも更新リクエストを送信
                              try {
                                if (!targetPipeline.id) {
                                  throw new Error('Pipeline IDが存在しません');
                                }
                                await updatePipelineAssignedUsers(
                                  targetPipeline.id.toString(),
                                  assignedUserIds
                                );
                                enqueueToast('案件の担当者を変更しました');
                              } catch {
                                // API失敗時は元の状態に戻す
                                onUpdatePipeline(targetPipeline);
                                enqueueToast('案件の担当者変更に失敗しました');
                              }
                            }}
                          />
                        )}
                        {displayMode === SidebarDisplayMode.PROJECT_EDIT && (
                          <PipelineEditCard
                            pipeline={targetPipeline}
                            statuses={bidPipelineStatuses}
                            users={companyMembers}
                            onClose={onClose}
                            onBack={onBack}
                            onSubmit={async (form) => {
                              if (!targetPipeline) return;
                              const pipelineId = targetPipeline.id?.toString();
                              const companyProjectId = targetPipeline.project?.companyProjectId;
                              if (!pipelineId || !companyProjectId) return;

                              const updatedPipeline = { ...targetPipeline };

                              try {
                                // 1) プロジェクト情報の更新
                                if (form.project) {
                                  const updatedProject = await updateCompanyProject(
                                    companyProjectId,
                                    form.project
                                  );
                                  updatedPipeline.project = updatedProject;
                                }

                                // 2) ステータス変更があれば更新
                                const newStatusId = form.pipeline?.status?.id?.toString();
                                const currentStatusId = targetPipeline.status?.id?.toString();
                                if (newStatusId && newStatusId !== currentStatusId) {
                                  await updatePipelineStatus(pipelineId, newStatusId);
                                  updatedPipeline.status = bidPipelineStatuses.find(
                                    (s) => s.id?.toString() === newStatusId
                                  );
                                }

                                // 3) 担当者変更があれば更新
                                const newAssignedUserIds = (form.pipeline?.assignedUsers ?? [])
                                  .map((u) => u.id)
                                  .filter((id): id is number => typeof id === 'number');
                                const currentAssignedUserIds = (targetPipeline.assignedUsers ?? [])
                                  .map((u) => u.id)
                                  .filter((id): id is number => typeof id === 'number');

                                const hasAssignedChanged =
                                  newAssignedUserIds.length !== currentAssignedUserIds.length ||
                                  newAssignedUserIds.slice().sort().join(',') !==
                                    currentAssignedUserIds.slice().sort().join(',');
                                if (hasAssignedChanged) {
                                  await updatePipelineAssignedUsers(pipelineId, newAssignedUserIds);
                                  updatedPipeline.assignedUsers = companyMembers.filter((user) =>
                                    newAssignedUserIds.includes(user.id ?? 0)
                                  );
                                }

                                // 4) Context の project を最新に更新
                                await onUpdatePipeline(updatedPipeline);

                                enqueueToast('案件を更新しました');
                                setDisplayMode(SidebarDisplayMode.PROJECT);
                              } catch {
                                enqueueToast('案件の更新に失敗しました');
                              }
                            }}
                          />
                        )}
                        {displayMode === SidebarDisplayMode.PROJECT_CREATE && (
                          <PipelineCreateCard
                            statuses={bidPipelineStatuses}
                            users={companyMembers}
                            onClose={onClose}
                            defaultStatusId={defaultStatusId}
                            onSubmit={async (form) => {
                              if (!form.project) return;
                              try {
                                // 1) プロジェクト作成
                                const createdProject = await createCompanyProject(form.project);

                                // 2) パイプライン作成（ステータス・担当者は作成時に付与）
                                const addBody = {
                                  project_uuid: createdProject.uuid,
                                  bid_pipeline_status_id: form.pipeline?.status?.id,
                                  assigned_user_ids: (form.pipeline?.assignedUsers ?? [])
                                    .map((u) => u.id)
                                    .filter((id): id is number => typeof id === 'number'),
                                };
                                await onAddPipeline(addBody);

                                // 3) サイドバーを閉じる
                                onClose();
                              } catch {
                                enqueueToast('案件の作成に失敗しました');
                              }
                            }}
                          />
                        )}
                      </Tabs.Content>

                      <Tabs.Content value='task'>
                        {displayMode === SidebarDisplayMode.TASK_INFO ? (
                          <TaskDetailCard
                            onTaskSelected={(task) => {
                              setTargetTask(task);
                              setDisplayMode(SidebarDisplayMode.TASK_DETAIL);
                            }}
                            pipelineId={targetPipeline?.id?.toString() ?? ''}
                            onGotoCreateTask={() => {
                              setTargetTask(undefined);
                              setDisplayMode(SidebarDisplayMode.TASK_CREATE);
                            }}
                          />
                        ) : targetTask ? (
                          // 編集フォーム
                          <TaskForm
                            statuses={bidPipelineTaskStatuses}
                            initTask={targetTask}
                            pipelines={pipelines}
                            users={companyMembers}
                            isChatSideBarOpen={isChatSideBarOpen}
                            deleteTask={async (task) => {
                              if (!task.pipeline?.pipelineId || !task.id) {
                                return;
                              }

                              await deleteTaskFromContext(task);
                              onDeleteTask?.(task);
                              // タスク一覧画面へ
                              setDisplayMode(SidebarDisplayMode.TASK_INFO);
                            }}
                            onBack={() => {
                              setDisplayMode(SidebarDisplayMode.TASK_INFO);
                            }}
                            onClose={() => {
                              onClose();
                            }}
                            onUpdateTitle={async (title) => {
                              if (!targetTask) return;

                              // 楽観的更新：まずローカル状態を更新
                              const updatedTask = {
                                ...targetTask,
                                title,
                              };
                              onUpdateTaskFromContext(updatedTask);

                              // バックエンドにも更新リクエストを送信
                              try {
                                const result = await updateTaskTitle(
                                  targetTask.id?.toString() ?? '',
                                  targetTask.pipeline?.pipelineId?.toString() ?? '',
                                  title
                                );
                                if (result) {
                                  // API成功時は最新データで再更新
                                  onUpdateTaskFromContext(result);
                                }
                              } catch {
                                // API失敗時は元の状態に戻す
                                onUpdateTaskFromContext(targetTask);
                                enqueueToast('タスクのタイトル変更に失敗しました');
                              }
                            }}
                            onUpdateStatus={async (statusId) => {
                              if (!targetTask) return;

                              // 楽観的更新：まずローカル状態を更新
                              const updatedTask = {
                                ...targetTask,
                                status: bidPipelineTaskStatuses.find(
                                  (s) => s.id?.toString() === statusId
                                ),
                              };
                              onUpdateTaskFromContext(updatedTask);

                              // バックエンドにも更新リクエストを送信
                              try {
                                const result = await updateTaskStatus(
                                  targetTask.id?.toString() ?? '',
                                  targetTask.pipeline?.pipelineId?.toString() ?? '',
                                  statusId
                                );
                                if (result) {
                                  // API成功時は最新データで再更新
                                  onUpdateTaskFromContext(result);
                                }
                              } catch {
                                // API失敗時は元の状態に戻す
                                onUpdateTaskFromContext(targetTask);
                                enqueueToast('タスクのステータス変更に失敗しました');
                              }
                            }}
                            onAddAttachment={async (files: File[]) => {
                              if (!targetTask.pipeline?.pipelineId || !targetTask.id) {
                                return;
                              }

                              await addTaskAttachment(
                                targetTask.id.toString(),
                                targetTask.pipeline.pipelineId.toString(),
                                files
                              );

                              // タスクを再取得して最新状態を反映
                              // 実際の実装では、addTaskAttachmentが更新されたタスクを返すように設計されているため、
                              // ここでsetTargetTaskやonUpdateTaskを呼ぶ必要はありません
                            }}
                            onDeleteAttachment={async (attachment) => {
                              if (
                                !targetTask.pipeline?.pipelineId ||
                                !targetTask.id ||
                                !attachment.id
                              ) {
                                return;
                              }

                              await deleteTaskAttachment(
                                targetTask.id.toString(),
                                targetTask.pipeline.pipelineId.toString(),
                                attachment.id.toString()
                              );

                              // deleteTaskAttachmentがContext内で楽観的更新を行うため、
                              // ここでsetTargetTaskやonUpdateTaskを呼ぶ必要はありません
                            }}
                            onUpdateAssignedUser={async (assignedUserIds) => {
                              if (!targetTask) return;

                              // 楽観的更新：まずローカル状態を更新
                              const updatedTask = {
                                ...targetTask,
                                assignedUsers: companyMembers.filter((user) =>
                                  assignedUserIds.includes(user.id ?? 0)
                                ),
                              };
                              onUpdateTaskFromContext(updatedTask);

                              // バックエンドにも更新リクエストを送信
                              try {
                                const result = await updateTaskAssignedUsers(
                                  targetTask.id?.toString() ?? '',
                                  targetTask.pipeline?.pipelineId?.toString() ?? '',
                                  assignedUserIds
                                );
                                if (result) {
                                  // API成功時は最新データで再更新
                                  onUpdateTaskFromContext(result);
                                }
                              } catch {
                                // API失敗時は元の状態に戻す
                                onUpdateTaskFromContext(targetTask);
                                enqueueToast('タスクの担当者変更に失敗しました');
                              }
                            }}
                            onUpdateDueDate={async (dueDate) => {
                              if (!targetTask) return;

                              // 楽観的更新：まずローカル状態を更新
                              const updatedTask = {
                                ...targetTask,
                                dueDate,
                              };
                              onUpdateTaskFromContext(updatedTask);

                              // バックエンドにも更新リクエストを送信
                              try {
                                const result = await updateTaskDueDate(
                                  targetTask.id?.toString() ?? '',
                                  targetTask.pipeline?.pipelineId?.toString() ?? '',
                                  dueDate
                                );
                                if (result) {
                                  // API成功時は最新データで再更新
                                  onUpdateTaskFromContext(result);
                                }
                              } catch {
                                // API失敗時は元の状態に戻す
                                onUpdateTaskFromContext(targetTask);
                                enqueueToast('タスクの期日変更に失敗しました');
                              }
                            }}
                            onUpdateDescription={async (description) => {
                              if (!targetTask) return;

                              // 楽観的更新：まずローカル状態を更新
                              const updatedTask = {
                                ...targetTask,
                                description,
                              };
                              onUpdateTaskFromContext(updatedTask);

                              // バックエンドにも更新リクエストを送信
                              try {
                                const result = await updateTaskDescription(
                                  targetTask.id?.toString() ?? '',
                                  targetTask.pipeline?.pipelineId?.toString() ?? '',
                                  description
                                );
                                if (result) {
                                  // API成功時は最新データで再更新
                                  onUpdateTaskFromContext(result);
                                }
                              } catch {
                                // API失敗時は元の状態に戻す
                                onUpdateTaskFromContext(targetTask);
                                enqueueToast('タスクの詳細変更に失敗しました');
                              }
                            }}
                          />
                        ) : (
                          // 新規作成フォーム
                          <TaskForm
                            statuses={bidPipelineTaskStatuses}
                            pipelines={pipelines}
                            users={companyMembers}
                            initPipeline={targetPipeline}
                            isChatSideBarOpen={isChatSideBarOpen}
                            onSubmit={async (pipelineId, body) => {
                              const result = await createTask(pipelineId, body);
                              if (result) {
                                onCreateTask?.(result);
                                onClose();
                              }
                            }}
                            onClose={() => {
                              onClose();
                            }}
                            onUpdatePipeline={onUpdatePipeline}
                          />
                        )}
                      </Tabs.Content>
                    </Box>
                  </Tabs.Root>
                </Flex>
                {isOpen &&
                  targetPipeline &&
                  !targetPipeline.project?.companyProjectId &&
                  myCompany?.features?.some((f) => f.key === FeatureKey.ai_chat) && (
                    <Box className={styles.chatButtonWrapper}>
                      <NeuralButtonGroup
                        onClick={() => {
                          setIsChatSideBarOpen(!isChatSideBarOpen);
                        }}
                        isOpen={isChatSideBarOpen}
                      />
                    </Box>
                  )}
              </Box>

              {isOpen && isChatSideBarOpen && targetPipeline ? (
                <Box className={styles.chatSidebarWrapper}>
                  <ProjectChatSideBar
                    projectId={targetPipeline.project?.uuid ?? ''}
                    isOpen={isChatSideBarOpen}
                    onClose={() => setIsChatSideBarOpen(false)}
                    isAbbreviated={true}
                  />
                </Box>
              ) : null}
            </motion.div>
          </Box>
        </>
      )}
    </AnimatePresence>
  );
}
