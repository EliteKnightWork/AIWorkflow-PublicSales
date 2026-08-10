'use client';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { useState } from 'react';
import type { BidPipelineTask } from '@/api/generated/models';
import type { ColumnDef } from '@/app/(content)/_components/table/Table';
import { Table } from '@/app/(content)/_components/table/Table';
import LoadingSpinner from '@/components/loadingSpinner/LoadingSpinner';
import ChipText from '../../_components/chipText';
import TaskBoard from '../../_components/taskBoard/TaskBoard';
import { useManagementContext, useTaskBoard } from '../../_context/ManagementContext';
import { ViewMode } from '../../types';
import styles from './styles.module.css';

export const TaskManagementPresentational = () => {
  const [viewMode, _setViewMode] = useState<ViewMode>(ViewMode.BOARD);
  const { pipelineTaskData } = useTaskBoard();
  const { isTaskDataLoading } = useManagementContext();

  // Contextからタスクデータを取得
  const tasks = pipelineTaskData.list.flatMap((list) => list.projects);

  const taskColumns: ColumnDef[] = [
    {
      id: 'title',
      header: 'タスク',
      width: '30%',
      accessor: (row: BidPipelineTask) => <Text className={styles.titleText}>{row.title}</Text>,
    },
    {
      id: 'assignee',
      header: '対象の案件',
      width: '30%',
      accessor: (row: BidPipelineTask) => (
        <ChipText
          backgroundColor='var(--bg-color-green)'
          color='var(--text-color-green)'
          date={row.pipeline?.projectTitle ?? '-'}
          iconName='work'
        />
      ),
    },
    {
      id: 'dueDate',
      header: '期日',
      width: '15%',
      accessor: (row: BidPipelineTask) => (
        <ChipText
          backgroundColor='var(--bg-color-info)'
          color='var(--text-color-info)'
          date={row.dueDate ?? '-'}
          iconName='calendar_today'
        />
      ),
    },
    {
      id: 'priority',
      header: 'タスク担当者',
      width: '15%',
      accessor: (row: BidPipelineTask) => (
        <ChipText
          backgroundColor='var(--bg-color-red)'
          color='var(--text-color-purple)'
          date={row.dueDate ?? '-'}
          iconName='account_circle'
        />
      ),
    },
  ];

  if (isTaskDataLoading) {
    return (
      <Box style={{ width: '100%', height: '400px' }}>
        <Flex justify='center' align='center' style={{ height: '100%' }}>
          <LoadingSpinner />
        </Flex>
      </Box>
    );
  }

  return (
    <>
      {/* <Box className={styles.viewToggleContainer}>
        <Flex gap='0'>
          <Box
            className={`${styles.viewToggleButton} ${styles.viewToggleLeftButton} ${viewMode === 'table' ? styles.activeViewToggle : ''}`}
            onClick={() => setViewMode('table')}
          >
            <Flex align='center' justify='center' gap='1'>
              <span className='material-icons' translate="no" aria-hidden="true">table_chart</span>
              <Text>テーブル</Text>
            </Flex>
          </Box>
          <Box
            className={`${styles.viewToggleButton} ${styles.viewToggleRightButton} ${viewMode === 'board' ? styles.activeViewToggle : ''}`}
            onClick={() => setViewMode('board')}
          >
            <Flex align='center' justify='center' gap='1'>
              <span className='material-icons'>view_column</span>
              <Text>ボード</Text>
            </Flex>
          </Box>
        </Flex>
      </Box> */}
      {viewMode === 'table' ? (
        <Table
          columns={taskColumns}
          data={tasks}
          className={styles.tableContainer}
          additionalRow={
            <Flex justify='center' py='3'>
              <Button variant='soft' color='gray'>
                <Flex align='center' gap='2'>
                  <span className='material-icons'>add</span>
                  <Text>タスクを追加</Text>
                </Flex>
              </Button>
            </Flex>
          }
        />
      ) : (
        <Box className={styles.boardContainer}>
          <TaskBoard />
        </Box>
      )}
    </>
  );
};
