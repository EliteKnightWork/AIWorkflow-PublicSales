'use client';

import { Box, Flex } from '@radix-ui/themes';
import type { ProjectBidPipeline, User } from '@/api/generated/models';
import { TaskFormMultiSelect } from '@/app/(content)/management/_components/taskForm/select/TaskFormMultiSelect';
import styles from './styles.module.css';

type Props = {
  pipeline: ProjectBidPipeline | null | undefined;
  users: User[];
  onUpdateAssignedUser?: (assignedUserIds: number[]) => void;
  selectRef?: React.RefObject<HTMLDivElement>;
};

export default function PipelineAssignee({
  pipeline,
  users,
  onUpdateAssignedUser,
  selectRef,
}: Props) {
  if (!pipeline?.id) return null;

  return (
    <Flex direction='column' gap='4'>
      <Box className={styles.sectionTitle}>担当者</Box>
      <TaskFormMultiSelect
        triggerNode={
          <Box>
            {pipeline.assignedUsers && pipeline.assignedUsers.length > 0 ? (
              <Flex direction='row' gap='1'>
                {pipeline.assignedUsers.map((assignedUser) => {
                  const user = users.find((u) => u.id === assignedUser.id);
                  return (
                    <Box
                      key={assignedUser.id}
                      className={`${styles.selectedTab} ${styles.selectedAssignedUserTab}`}
                    >
                      {user?.name ?? user?.email ?? '-'}
                    </Box>
                  );
                })}
              </Flex>
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
          (pipeline.assignedUsers?.map((au) => au.id?.toString()).filter(Boolean) as string[]) ?? []
        }
        onSelectionChange={(selectedIds) => {
          const ids = selectedIds
            .map((id) => users.find((u) => u.id?.toString() === id)?.id)
            .filter(Boolean) as number[];
          onUpdateAssignedUser?.(ids);
        }}
        selectRef={selectRef}
        maxSelection={2}
      />
    </Flex>
  );
}
