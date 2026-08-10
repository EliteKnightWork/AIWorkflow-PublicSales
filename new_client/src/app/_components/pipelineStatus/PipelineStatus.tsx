'use client';

import { Box, Flex } from '@radix-ui/themes';
import type { BidPipelineStatus, ProjectBidPipeline } from '@/api/generated/models';
import { TaskFormSelect } from '@/app/(content)/management/_components/taskForm/select/TaskFormSelect';
import { getPipelineStatusColors } from '@/app/(content)/management/types';
import styles from './styles.module.css';

type Props = {
  pipeline: ProjectBidPipeline | null | undefined;
  statuses: BidPipelineStatus[];
  onUpdateStatus?: (statusId: string) => void;
  selectRef?: React.RefObject<HTMLDivElement>;
};

export default function PipelineStatus({ pipeline, statuses, onUpdateStatus, selectRef }: Props) {
  if (!pipeline?.id) return null;

  return (
    <Flex direction='column' gap='4'>
      <Box className={styles.sectionTitle}>案件ステータス</Box>
      <TaskFormSelect
        triggerNode={
          <Box>
            <Box
              className={`${styles.selectedTab} ${styles.selectedStatusTab}`}
              style={{
                color: getPipelineStatusColors(pipeline.status?.stage ?? '').color,
                border: `1px solid ${getPipelineStatusColors(pipeline.status?.stage ?? '').borderColor}`,
              }}
            >
              {statuses.find((s) => s.id === pipeline.status?.id)?.name ?? '-'}
            </Box>
          </Box>
        }
        items={statuses.map((status) => ({
          id: status.id?.toString() ?? '',
          value: status.name ?? '',
        }))}
        selectedItem={{
          id: pipeline.status?.id?.toString() ?? '',
          value:
            statuses.find((s) => s.id?.toString() === pipeline.status?.id?.toString())?.name ?? '',
        }}
        onSelect={(item) => onUpdateStatus?.(item.id)}
        selectRef={selectRef}
      />
    </Flex>
  );
}
