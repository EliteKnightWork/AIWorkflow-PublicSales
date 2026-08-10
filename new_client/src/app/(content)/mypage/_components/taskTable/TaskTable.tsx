'use client';
import { Box, Button, Flex, Table as RadixTable, Text } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { updateBidPipelineTask } from '@/api/generated/endpoints/bid-pipeline-tasks';
import type {
  BidPipeline,
  BidPipelineTask,
  BidPipelineTaskStatus,
  User,
} from '@/api/generated/models';
import IconBadge from '@/app/(content)/_components/stateBadge/IconBadge';
import { TaskFormSelect } from '@/app/(content)/management/_components/taskForm/select/TaskFormSelect';
import {
  getTaskStatus,
  pipelineTaskStatusColorList,
  TaskStatus,
} from '@/app/(content)/management/types';
import { MYPAGE_MANAGEMENT_TABLE_ROW } from '@/constants';
import { useToast } from '@/context/ToastContext';
import styles from './styles.module.css';

type Props = {
  statuses: BidPipelineTaskStatus[];
  tasks: BidPipelineTask[];
  users: User[];
  router?: any;
  pipelines?: BidPipeline[];
};

export function TaskTable({ statuses, tasks, users, router, pipelines = [] }: Props) {
  const [targetTasks, setTargetTasks] = useState<BidPipelineTask[]>([]);
  const [displayAllButton, setDisplayAllButton] = useState(true);
  const { enqueueToast } = useToast();

  useEffect(() => {
    if (tasks) {
      setTargetTasks(tasks);
    }
  }, [tasks]);

  return (
    <Box className={styles.tableContainer}>
      {targetTasks.length === 0 ? (
        <Box className={styles.emptyStateContainer}>
          <Flex direction='column' align='center' gap='3'>
            {pipelines.length === 0 ? (
              <>
                <Text size='6' weight='bold' className={styles.emptyStateText}>
                  おや？タスクを関連付ける案件がまだ登録されていないようです😉
                  <br />
                  まずは気になる案件を「案件管理」に追加して、入札準備を整えましょう🚀
                </Text>
                <Button
                  className={styles.findProjectButton}
                  onClick={() => router?.push('/projects')}
                >
                  案件を探す
                </Button>
              </>
            ) : (
              <>
                <Text size='6' weight='bold' className={styles.emptyStateText}>
                  タスクが作られていません😊
                  <br />
                  案件に関連するタスクを作成して、入札業務を効率化しましょう！
                </Text>
                <Button
                  className={styles.findProjectButton}
                  onClick={() => router?.push('/management?type=tasks&createTask=true')}
                >
                  タスクを作成する
                </Button>
              </>
            )}
          </Flex>
        </Box>
      ) : (
        <RadixTable.Root className={styles.tableRoot}>
          <RadixTable.Body className={styles.tableBody}>
            {targetTasks?.map((row, index) => {
              if (displayAllButton && index > MYPAGE_MANAGEMENT_TABLE_ROW - 1) {
                return;
              }
              const deadlineStatus = getTaskStatus(row);
              return (
                <RadixTable.Row
                  key={row.id}
                  className={`${styles.tableRow} ${
                    deadlineStatus === TaskStatus.ERROR
                      ? styles.expiredPipelineRow
                      : deadlineStatus === TaskStatus.WARNING
                        ? styles.warningPipelineRow
                        : ''
                  }`}
                >
                  {/* title */}
                  <RadixTable.Cell
                    key={`${row.id}-title`}
                    className={`${styles.tableCell} ${styles.titleCell}`}
                    onClick={() => router?.push('/management?type=tasks')}
                    style={{ cursor: 'pointer' }}
                  >
                    <Flex direction='row' gap='2' align='center' justify='start'>
                      {deadlineStatus === TaskStatus.ERROR && (
                        <span
                          className='material-icons'
                          translate='no'
                          aria-hidden='true'
                          style={{ color: 'var(--text-color-error)' }}
                        >
                          error
                        </span>
                      )}
                      {deadlineStatus === TaskStatus.WARNING && (
                        <span
                          className='material-icons'
                          style={{ color: 'var(--app-yellow-light)' }}
                        >
                          warning
                        </span>
                      )}
                      <Box className={styles.titleBox}>{row.title}</Box>
                    </Flex>
                  </RadixTable.Cell>

                  {/* deadline */}
                  <RadixTable.Cell
                    key={`${row.id}-deadline`}
                    className={`${styles.tableCell} ${styles.deadlineCell}`}
                  >
                    <IconBadge
                      text={`タスク期日: ${row.dueDate ?? '-'}`}
                      icon_name='calendar_today'
                      active
                      icon_color={'var(--text-color-tertiary)'}
                      bg_color={'var(--bg-color-modal)'}
                      text_color={'var(--text-color-tertiary)'}
                      font_size='12px'
                      icon_size='16px'
                      badge_className={styles.iconBadge}
                    />
                  </RadixTable.Cell>

                  {/* status */}
                  <RadixTable.Cell
                    key={`${row.id}-status`}
                    className={`${styles.tableCell} ${styles.statusCell}`}
                  >
                    <TaskFormSelect
                      triggerNode={
                        <Box>
                          <Box
                            className={styles.selectedStatusTab}
                            style={{
                              color:
                                pipelineTaskStatusColorList.find(
                                  (color) =>
                                    statuses.find((status) => status.name === color.id)?.id ===
                                    row.status?.id
                                )?.color ?? 'var(--bg-color-tag-text-active)',
                              border: `1px solid ${
                                pipelineTaskStatusColorList.find(
                                  (color) =>
                                    statuses.find((status) => status.name === color.id)?.id ===
                                    row.status?.id
                                )?.borderColor ?? 'var(--color-secondary)'
                              }`,
                            }}
                          >
                            {statuses.find((status) => status.id === row.status?.id)?.name ?? '-'}
                          </Box>
                        </Box>
                      }
                      items={statuses.map((status) => ({
                        id: status.id?.toString() ?? '',
                        value: status.name ?? '',
                      }))}
                      selectedItem={{
                        id:
                          statuses
                            .find((status) => status.id?.toString() === row.status?.id)
                            ?.id?.toString() ?? '',
                        value:
                          statuses.find((status) => status.id?.toString() === row.status?.id)
                            ?.name ?? '',
                      }}
                      onSelect={(item) => {
                        updateBidPipelineTask(
                          row.pipeline?.pipelineId.toString() ?? '',
                          row.id?.toString() ?? '',
                          {
                            bid_pipeline_task_status_id: Number(item.id),
                          }
                        )
                          .then(() => {
                            const newRow = {
                              ...row,
                              status: statuses.find((status) => status.id?.toString() === item.id),
                            };
                            const updated = targetTasks.map((t) =>
                              t.id === newRow.id ? newRow : t
                            );
                            setTargetTasks(updated);
                            enqueueToast('タスクのステータスを変更しました。');
                          })
                          .catch(() => enqueueToast('タスクのステータス変更に失敗しました。'));
                      }}
                      className={styles.selectTriggerButton}
                    />
                  </RadixTable.Cell>

                  {/* assignee */}
                  <RadixTable.Cell
                    key={`${row.id}-assignee`}
                    className={`${styles.tableCell} ${styles.assigneeCell}`}
                  >
                    <TaskFormSelect
                      triggerNode={
                        <Box>
                          {row.assignedUsers && row.assignedUsers.length > 0 ? (
                            <Box className={styles.selectedAssignedUserTab}>
                              <IconBadge
                                text={
                                  row.assignedUsers?.map((u) => u.name ?? u.email).join(',') ?? '-'
                                }
                                icon_name='account_circle'
                                active
                                icon_color={'var(--text-color-purple)'}
                                bg_color={'var(--bg-color-red)'}
                                text_color={'var(--text-color-purple)'}
                                font_size='12px'
                                icon_size='16px'
                                badge_className={styles.iconBadge}
                              />
                            </Box>
                          ) : (
                            '担当者を選択'
                          )}
                        </Box>
                      }
                      items={users.map((user) => ({
                        id: user.id?.toString() ?? '',
                        value: user.name ?? user.email ?? '',
                      }))}
                      selectedItem={
                        row.assignedUsers && row.assignedUsers.length > 0
                          ? {
                              id:
                                row.assignedUsers
                                  .find((id) =>
                                    users.find((user) => user.id === id)?.id?.toString()
                                  )
                                  ?.toString() ?? '',
                              value:
                                row.assignedUsers
                                  .find(
                                    (id) =>
                                      users.find((user) => user.id === id)?.name ??
                                      users.find((user) => user.id === id)?.email
                                  )
                                  ?.toString() ?? '',
                            }
                          : null
                      }
                      onSelect={(item) => {
                        const selectedUser = users.find((user) => user.id?.toString() === item.id);
                        if (selectedUser?.id) {
                          if (row.assignedUsers?.[0] === selectedUser.id) return;
                          updateBidPipelineTask(
                            row.pipeline?.pipelineId.toString() ?? '',
                            row.id?.toString() ?? '',
                            {
                              assigned_user_ids: [selectedUser.id],
                            }
                          )
                            .then(() => {
                              const newRow = {
                                ...row,
                                assignedUsers: users.filter((user) => user.id === selectedUser.id),
                              };
                              const updated = targetTasks.filter((t) => t.id !== newRow.id);
                              setTargetTasks(updated);
                              if (updated.length <= MYPAGE_MANAGEMENT_TABLE_ROW) {
                                setDisplayAllButton(false);
                              }
                              enqueueToast('タスクの担当者を変更しました。');
                            })
                            .catch(() => enqueueToast('タスクの担当者変更に失敗しました。'));
                        }
                      }}
                      className={styles.selectTriggerButton}
                    />
                  </RadixTable.Cell>

                  {/* taskDescription */}
                  <RadixTable.Cell
                    key={`${row.id}-taskDescription`}
                    className={`${styles.tableCell} ${styles.taskDescriptionCell}`}
                  >
                    {row.description && (
                      <IconBadge
                        text={row.description}
                        icon_name='work'
                        active
                        icon_color={'var(--text-color-green)'}
                        bg_color={'var(--bg-color-green)'}
                        text_color={'var(--text-color-green)'}
                        font_size='12px'
                        icon_size='16px'
                        badge_className={styles.iconBadge}
                      />
                    )}
                  </RadixTable.Cell>
                </RadixTable.Row>
              );
            })}
            {displayAllButton && targetTasks.length > MYPAGE_MANAGEMENT_TABLE_ROW && (
              <RadixTable.Row
                key='displayAllManagementTask'
                className={styles.displayAllRow}
                onClick={() => setDisplayAllButton(false)}
              >
                <RadixTable.Cell
                  key='displayAllManagementTaskCell'
                  colSpan={5}
                  className={styles.tableCell}
                >
                  タスクリストをすべてみる
                </RadixTable.Cell>
              </RadixTable.Row>
            )}
          </RadixTable.Body>
        </RadixTable.Root>
      )}
    </Box>
  );
}
