import {
  type Active,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  MouseSensor,
  type Over,
  type UniqueIdentifier,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { Box, Button, Flex, Separator } from '@radix-ui/themes';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useGetBidPipelineTaskStatuses } from '@/api/generated/endpoints/bid-pipeline-task-statuses';
import { useGetCompanyMembers } from '@/api/generated/endpoints/companies';
import type { BidPipelineTask } from '@/api/generated/models';
import { useTaskBoard } from '@/app/(content)/management/_context/ManagementContext';
import AppOverlayModal from '@/components/appOverlayModal/AppOverlayModal';
import FilterClearButton from '@/components/filterClearButton/FilterClearButton';
import { RoundButton } from '@/components/roundButton/RoundeButton';
import ManagementSideBar from '../../_container/managementSidebar';
import { useTaskFilter } from '../../_hooks/useTaskFilter';
import { ChipList } from '../chipList/ChipList';
import StatusText from '../statusText/StatusText';
import { TaskFilterForm } from '../taskFilterForm/taskFilterForm';
import DraggableCard from './DraggableCard';
import styles from './styles.module.css';

function Droppable({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return <div ref={setNodeRef}>{children}</div>;
}

export default function TaskBoard() {
  const { pipelineTaskData, moveTask, onAddTask, onDeleteTask } = useTaskBoard();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | undefined>(undefined);
  const searchParams = useSearchParams();

  // APIデータ取得
  const { data: bidPipelineTaskStatusesData } = useGetBidPipelineTaskStatuses();
  const { data: companyMembersData } = useGetCompanyMembers();

  // メモ化したデータ
  const statuses = useMemo(
    () => bidPipelineTaskStatusesData?.bidPipelineTaskStatuses ?? [],
    [bidPipelineTaskStatusesData]
  );
  const members = useMemo(() => companyMembersData?.members ?? [], [companyMembersData]);

  // カスタムフックを使用してフィルタリング処理を管理
  const {
    filteredData: dispTaskBoardData,
    filters,
    setFilters,
    filterCondition: taskFilterCondition,
    setFilterCondition: setTaskFilterCondition,
    inputValue,
    setInputValue,
    isFilterPopoverOpen,
    setIsFilterPopoverOpen,
  } = useTaskFilter(pipelineTaskData);

  const getData = (event: { active: Active; over: Over | null }) => {
    const { active, over } = event;
    if (!active || !over) return;
    if (active.id === over.id) return;
    const fromData = active.data.current?.sortable;
    if (!fromData) return;
    const toData = over.data.current?.sortable;
    const toDataNotSortable = {
      containerId: over.id,
      index: Number.NaN,
      items: Number.NaN,
    };
    return {
      from: fromData,
      to: toData ?? toDataNotSortable,
    };
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const data = getData(event);
    if (!data) return;
    const { from, to } = data;
    if (from.containerId !== to.containerId) {
      const fromList = pipelineTaskData.list.find((list) => list.id === from.containerId);
      const toList = pipelineTaskData.list.find((list) => list.id === to.containerId);
      if (!fromList || !toList) return;
      const moveTicket = fromList.projects.find((project) => project.id === from.items[from.index]);
      if (!moveTicket) return;
      moveTask(from.containerId, to.containerId, moveTicket.id);
      return;
    }

    // 同じステータス内の移動はしない

    // const fromList = projectData.list.find((list) => list.id === from.containerId);
    // if (!fromList) return;

    // const newProjects = arrayMove(fromList.projects, from.index, to.index);
    // const newList = [
    //   ...projectData.list.filter((list) => list.id !== from.containerId),
    //   { ...fromList, projects: newProjects },
    // ];
    // newList.sort((a, b) => a.order - b.order);

    // moveTask(from.containerId, to.containerId, newProjects[to.index].id);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (!active) return;
    setActiveId(active.id);
  };

  const getProject = (id: UniqueIdentifier) => {
    for (const list of pipelineTaskData.list) {
      for (const project of list.projects) {
        if (project.id === id) {
          return project;
        }
      }
    }
    return undefined;
  };

  const handleCardClick = (task?: BidPipelineTask) => {
    try {
      setSelectedTaskId(task?.id);
      setIsSideBarOpen(true);
    } catch (error) {
      console.error('Failed to convert project:', error);
    }
  };

  useEffect(() => {
    const createTaskParam = searchParams.get('createTask');
    if (createTaskParam === 'true') {
      setSelectedTaskId(undefined);
      setIsSideBarOpen(true);
    }
  }, [searchParams]);

  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 5 } }));

  return (
    <>
      <Flex gap='4' justify='between' className={styles.buttonArea}>
        <Box className={styles.searchInputBox}>
          <span className='material-icons-outlined' translate='no' aria-hidden='true'>
            search
          </span>
          <ChipList
            inputChips={filters}
            onClickClose={(id) => {
              setFilters((prev) => prev.filter((_, index) => index !== id));
            }}
          >
            <input
              type='text'
              className={styles.searchInput}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder='タスク名・案件名'
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing && inputValue.length > 0) {
                  setFilters([...filters, inputValue]);
                  setInputValue('');
                } else if (e.key === 'Backspace' && inputValue.length === 0) {
                  setFilters((prev) => prev.slice(0, prev.length - 1));
                  setInputValue('');
                }
              }}
            />
          </ChipList>
          <Flex gap='2' align={'center'}>
            <Box width='4px' height='100%'>
              <Separator orientation='vertical' className={styles.projectInputSeparator} />
            </Box>
            {filters.length > 0 && (
              <FilterClearButton
                onClick={(e) => {
                  e.stopPropagation();
                  setFilters([]);
                }}
              />
            )}
          </Flex>
        </Box>
        <Box style={{ display: 'flex' }}>
          <RoundButton
            text='絞り込み'
            icon='filter_alt'
            buttonClassName={styles.roundButton}
            onClick={() => setIsFilterPopoverOpen(true)}
          />
        </Box>
      </Flex>
      <AppOverlayModal
        title='絞り込み条件'
        isOpen={isFilterPopoverOpen}
        onClose={() => setIsFilterPopoverOpen(false)}
        contentComponent={
          <Box style={{ display: 'flex', justifyContent: 'center' }}>
            <TaskFilterForm
              initialCondition={taskFilterCondition}
              onSubmit={(newCondition) => {
                setTaskFilterCondition(newCondition);
                setIsFilterPopoverOpen(false);
              }}
              onCancel={() => {
                setIsFilterPopoverOpen(false);
              }}
              statuses={statuses}
              members={members}
            />
          </Box>
        }
      />
      <Box className={styles.scrollableContainer}>
        <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart} sensors={sensors}>
          <Flex gap='2' className={styles.taskBoard}>
            {dispTaskBoardData.list.map((list) => (
              <Droppable key={list.id} id={list.id}>
                <Box
                  className={styles.StatusBoard}
                  style={{ width: `calc(${80 / dispTaskBoardData.list.length}vw - 20px)` }}
                >
                  <Box className={styles.statusHeader}>
                    <StatusText
                      text={list.title}
                      color={list.color}
                      borderColor={list.borderColor}
                    />
                  </Box>
                  <SortableContext
                    id={list.id}
                    key={list.id}
                    items={list.projects.map((project) => project.id ?? '')}
                  >
                    <Flex className={styles.statusSortableArea} direction={'column'}>
                      {list.projects.map((project) => (
                        <DraggableCard
                          key={project.id}
                          elm={project}
                          onClick={() => handleCardClick(project)}
                        />
                      ))}
                    </Flex>
                  </SortableContext>
                  <Button
                    variant='ghost'
                    className={styles.addButton}
                    onClick={() => handleCardClick()}
                  >
                    <span className='material-icons' translate='no' aria-hidden='true'>
                      add
                    </span>
                    追加する
                  </Button>
                </Box>
              </Droppable>
            ))}
          </Flex>
          {activeId && (
            <DragOverlay>
              <DraggableCard key={activeId} elm={getProject(activeId)} cursor={'grabbing'} />
            </DragOverlay>
          )}
        </DndContext>
      </Box>
      <ManagementSideBar
        isOpen={isSideBarOpen}
        isPipeline={false}
        taskId={selectedTaskId}
        onCreateTask={(task) => {
          onAddTask(task);
        }}
        onDeleteTask={(task) => {
          onDeleteTask(task);
        }}
        onClose={() => {
          setSelectedTaskId(undefined);
          setIsSideBarOpen(false);
        }}
      />
    </>
  );
}
