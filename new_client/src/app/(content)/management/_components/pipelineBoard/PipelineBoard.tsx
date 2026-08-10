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
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, Button, Flex, Separator } from '@radix-ui/themes';
import { useEffect, useMemo, useState } from 'react';
import { useGetCompanyMembers } from '@/api/generated/endpoints/companies';
import {
  type BidPipeline,
  BidPipelineStatusStage,
  type CustomObject,
  type Project,
} from '@/api/generated/models';
import { usePipelineBoard } from '@/app/(content)/management/_context/ManagementContext';
import AppOverlayModal from '@/components/appOverlayModal/AppOverlayModal';
import FilterClearButton from '@/components/filterClearButton/FilterClearButton';
import LoadingSpinner from '@/components/loadingSpinner/LoadingSpinner';
import { RoundButton } from '@/components/roundButton/RoundeButton';
import { downloadCSV } from '@/lib/csv/downloadCSV';
import { convertProjectToCSV } from '@/lib/csv/project/convertProjectToCSV';
import { formatStatusStage } from '@/utils/statusStageUtils';
import ManagementSideBar from '../../_container/managementSidebar';
import { type PipelineBoardList, usePipelineFilter } from '../../_hooks/usePipelineFilter';
import { ChipList } from '../chipList/ChipList';
import { PipelineFilterForm } from '../pipelineFilterForm/pipelineFilterForm';
import StatusAddMenu from '../statusMenu/StatusAddMenu';
import StatusEditMenu from '../statusMenu/StatusEditMenu';
import StatusText from '../statusText/StatusText';
import DraggableCard from './DraggableCard';
import styles from './styles.module.css';

function Droppable({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div ref={setNodeRef} style={{ height: '100%' }}>
      {children}
    </div>
  );
}

function DraggableList({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const adjustedTransform = transform ? { ...transform, scaleX: 1, scaleY: 1 } : transform;

  return (
    <Box
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(adjustedTransform),
        transition,
        zIndex: isDragging ? 9998 : 'auto',
        opacity: isDragging ? 0.8 : 1,
      }}
    >
      {children}
    </Box>
  );
}

function DraggableListHandle({ id }: { id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  return (
    <Box
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: 'grab',
        userSelect: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        marginRight: 8,
      }}
      {...attributes}
      {...listeners}
      aria-label='ドラッグ用ハンドル'
      className={'material-icons'}
      translate='no'
      aria-hidden='true'
    >
      drag_indicator
    </Box>
  );
}

export default function PipelineBoard() {
  const {
    pipelineBoardData,
    movePipeline,
    movePipelineBoardData,
    addPipelineBoardData,
    updatePipelineBoardData,
    deletePipelineBoardData,
  } = usePipelineBoard();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeStageListIndex, setActiveStageListIndex] = useState<UniqueIdentifier | null>(null);
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<number | undefined>(undefined);
  const [defaultStatusId, setDefaultStatusId] = useState<string | undefined>(undefined);

  // APIデータ取得
  const { data: companyMembersData } = useGetCompanyMembers();

  const members = useMemo(() => companyMembersData?.members ?? [], [companyMembersData]);

  // カスタムフィルターフックを使用
  const {
    filteredData: dispPipelineBoardData,
    filters,
    setFilters,
    filterCondition: pipelineFilterCondition,
    setFilterCondition: setPipelineFilterCondition,
    inputValue,
    setInputValue,
    isFilterPopoverOpen,
    setIsFilterPopoverOpen,
    hasActiveCustomFilters,
    isCustomFilterSettled,
  } = usePipelineFilter(pipelineBoardData);

  // フィルター適用完了後にモーダルを閉じるためのフラグ
  const [shouldCloseFilterModal, setShouldCloseFilterModal] = useState(false);

  // カスタムオブジェクトの絞り込みが完了したらモーダルを閉じる
  useEffect(() => {
    if (!shouldCloseFilterModal) return;
    // カスタムオブジェクトの条件がない or 取得が安定（完了）したら閉じる
    if (!hasActiveCustomFilters || isCustomFilterSettled) {
      setIsFilterPopoverOpen(false);
      setShouldCloseFilterModal(false);
    }
  }, [
    shouldCloseFilterModal,
    hasActiveCustomFilters,
    isCustomFilterSettled,
    setIsFilterPopoverOpen,
  ]);

  const pipelineBoardDataStageList = useMemo(() => {
    const doingList: PipelineBoardList[] = [];
    const doneList: PipelineBoardList[] = [];
    dispPipelineBoardData.list.map((list) => {
      if (list.stage === BidPipelineStatusStage.doing) {
        doingList.push(list);
      } else {
        doneList.push(list);
      }
    });
    return [doingList, doneList];
  }, [dispPipelineBoardData]);

  const stages = [BidPipelineStatusStage.doing, BidPipelineStatusStage.done];

  const getData = (event: { active: Active; over: Over | null }) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) {
      return;
    }
    const fromData = active.data.current?.sortable;
    if (!fromData) {
      return;
    }
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
    setActiveStageListIndex(null);
    const data = getData(event);
    if (!data) return;
    const { from, to } = data;

    // 同一stage内でのlistのorder移動
    if (
      String(from.containerId).startsWith('stage-list') &&
      from.containerId === to.containerId &&
      from.index !== to.index
    ) {
      const listIndex = from.containerId.split('-')[2];
      const fromList = pipelineBoardDataStageList[listIndex][from.index];
      movePipelineBoardData(fromList.id, to.index);
      return;
    }

    // 他のlistへのticket移動
    if (from.containerId !== to.containerId) {
      const fromList = pipelineBoardData.list.find((list) => list.id === from.containerId);
      const toList = String(to.containerId).startsWith('stage-list')
        ? pipelineBoardDataStageList[to.containerId.split('-')[2]][to.index]
        : pipelineBoardData.list.find((list) => list.id === to.containerId);
      if (!fromList || !toList || fromList === toList) return;
      const moveTicket = fromList.pipelines.find(
        (project) => project.id === from.items[from.index]
      );
      if (!moveTicket || !moveTicket.id) return;
      movePipeline(from.containerId, toList.id, moveTicket.id);
      return;
    }

    // const fromList = pipelineBoardData.list.find((list) => list.id === from.containerId);
    // if (!fromList) return;

    // 同じステータス内の入れ替え
    // const newProjects = arrayMove(fromList.pipelines, from.index, to.index);
    // const newList = [
    //   ...pipelineBoardData.list.filter((list) => list.id !== from.containerId),
    //   { ...fromList, projects: newProjects },
    // ];
    // newList.sort((a, b) => b.order - a.order);

    // // 同じステータス内の入れ替えの場合は、APIを呼び出さずに状態を更新
    // const currentList = pipelineBoardData.list;
    // setPipelineBoardData({ ...pipelineBoardData, list: newList });
  };

  // const handleDragOver = (event: DragEndEvent) => {
  //   const data = getData(event);
  //   if (!data) return;

  //   const currentList = pipelineBoardData.list;
  //   const { from, to } = data;
  //   if (from.containerId === to.containerId) return;
  //   const fromList = currentList.find((list) => list.id == from.containerId);
  //   const toList = currentList.find((list) => list.id == to.containerId);
  //   if (!fromList || !toList) return;
  //   const moveTicket = fromList.pipelines.find((project) => project.id === from.items[from.index]);
  //   if (!moveTicket) return;

  //   // 案件データのステータスを更新する
  //   if (moveTicket.id) {
  //     movePipeline(from.containerId, to.containerId, moveTicket.id);
  //   }
  // };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (!active) return;
    const containerId = active.data.current?.sortable.containerId;
    if (String(containerId).startsWith('stage-list')) {
      const index = pipelineBoardDataStageList.findIndex((stageList) =>
        stageList.some((list) => list.id === active.id)
      );
      if (index !== -1) {
        setActiveStageListIndex(index);
      }
    }
    const prefix = String(containerId).startsWith('stage-list') ? 'list' : 'project';
    setActiveId(`${prefix}-${active.id}`);
  };

  const getProject = (id: UniqueIdentifier) => {
    for (const list of pipelineBoardData.list) {
      for (const project of list.pipelines) {
        if (project.id === id) {
          return project;
        }
      }
    }
    return undefined;
  };

  const handleCardClick = (project?: BidPipeline, statusId?: string) => {
    try {
      setSelectedPipelineId(project?.id);
      setDefaultStatusId(statusId);
      setIsSideBarOpen(true);
    } catch (error) {
      console.error('Failed to convert project:', error);
    }
  };

  const handleSidebarClose = () => {
    setIsSideBarOpen(false);
    setDefaultStatusId(undefined);
  };

  const createCsv = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date();
    const timestamp =
      now.getFullYear() +
      `0${now.getMonth() + 1}`.slice(-2) +
      `0${now.getDate()}`.slice(-2) +
      `0${now.getHours()}`.slice(-2) +
      `0${now.getMinutes()}`.slice(-2) +
      `0${now.getSeconds()}`.slice(-2);

    // データをProject型に変換
    const pipelines = pipelineBoardData.list.flatMap((list) => list.pipelines);
    const projects: Project[] = [];
    const customObjectsByPipelineId = new Map<number, CustomObject[]>();
    for (const pipeline of pipelines) {
      const project = pipeline.project;
      if (project) {
        project.bidPipeline = {
          id: pipeline.id,
          status: pipeline.status,
          assignedUsers: pipeline.assignedUsers,
        };
        projects.push(project);
        if (
          pipeline.id != null &&
          pipeline.customObjects != null &&
          pipeline.customObjects.length > 0
        ) {
          customObjectsByPipelineId.set(pipeline.id, pipeline.customObjects);
        }
      }
    }

    if (projects.length === 0) return;

    const userNameById = new Map<number, string>();
    members.forEach((member) => {
      if (member?.id == null) return;
      const name = member.name?.trim();
      const email = member.email?.trim();
      userNameById.set(member.id, name && name.length > 0 ? name : (email ?? ''));
    });

    const csv = convertProjectToCSV(projects, {
      customObjectsByPipelineId,
      userNameById: userNameById.size > 0 ? userNameById : undefined,
    });
    downloadCSV(csv, `案件管理-案件リスト_${timestamp}.csv`);
  };

  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 5 } }));

  return (
    <>
      <Flex gap='4' justify='between' className={styles.buttonArea}>
        <RoundButton
          text='CSV出力'
          icon='download'
          onClick={(event) => {
            void createCsv(event);
          }}
          buttonClassName={styles.roundButton}
          disabled={dispPipelineBoardData.list.flatMap((list) => list.pipelines).length === 0}
        />
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
              placeholder='案件名'
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
            {shouldCloseFilterModal ? (
              <Flex direction='column' align='center' gap='3' style={{ padding: '24px' }}>
                <LoadingSpinner />
              </Flex>
            ) : (
              <PipelineFilterForm
                initialCondition={pipelineFilterCondition}
                onSubmit={(condition) => {
                  setPipelineFilterCondition(condition);
                  // 提出された条件にカスタムオブジェクト条件が含まれるかを判定
                  const cof = condition.customObjectFilters || {};
                  const willUseCustomFilters = Object.values(cof).some((v: any) => {
                    if (!v) return false;
                    switch (v.type) {
                      case 'checkbox':
                        return Array.isArray(v.selectedChoiceIds) && v.selectedChoiceIds.length > 0;
                      case 'radio':
                        return v.selectedChoiceId != null;
                      case 'person':
                        return v.userId != null;
                      case 'free_text':
                      case 'free_text_multiline':
                        return Boolean(v.text && String(v.text).trim().length > 0);
                      case 'url':
                        return Boolean(v.url && String(v.url).trim().length > 0);
                      case 'calendar': {
                        const from = typeof v.from === 'string' ? v.from.trim() : '';
                        const to = typeof v.to === 'string' ? v.to.trim() : '';
                        return Boolean(from || to);
                      }
                      case 'number': {
                        const from = typeof v.from === 'string' ? v.from.trim() : '';
                        const to = typeof v.to === 'string' ? v.to.trim() : '';
                        return Boolean(from || to);
                      }
                      default:
                        return false;
                    }
                  });

                  if (willUseCustomFilters) {
                    // 絞り込み完了後に閉じる
                    setShouldCloseFilterModal(true);
                  } else {
                    // カスタムオブジェクト条件がなければ即閉じる
                    setIsFilterPopoverOpen(false);
                  }
                }}
                onCancel={() => setIsFilterPopoverOpen(false)}
                members={members}
              />
            )}
          </Box>
        }
      />

      <Box className={styles.scrollableContainer}>
        <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart} sensors={sensors}>
          <Droppable key={pipelineBoardData.id} id={pipelineBoardData.id}>
            <SortableContext
              id={pipelineBoardData.id}
              key={pipelineBoardData.id}
              items={pipelineBoardData.list.map((list) => list.id ?? '')}
            >
              <Box
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '8px',
                  alignItems: 'flex-start',
                }}
              >
                {pipelineBoardDataStageList.map((stageList, index) => {
                  const isDropDisabled =
                    activeStageListIndex !== null && activeStageListIndex !== index;
                  const stageListIds = stageList.map((l) => l.id);
                  return (
                    <SortableContext
                      id={`stage-list-${index}`}
                      key={`stage-list-${stageListIds.join('_')}`}
                      items={stageListIds}
                    >
                      <Box className={styles.stageList}>
                        <Box
                          className={`${styles.stageHeader} ${index === 0 ? styles.doingColor : styles.doneColor} ${isDropDisabled ? styles.disabledDropTarget : ''}`}
                        >
                          <Box className={styles.stageTitle}>
                            {formatStatusStage(stages[index])}
                          </Box>
                          <StatusAddMenu stage={stages[index]} onAddClick={addPipelineBoardData} />
                        </Box>
                        <Flex direction='row' gap='2' className={styles.stageListFlex}>
                          {stageList.map((list) => (
                            <DraggableList key={list.id} id={list.id}>
                              <SortableContext
                                id={list.id}
                                key={list.id}
                                items={list.pipelines.map((project) => project.id ?? '')}
                              >
                                <Box
                                  className={`${styles.statusBoard} ${isDropDisabled ? styles.disabledDropTarget : ''}`}
                                  style={{
                                    width: `${80 / dispPipelineBoardData.list.length}vw`,
                                    pointerEvents: isDropDisabled ? 'none' : 'auto',
                                    opacity: isDropDisabled ? 0.5 : 1,
                                  }}
                                >
                                  <Box className={styles.statusHeader}>
                                    <Flex>
                                      <DraggableListHandle id={list.id} />
                                      <StatusText
                                        text={list.title}
                                        color={list.color}
                                        borderColor={list.borderColor}
                                      />
                                    </Flex>
                                    <StatusEditMenu
                                      id={list.id}
                                      statusList={pipelineBoardData.list}
                                      onAddStatus={addPipelineBoardData}
                                      onEditStatus={updatePipelineBoardData}
                                      onDeleteStatus={deletePipelineBoardData}
                                    />
                                  </Box>
                                  <Droppable id={list.id} key={list.id}>
                                    <Flex
                                      className={styles.statusSortableArea}
                                      direction={'column'}
                                    >
                                      {list.pipelines.map((project) => (
                                        <DraggableCard
                                          key={project.id}
                                          elm={project}
                                          onClick={() => handleCardClick(project)}
                                        />
                                      ))}
                                    </Flex>
                                  </Droppable>
                                  <Button
                                    variant='ghost'
                                    className={styles.addButton}
                                    onClick={() => {
                                      handleCardClick(undefined, list.id);
                                    }}
                                  >
                                    <span
                                      className='material-icons'
                                      translate='no'
                                      aria-hidden='true'
                                    >
                                      add
                                    </span>
                                    追加する
                                  </Button>
                                </Box>
                              </SortableContext>
                            </DraggableList>
                          ))}
                        </Flex>
                      </Box>
                    </SortableContext>
                  );
                })}
              </Box>
            </SortableContext>
          </Droppable>

          {activeId && activeId.toString().split('-')[0] === 'project' && (
            <DragOverlay style={{ zIndex: 10001, pointerEvents: 'none' }}>
              <DraggableCard
                key={activeId}
                elm={getProject(Number(activeId.toString().split('-')[1]))}
                cursor='grabbing'
              />
            </DragOverlay>
          )}
        </DndContext>
      </Box>

      <ManagementSideBar
        isOpen={isSideBarOpen}
        isPipeline={true}
        pipelineId={selectedPipelineId}
        defaultStatusId={defaultStatusId}
        onClose={handleSidebarClose}
      />
    </>
  );
}
