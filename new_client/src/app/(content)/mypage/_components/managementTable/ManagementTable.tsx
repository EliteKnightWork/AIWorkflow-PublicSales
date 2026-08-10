'use client';
import { Box, Button, Flex, Table as RadixTable, Text } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { updateBidPipeline } from '@/api/generated/endpoints/bid-pipelines';
import type { BidPipeline, BidPipelineStatus, User } from '@/api/generated/models';
import IconBadge from '@/app/(content)/_components/stateBadge/IconBadge';
import { TaskFormMultiSelect } from '@/app/(content)/management/_components/taskForm/select/TaskFormMultiSelect';
import { TaskFormSelect } from '@/app/(content)/management/_components/taskForm/select/TaskFormSelect';
import {
  getPipelineStatusByDueDate,
  getPipelineStatusColors,
  PipelineStatus,
} from '@/app/(content)/management/types';
import { MYPAGE_MANAGEMENT_TABLE_ROW } from '@/constants';
import { useToast } from '@/context/ToastContext';
import styles from './styles.module.css';

type Props = {
  statuses: BidPipelineStatus[];
  pipelines: BidPipeline[];
  users: User[];
  currentUserId?: number;
  router?: any;
};

export function ManagementTable({ statuses, pipelines, users, currentUserId, router }: Props) {
  const [targetPipelines, setTargetPipelines] = useState<BidPipeline[]>([]);
  const [displayAllButton, setDisplayAllButton] = useState(true);
  const { enqueueToast } = useToast();

  const getPipelineStatus = (pipeline: BidPipeline) => {
    const baseDeadlineDate =
      pipeline.project?.applicationDocumentDeadlineDate ||
      pipeline.project?.proposalDocumentDeadlineDate ||
      pipeline.project?.biddingDeadlineDate;
    if (!baseDeadlineDate) return PipelineStatus.NORMAL;
    return getPipelineStatusByDueDate(baseDeadlineDate);
  };

  useEffect(() => {
    if (pipelines) {
      setTargetPipelines(pipelines);
    }
  }, [pipelines]);

  return (
    <Box className={styles.tableContainer}>
      {targetPipelines.length === 0 ? (
        <Box className={styles.emptyStateContainer}>
          <Flex direction='column' align='center' gap='3'>
            <Text size='6' weight='bold' className={styles.emptyStateText}>
              入札業務の効率アップには「案件管理」の活用がカギです🔑
              <br />
              気になる案件を見つけたら、どんどん追加してみましょう！
            </Text>
            <Button className={styles.findProjectButton} onClick={() => router?.push('/projects')}>
              案件を探す
            </Button>
          </Flex>
        </Box>
      ) : (
        <RadixTable.Root className={styles.tableRoot}>
          <RadixTable.Body className={styles.tableBody}>
            {targetPipelines?.map((row, index) => {
              if (displayAllButton && index > MYPAGE_MANAGEMENT_TABLE_ROW - 1) {
                return;
              }
              const deadlineStatus = getPipelineStatus(row);
              return (
                <RadixTable.Row
                  key={row.id}
                  className={`${styles.tableRow} ${
                    deadlineStatus === PipelineStatus.ERROR
                      ? styles.expiredPipelineRow
                      : deadlineStatus === PipelineStatus.WARNING
                        ? styles.warningPipelineRow
                        : ''
                  }`}
                >
                  {/* title */}
                  <RadixTable.Cell
                    key={`${row.id}-title`}
                    className={`${styles.tableCell} ${styles.titleCell}`}
                    onClick={() => router?.push('/management?type=pipeline')}
                    style={{ cursor: 'pointer' }}
                  >
                    <Flex direction='row' gap='2' align='center' justify='start'>
                      {deadlineStatus === PipelineStatus.ERROR && (
                        <span
                          className='material-icons'
                          translate='no'
                          aria-hidden='true'
                          style={{ color: 'var(--text-color-error)' }}
                        >
                          error
                        </span>
                      )}
                      {deadlineStatus === PipelineStatus.WARNING && (
                        <span
                          className='material-icons'
                          style={{ color: 'var(--app-yellow-light)' }}
                        >
                          warning
                        </span>
                      )}
                      <Box className={styles.titleBox}>{row.project?.title}</Box>
                    </Flex>
                  </RadixTable.Cell>

                  {/* deadline */}
                  <RadixTable.Cell
                    key={`${row.id}-deadline`}
                    className={`${styles.tableCell} ${styles.deadlineCell}`}
                  >
                    <IconBadge
                      text={`入札日: ${row.project?.biddingDeadlineDate ?? '-'}`}
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
                              color: getPipelineStatusColors(row.status?.stage ?? '').color,
                              border: `1px solid ${getPipelineStatusColors(row.status?.stage ?? '').borderColor}`,
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
                        updateBidPipeline(row.id?.toString() ?? '', {
                          bid_pipeline_status_id: Number(item.id),
                        })
                          .then(() => {
                            const newRow = {
                              ...row,
                              status: statuses.find((status) => status.id?.toString() === item.id),
                            };
                            const updated = targetPipelines.map((p) =>
                              p.id === newRow.id ? newRow : p
                            );
                            setTargetPipelines(updated);
                            enqueueToast('案件のステータスを変更しました。');
                          })
                          .catch(() => enqueueToast('案件のステータス変更に失敗しました。'));
                      }}
                      className={styles.selectTriggerButton}
                    />
                  </RadixTable.Cell>

                  {/* assignee */}
                  <RadixTable.Cell
                    key={`${row.id}-assignee`}
                    className={`${styles.tableCell} ${styles.assigneeCell}`}
                  >
                    <TaskFormMultiSelect
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
                      selectedIds={
                        row.assignedUsers
                          ?.map((user) => user.id?.toString() ?? '')
                          .filter(Boolean) ?? []
                      }
                      onSelectionChange={(selectedIds) => {
                        const assignedUserIds = selectedIds
                          .map((id) => Number(id))
                          .filter((id) => !Number.isNaN(id));

                        updateBidPipeline(row.id?.toString() ?? '', {
                          assigned_user_ids: assignedUserIds,
                        })
                          .then(() => {
                            const updatedAssignedUsers = users.filter((user) =>
                              assignedUserIds.includes(user.id ?? -1)
                            );
                            const updatedRow = { ...row, assignedUsers: updatedAssignedUsers };
                            const shouldKeepRow = currentUserId
                              ? assignedUserIds.includes(currentUserId)
                              : true;

                            setTargetPipelines((prev) => {
                              if (shouldKeepRow) {
                                return prev.map((p) => (p.id === updatedRow.id ? updatedRow : p));
                              }
                              const filtered = prev.filter((p) => p.id !== updatedRow.id);
                              if (filtered.length <= MYPAGE_MANAGEMENT_TABLE_ROW) {
                                setDisplayAllButton(false);
                              }
                              return filtered;
                            });

                            enqueueToast('案件の担当者を変更しました。');
                          })
                          .catch(() => enqueueToast('案件の担当者変更に失敗しました。'));
                      }}
                      className={styles.selectTriggerButton}
                      maxSelection={2}
                    />
                  </RadixTable.Cell>

                  {/* taskDescription */}
                  <RadixTable.Cell
                    key={`${row.id}-taskDescription`}
                    className={`${styles.tableCell} ${styles.taskDescriptionCell}`}
                  >
                    {row.upcommingTask && (
                      <IconBadge
                        text={row.upcommingTask.title}
                        icon_name='task'
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
            {displayAllButton && targetPipelines.length > MYPAGE_MANAGEMENT_TABLE_ROW && (
              <RadixTable.Row
                key='displayAllManagementPipeline'
                className={styles.displayAllRow}
                onClick={() => setDisplayAllButton(false)}
              >
                <RadixTable.Cell
                  key='displayAllManagementPipelineCell'
                  colSpan={5}
                  className={styles.tableCell}
                >
                  案件リストをすべてみる
                </RadixTable.Cell>
              </RadixTable.Row>
            )}
          </RadixTable.Body>
        </RadixTable.Root>
      )}
    </Box>
  );
}
