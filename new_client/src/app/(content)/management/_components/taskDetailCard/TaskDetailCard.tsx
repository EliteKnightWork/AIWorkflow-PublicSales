'use client';

import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import {
  type BidPipelineTask,
  BidPipelineTaskStatusStage,
  type User,
} from '@/api/generated/models';
import { useTaskBoard } from '../../_context/ManagementContext';
import { getTaskStatusByDueDate, TaskStatus } from '../../types';
import styles from './styles.module.css';

type Props = {
  pipelineId: string;
  onTaskSelected?: (task: BidPipelineTask) => void;
  onGotoCreateTask: () => void;
};

type TaskInfo = {
  dueDate: string;
  taskList: BidPipelineTask[];
};

const formatDate = (dateString: string) => {
  if (dateString === '期限未設定') return dateString;
  return dateString.replace(/-/g, '/');
};

// パイプラインに紐づくタスクの情報を表示するカード
export default function TaskDetailCard({ pipelineId, onTaskSelected, onGotoCreateTask }: Props) {
  const { pipelineTaskData } = useTaskBoard();
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});
  const [showModal, setShowModal] = useState(false);

  // ManagementContextからpipelineIdに関連するタスクを取得
  const pipelineTasks = useMemo(() => {
    const allTasks: BidPipelineTask[] = [];
    for (const list of pipelineTaskData.list) {
      for (const task of list.projects) {
        if (task.pipeline?.pipelineId?.toString() === pipelineId) {
          allTasks.push(task);
        }
      }
    }
    return allTasks;
  }, [pipelineTaskData, pipelineId]);

  // タスクを期限日でグループ化
  const taskInfoList = useMemo(() => {
    const infoList: TaskInfo[] = [];

    // タスクをdue_dateごとにグループ化する
    for (const task of pipelineTasks) {
      // タスクの期限日を取得
      const dueDate = task.dueDate || '期限未設定';

      // 既存のTaskInfoを探す
      const existingTaskInfo = infoList.find((info) => info.dueDate === dueDate);

      if (existingTaskInfo) {
        // 既存のグループにタスクを追加
        existingTaskInfo.taskList.push(task);
      } else {
        // 新しいグループを作成
        infoList.push({
          dueDate: dueDate,
          taskList: [task],
        });
      }
    }

    // タスク期日でソート
    infoList.sort((a, b) => {
      if (a.dueDate === '期限未設定') return 1;
      if (b.dueDate === '期限未設定') return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    // 各グループ内のタスクもソート
    for (const info of infoList) {
      info.taskList.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    }

    return infoList;
  }, [pipelineTasks]);

  // モーダルを閉じる関数
  const handleCloseModal = () => {
    setShowModal(false);
  };

  // モーダル外をクリックした時にモーダルを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showModal) {
        const modal = document.getElementById('task-modal');
        if (modal && !modal.contains(event.target as Node)) {
          handleCloseModal();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModal]);

  // 展開状態を初期化
  useEffect(() => {
    const initialExpandedState = taskInfoList.reduce(
      (acc, info) => {
        acc[info.dueDate] = true;
        return acc;
      },
      {} as Record<string, boolean>
    );
    setExpandedGroups(initialExpandedState);
  }, [taskInfoList]);

  const toggleGroup = (date: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  return (
    <Box className={styles.content}>
      {taskInfoList.length === 0 ? (
        <Flex direction={'column'} className={styles.noTaskMessageBox}>
          現在この入札案件に関するタスクはありません。
          <br />
          タスクを追加して、進捗を管理しましょう。
          <Button className={styles.addNewTaskButton} onClick={() => onGotoCreateTask()}>
            タスクの新規作成
          </Button>
        </Flex>
      ) : (
        <>
          {taskInfoList.map((taskInfo) => (
            <Box key={taskInfo.dueDate} className={styles.taskGroup}>
              <Flex
                justify='between'
                align='center'
                className={styles.taskGroupHeader}
                onClick={() => toggleGroup(taskInfo.dueDate)}
              >
                <Flex gap='2' align='center'>
                  {taskInfo.taskList.every(
                    (task) => task.status?.stage === BidPipelineTaskStatusStage.done
                  ) ? null : getTaskStatusByDueDate(taskInfo.dueDate) === TaskStatus.ERROR ? (
                    <span
                      className='material-icons'
                      translate='no'
                      aria-hidden='true'
                      style={{ color: 'var(--text-color-error)', fontSize: '24px' }}
                    >
                      error
                    </span>
                  ) : (
                    getTaskStatusByDueDate(taskInfo.dueDate) === TaskStatus.WARNING && (
                      <span
                        className='material-icons'
                        style={{ color: 'var(--text-color-warning)', fontSize: '24px' }}
                      >
                        warning
                      </span>
                    )
                  )}
                  <Text
                    weight='bold'
                    style={{
                      color: taskInfo.taskList.every(
                        (task) => task.status?.stage === BidPipelineTaskStatusStage.done
                      )
                        ? 'var(--text-color-tertiary)'
                        : getTaskStatusByDueDate(taskInfo.dueDate) === TaskStatus.ERROR
                          ? 'var(--text-color-error)'
                          : getTaskStatusByDueDate(taskInfo.dueDate) === TaskStatus.WARNING
                            ? 'var(--text-color-warning)'
                            : 'var(--text-color-tertiary)',
                    }}
                  >
                    タスク期日：
                  </Text>
                  <Text
                    weight='bold'
                    style={{
                      color: taskInfo.taskList.every(
                        (task) => task.status?.stage === BidPipelineTaskStatusStage.done
                      )
                        ? 'var(--text-color-tertiary)'
                        : getTaskStatusByDueDate(taskInfo.dueDate) === TaskStatus.ERROR
                          ? 'var(--text-color-error)'
                          : getTaskStatusByDueDate(taskInfo.dueDate) === TaskStatus.WARNING
                            ? 'var(--text-color-warning)'
                            : 'var(--text-color-tertiary)',
                    }}
                  >
                    {formatDate(taskInfo.dueDate)}
                  </Text>
                </Flex>
                <span
                  className='material-symbols-outlined'
                  style={{ fontSize: '24px', color: 'var(--text-color-tertiary)' }}
                >
                  {expandedGroups[taskInfo.dueDate] ? 'expand_less' : 'expand_more'}
                </span>
              </Flex>
              <AnimatePresence>
                {expandedGroups[taskInfo.dueDate] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <Box className={styles.taskList}>
                      {taskInfo.taskList.map((task) => (
                        <Box
                          key={task.id}
                          style={{
                            background: '#fff',
                            padding: '0px 24px',
                            cursor: 'pointer',
                          }}
                          onClick={() => onTaskSelected?.(task)}
                        >
                          <Box
                            style={{
                              border: '1px solid #E0DDEB',
                              padding: '16px 16px',
                              borderRadius: '8px',
                              background:
                                task.status?.stage === BidPipelineTaskStatusStage.done
                                  ? '#fff'
                                  : getTaskStatusByDueDate(taskInfo.dueDate) === TaskStatus.ERROR
                                    ? '#FCF4F6'
                                    : getTaskStatusByDueDate(taskInfo.dueDate) ===
                                        TaskStatus.WARNING
                                      ? '#FDFDE6'
                                      : '#fff',
                            }}
                          >
                            <Flex direction='column' gap='3'>
                              <Flex gap='2' align='center' justify='between'>
                                <Flex gap='2' align='center'>
                                  <Box
                                    style={{
                                      backgroundColor:
                                        task.status?.stage === BidPipelineTaskStatusStage.done
                                          ? '#FFF7F0'
                                          : getTaskStatusByDueDate(taskInfo.dueDate) ===
                                              TaskStatus.ERROR
                                            ? '#FCF4F6'
                                            : getTaskStatusByDueDate(taskInfo.dueDate) ===
                                                TaskStatus.WARNING
                                              ? '#FDFDE6'
                                              : task.status?.name === '対応中'
                                                ? '#F0FFF5'
                                                : '#F4F4F5',
                                      color:
                                        task.status?.stage === BidPipelineTaskStatusStage.done
                                          ? '#F46637'
                                          : getTaskStatusByDueDate(taskInfo.dueDate) ===
                                              TaskStatus.ERROR
                                            ? 'var(--text-color-error)'
                                            : getTaskStatusByDueDate(taskInfo.dueDate) ===
                                                TaskStatus.WARNING
                                              ? 'var(--text-color-warning)'
                                              : task.status?.name === '対応中'
                                                ? '#34B761'
                                                : '#868A94',
                                      padding: '2px 8px',
                                      fontSize: '14px',
                                      fontWeight: 'bold',
                                      display: 'inline-block',
                                      height: '30px',
                                      border: `1px solid ${
                                        task.status?.stage === BidPipelineTaskStatusStage.done
                                          ? '#F46637'
                                          : getTaskStatusByDueDate(taskInfo.dueDate) ===
                                              TaskStatus.ERROR
                                            ? 'var(--text-color-error)'
                                            : getTaskStatusByDueDate(taskInfo.dueDate) ===
                                                TaskStatus.WARNING
                                              ? 'var(--text-color-warning)'
                                              : task.status?.name === '対応中'
                                                ? '#34B761'
                                                : '#868A94'
                                      }`,
                                    }}
                                  >
                                    {task.status?.stage ===
                                    BidPipelineTaskStatusStage.done ? null : getTaskStatusByDueDate(
                                        taskInfo.dueDate
                                      ) === TaskStatus.ERROR ? (
                                      <span
                                        className='material-symbols-outlined'
                                        style={{
                                          color: 'var(--text-color-error)',
                                          fontSize: '16px',
                                          verticalAlign: 'middle',
                                          marginRight: '4px',
                                        }}
                                      >
                                        error
                                      </span>
                                    ) : (
                                      getTaskStatusByDueDate(taskInfo.dueDate) ===
                                        TaskStatus.WARNING && (
                                        <span
                                          className='material-symbols-outlined'
                                          style={{
                                            color: 'var(--text-color-warning)',
                                            fontSize: '16px',
                                            verticalAlign: 'middle',
                                            marginRight: '4px',
                                          }}
                                        >
                                          warning
                                        </span>
                                      )
                                    )}
                                    {task.status?.name ?? '予定'}
                                  </Box>
                                </Flex>
                              </Flex>
                              <Text
                                style={{
                                  color: 'var(--text-color-tertiary)',
                                  fontFamily: 'Roboto',
                                  fontWeight: 700,
                                  fontSize: '16px',
                                  lineHeight: '160%',
                                  letterSpacing: '0%',
                                }}
                              >
                                {task.title}
                              </Text>
                              <Flex gap='4' align='center'>
                                <Box
                                  style={{
                                    backgroundColor: 'var(--bg-color-info)',
                                    color: 'var(--app-blue-main)',
                                    padding: '2px 8px',
                                    fontSize: '14px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    height: '30px',
                                  }}
                                >
                                  タスク期日: {formatDate(task.dueDate ?? '-')}
                                </Box>
                                <Box
                                  style={{
                                    backgroundColor: 'var(--bg-color-red)',
                                    color: 'var(--text-color-purple)',
                                    padding: '2px 8px',
                                    fontSize: '14px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    height: '30px',
                                  }}
                                >
                                  タスク担当者:{' '}
                                  {task.assignedUsers
                                    ?.map((u: User) => u.name ?? u.email ?? '')
                                    .join(',') ?? '-'}
                                </Box>
                              </Flex>
                            </Flex>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          ))}

          {/* タスクが存在する場合でも常にタスク追加ボタンを表示 */}
          <Flex justify='center'>
            <Button className={styles.addNewTaskButton} onClick={() => onGotoCreateTask()}>
              タスクの新規作成
            </Button>
          </Flex>
        </>
      )}
    </Box>
  );
}
