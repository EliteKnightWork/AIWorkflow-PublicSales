'use client';
import { Box, Flex } from '@radix-ui/themes';
import { useState } from 'react';
import type { ColumnDef } from '@/app/(content)/_components/table/Table';
import { Table } from '@/app/(content)/_components/table/Table';
import LoadingSpinner from '@/components/loadingSpinner/LoadingSpinner';
import ChipText from '../../_components/chipText';
import type { Project } from '../../_components/mockData';
import { mockProjects } from '../../_components/mockData';
import PipelineBoard from '../../_components/pipelineBoard/PipelineBoard';
import { useManagementContext } from '../../_context/ManagementContext';
import { ViewMode } from '../../types';
import styles from './styles.module.css';

export const PipelineManagementPresentational = () => {
  const [viewMode, _setViewMode] = useState<ViewMode>(ViewMode.BOARD);
  const { isPipelineDataLoading } = useManagementContext();

  const projectColumns: ColumnDef[] = [
    {
      id: 'id',
      header: 'ID',
      width: '10%',
      accessor: (row: Project) => row.id,
    },
    {
      id: 'title',
      header: '案件名',
      width: '30%',
      accessor: (row: Project) => row.title,
    },
    {
      id: 'organization',
      header: '発注機関',
      width: '20%',
      accessor: (row: Project) => row.organization,
    },
    {
      id: 'status',
      header: 'ステータス',
      width: '15%',
      accessor: (row: Project) => row.status,
    },
    {
      id: 'deadline',
      header: '締切日',
      width: '15%',
      accessor: (row: Project) => <ChipText date={row.deadline} iconName='calendar_today' />,
    },
    {
      id: 'updatedAt',
      header: '更新日',
      width: '10%',
      accessor: (row: Project) => <ChipText iconName='calendar_today' date={row.updatedAt} />,
    },
  ];

  if (isPipelineDataLoading) {
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
              <span className='material-icons' translate="no" aria-hidden="true">view_column</span>
              <Text>ボード</Text>
            </Flex>
          </Box>
        </Flex>
      </Box> */}
      {viewMode === 'table' ? (
        <Table columns={projectColumns} data={mockProjects} className={styles.tableContainer} />
      ) : (
        <Box className={styles.boardContainer}>
          <PipelineBoard />
        </Box>
      )}
    </>
  );
};
