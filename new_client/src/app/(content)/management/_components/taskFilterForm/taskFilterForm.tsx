'use client';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import type { BidPipelineTaskStatus, User } from '@/api/generated/models';
import { AppDatePicker } from '@/app/(content)/_components/datePicker/AppDatePicker';
import { convertDateToYYYYMMDD } from '@/utils/dateUtils';
import { sortTaskStatuses } from '@/utils/statusSort';
import { TaskFormMultiSelect } from '../taskForm/select/TaskFormMultiSelect';
import styles from './styles.module.css';
import {
  NO_ASSIGNED_ID,
  NO_ASSIGNED_MEMBER,
  UNSELECTED_ID,
  UNSELECTED_MEMBER,
  UNSELECTED_STATUS,
} from './types';

export type TaskFilterCondition = {
  statusId?: number;
  assignedUserIds?: number[];
  dueDateFrom?: string;
  dueDateTo?: string;
};

type Props = {
  onSubmit: (filterCondition: TaskFilterCondition) => void;
  onCancel: () => void;
  initialCondition?: TaskFilterCondition;
  statuses?: BidPipelineTaskStatus[];
  members?: User[];
};

export const TaskFilterForm = ({
  onSubmit,
  onCancel,
  initialCondition,
  statuses = [],
  members = [],
}: Props) => {
  const [_taskStatuses, setTaskStatuses] = useState<BidPipelineTaskStatus[]>();
  const [users, setUsers] = useState<User[]>([]);
  const [filterCondition, setFilterCondition] = useState<TaskFilterCondition>({
    statusId: undefined,
    assignedUserIds: undefined,
    dueDateFrom: undefined,
    dueDateTo: undefined,
  });

  useEffect(() => {
    if (initialCondition) {
      setFilterCondition(initialCondition);
    }
  }, [initialCondition]);

  // ステータスデータの加工
  useEffect(() => {
    // stageがtodo,doing,doneの順でそれぞれのorderでsort
    const sortedStatuses = sortTaskStatuses(statuses ?? []);

    const statusesWithOptions = [UNSELECTED_STATUS, ...sortedStatuses];
    setTaskStatuses(statusesWithOptions);
  }, [statuses]);

  // メンバーデータの初期化
  useEffect(() => {
    const membersWithOptions = [UNSELECTED_MEMBER, NO_ASSIGNED_MEMBER, ...members];
    setUsers(membersWithOptions);
  }, [members]);

  return (
    <Flex direction={'column'} className={styles.taskFilterForm}>
      {/* 
        以下、ボード表示時は既に分かれているので、必要なし
        テーブル表示時は必要かも？
       */}
      {/* <Box className={styles.formBox}>
        <Text className={styles.formTitle}>タスクステータス</Text>
        <TaskFormSelect
          className={styles.select}
          triggerNode={
            <Box>
              <Box
                className={`${styles.selectedTab}`}
                style={{
                  color: pipelineTaskStatusColorList.find(
                    (color) =>
                      statuses.find((status) => status.name === color.id)?.id?.toString() ===
                      filterCondition.statusId
                  )?.color ?? 'var(--bg-color-tag-text-active)',
                  border: `1px solid ${pipelineTaskStatusColorList.find(
                    (color) =>
                      statuses.find((status) => status.name === color.id)?.id?.toString() ===
                      filterCondition.statusId
                  )?.borderColor ?? 'var(--border-color-separater)'}`,
                }}
              >
                {
                  taskStatuses.find(status => status.id === filterCondition.statusId)?.name ?? '-'
                }
              </Box>
            </Box>
          }
          items={[
            ...taskStatuses.map((status) => ({
              id: status.id?.toString() ?? '',
              value: status.name ?? '',
            }))
          ]}
          selectedItem={{
            id: filterCondition.statusId?.toString() || UNSELECTED_STATUS.id.toString(),
            value: taskStatuses.find(status => status.id === filterCondition.statusId)?.name ?? UNSELECTED_STATUS.name,
          }}
          onSelect={(item) => {
            const statusId = item.id && item.id !== UNSELECTED_STATUS.id.toString() ? Number(item.id) : undefined;
            setFilterCondition({
              ...filterCondition,
              statusId: statusId,
            });
          }}
        />
      </Box> */}

      <Box className={styles.formBox}>
        <Text className={styles.formTitle}>担当者</Text>
        <TaskFormMultiSelect
          className={styles.select}
          triggerNode={
            <Box>
              {filterCondition.assignedUserIds && filterCondition.assignedUserIds.length > 0 ? (
                <Flex direction='row' gap='1' wrap='wrap' align='center'>
                  {filterCondition.assignedUserIds.map((userId) => {
                    const user = users.find((u) => u.id === userId);
                    return (
                      <Box
                        key={userId}
                        className={`${styles.selectedTab} ${styles.selectedAssignedUserTab}`}
                      >
                        {user?.name ?? user?.email ?? UNSELECTED_MEMBER.name}
                      </Box>
                    );
                  })}
                </Flex>
              ) : (
                <Box className={styles.unselectedTab}>{UNSELECTED_MEMBER.name}</Box>
              )}
            </Box>
          }
          items={[
            ...users.map((user) => ({
              id: user.id?.toString() ?? '',
              value: user.name ?? user.email ?? '',
            })),
          ]}
          selectedIds={filterCondition.assignedUserIds?.map((id) => id.toString()) ?? []}
          onSelectionChange={(selectedIds) => {
            const currentIds = filterCondition.assignedUserIds?.map((id) => id.toString()) ?? [];
            const addedIds = selectedIds.filter((id) => !currentIds.includes(id));

            if (addedIds.length > 0) {
              const addedId = addedIds[0];
              if (addedId === UNSELECTED_ID.toString()) {
                setFilterCondition({
                  ...filterCondition,
                  assignedUserIds: undefined,
                });
              } else if (addedId === NO_ASSIGNED_ID.toString()) {
                setFilterCondition({
                  ...filterCondition,
                  assignedUserIds: [Number(NO_ASSIGNED_ID)],
                });
              } else {
                const filteredCurrentIds = (filterCondition.assignedUserIds ?? []).filter(
                  (id) => id !== Number(UNSELECTED_ID) && id !== Number(NO_ASSIGNED_ID)
                );
                setFilterCondition({
                  ...filterCondition,
                  assignedUserIds: [...filteredCurrentIds, Number(addedId)],
                });
              }
            } else {
              setFilterCondition({
                ...filterCondition,
                assignedUserIds: selectedIds.map((id) => Number(id)),
              });
            }
          }}
        />
      </Box>

      <Box className={styles.formBox}>
        <Text className={styles.formTitle}>タスク期日</Text>
        <Flex
          direction={'row'}
          justify={'start'}
          align={'center'}
          className={styles.dateRangeContainer}
        >
          <Box className={styles.datePickerContainer}>
            <AppDatePicker
              maxDate={filterCondition.dueDateTo ? new Date(filterCondition.dueDateTo) : undefined}
              value={
                filterCondition.dueDateFrom ? new Date(filterCondition.dueDateFrom) : undefined
              }
              placeholderText='選択してください'
              onChange={(date) => {
                setFilterCondition({
                  ...filterCondition,
                  dueDateFrom: date ? convertDateToYYYYMMDD(date) : undefined,
                });
              }}
            />
            <span className='material-icons' style={{ color: '#373b47', fontSize: '24px' }}>
              calendar_today
            </span>
          </Box>
          <span className={styles.dateRangeSeparator}>〜</span>
          <Box className={styles.datePickerContainer}>
            <AppDatePicker
              minDate={
                filterCondition.dueDateFrom ? new Date(filterCondition.dueDateFrom) : undefined
              }
              value={filterCondition.dueDateTo ? new Date(filterCondition.dueDateTo) : undefined}
              placeholderText='選択してください'
              onChange={(date) => {
                setFilterCondition({
                  ...filterCondition,
                  dueDateTo: date ? convertDateToYYYYMMDD(date) : undefined,
                });
              }}
            />
            <span className='material-icons' style={{ color: '#373b47', fontSize: '24px' }}>
              calendar_today
            </span>
          </Box>
        </Flex>
      </Box>

      <Box className={styles.divider} />

      <Box className={styles.formBox}>
        <Flex className={styles.buttonBox} direction='row' justify='center' align='center'>
          <Button className={styles.cancelButton} onClick={onCancel}>
            キャンセル
          </Button>
          <Button className={styles.submitButton} onClick={() => onSubmit(filterCondition)}>
            絞り込む
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
};
