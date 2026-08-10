import * as Popover from '@radix-ui/react-popover';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import type { BidPipelineStatusStage } from '@/api/generated/models';
import { formatStatusStage } from '@/utils/statusStageUtils';
import type { PipelineList } from '../../_context/ManagementContext';
import StatusText from '../statusText/StatusText';
import { DeleteErrorDialog } from './deleteErrorDialog';
import styles from './styles.module.css';

type Props = {
  id: string;
  statusList: PipelineList[];
  onAddStatus?: (title: string, stage: BidPipelineStatusStage) => void;
  onEditStatus?: (id: string, title: string) => void;
  onDeleteStatus?: (id: string) => void;
};

export default function StatusEditMenu({
  id,
  statusList,
  onAddStatus,
  onEditStatus,
  onDeleteStatus,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatusList, setSelectedStatusList] = useState<PipelineList | undefined>(undefined);
  const [currentStage, setCurrentStage] = useState<BidPipelineStatusStage | null>(null);
  const [stageColor, setStageColor] = useState<string>('');
  const [isAddingStatus, setIsAddingStatus] = useState<boolean>(false);
  const [newStatusTitle, setNewStatusTitle] = useState<string>('');
  const [isComposing, setIsComposing] = useState(false);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editStatusTitle, setEditStatusTitle] = useState<string>('');
  const [statusMenuOpen, setStatusMenuOpen] = useState<string | null>(null);
  const [isOpenErrorDialog, setIsOpenErrorDialog] = useState<boolean>(false);

  const handleAddStatusClick = () => {
    // 編集中の場合は新規追加を許可しない
    if (editingStatusId) return;

    setIsAddingStatus(true);
    setNewStatusTitle('');
  };

  const handleSaveStatus = () => {
    const title = newStatusTitle.trim();
    if (title && onAddStatus && currentStage) {
      onAddStatus(title, currentStage);
    }
    setIsAddingStatus(false);
    setNewStatusTitle('');
  };

  const handleCancelAdd = () => {
    setIsAddingStatus(false);
    setNewStatusTitle('');
  };

  const handleInputChange = (value: string) => {
    setNewStatusTitle(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isComposing) {
      handleSaveStatus();
    } else if (e.key === 'Escape' && !isComposing) {
      handleCancelAdd();
    }
  };

  // 編集機能のハンドラー
  const handleEditClick = (statusId: string, currentTitle: string) => {
    // 新規追加中の場合は編集を許可しない
    if (isAddingStatus) return;

    setEditingStatusId(statusId);
    setEditStatusTitle(currentTitle);
    setStatusMenuOpen(null);
  };

  const handleSaveEdit = () => {
    const title = editStatusTitle.trim();
    if (title && editingStatusId && onEditStatus) {
      onEditStatus(editingStatusId, title);
    }
    setEditingStatusId(null);
    setEditStatusTitle('');
  };

  const handleCancelEdit = () => {
    setEditingStatusId(null);
    setEditStatusTitle('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isComposing) {
      handleSaveEdit();
    } else if (e.key === 'Escape' && !isComposing) {
      handleCancelEdit();
    }
  };

  // 削除機能のハンドラー
  const handleDeleteClick = (statusId: string) => {
    if (onDeleteStatus) {
      const target = statusList.find((l) => l.id === statusId);
      if (target && target.pipelines.length > 0) {
        setIsOpenErrorDialog(true);
      } else {
        onDeleteStatus(statusId);
      }
    }
    setStatusMenuOpen(null);
  };

  const handleStatusMenuClick = (e: React.MouseEvent, statusId: string) => {
    e.stopPropagation();
    // 新規追加中または編集中の場合はメニューを開かない
    if (isAddingStatus || editingStatusId) return;

    setStatusMenuOpen(statusMenuOpen === statusId ? null : statusId);
  };

  const canUpdateStatus = (status: PipelineList) => {
    return !status.isUneditable;
  };

  const getEditButtonStyle = (status: PipelineList) => {
    const canDelete = canUpdateStatus(status);
    return {
      padding: '8px 12px',
      cursor: canDelete ? 'pointer' : 'not-allowed',
      fontSize: '14px',
      color: canDelete ? 'var(--text-color-primary)' : 'var(--text-color-secondary)',
      opacity: canDelete ? 1 : 0.5,
      borderBottom: '1px solid var(--border-color-separater)',
    };
  };

  const getDeleteButtonStyle = (status: PipelineList) => {
    const canDelete = canUpdateStatus(status);
    return {
      padding: '8px 12px',
      cursor: canDelete ? 'pointer' : 'not-allowed',
      fontSize: '14px',
      color: canDelete ? 'var(--text-color-error)' : 'var(--text-color-secondary)',
      opacity: canDelete ? 1 : 0.5,
    };
  };

  useEffect(() => {
    const selected = statusList.filter((l) => l.id === id);
    if (selected.length === 0) return;
    setSelectedStatusList(selected[0]);
    setCurrentStage(selected[0].stage);
  }, [statusList, id]);

  useEffect(() => {
    if (currentStage) {
      const target = statusList.find((l) => l.stage === currentStage);
      setStageColor(target?.color ?? '');
    }
  }, [statusList, currentStage]);

  useEffect(() => {
    if (isOpen) {
      setIsAddingStatus(false);
      setEditingStatusId(null);
      setStatusMenuOpen(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (statusMenuOpen) {
        setStatusMenuOpen(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    // クリーンアップ関数を追加
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [statusMenuOpen]);

  return (
    selectedStatusList &&
    currentStage && (
      <>
        <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
          <Popover.Trigger asChild>
            <Flex className={styles.moreHorizIcon}>
              <span className={'material-icons'} translate='no' aria-hidden='true'>
                more_horiz
              </span>
            </Flex>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content className={styles.popoverContent} sideOffset={5}>
              <Flex direction='column'>
                <Box className={styles.statusHeader}>
                  <StatusText
                    text={selectedStatusList.title}
                    color={selectedStatusList.color}
                    borderColor={selectedStatusList.borderColor}
                  />
                  <Popover.Close className={styles.popoverClose}>
                    <span className={'material-icons'} translate='no' aria-hidden='true'>
                      close
                    </span>
                  </Popover.Close>
                </Box>
                <Box className={styles.stageContainer}>
                  <Flex justify='between' align='center' px='24px' py='8px'>
                    <Flex gap='1' align='center'>
                      <span
                        className={'material-icons'}
                        translate='no'
                        aria-hidden='true'
                        style={{ color: stageColor, fontSize: '16px' }}
                      >
                        square
                      </span>
                      <Text className={styles.stageTitle}>{formatStatusStage(currentStage)}</Text>
                    </Flex>
                    <Box
                      className={styles.addStatusButton}
                      onClick={handleAddStatusClick}
                      style={{
                        cursor: editingStatusId ? 'not-allowed' : 'pointer',
                        opacity: editingStatusId ? 0.5 : 1,
                      }}
                    >
                      <span className={'material-icons'} translate='no' aria-hidden='true'>
                        add
                      </span>
                    </Box>
                  </Flex>
                  {statusList
                    .filter((l) => l.stage === currentStage)
                    .map((l) => (
                      <Flex
                        key={l.id}
                        justify='between'
                        align='center'
                        py='8px'
                        pl='8px'
                        pr='24px'
                        style={{ position: 'relative' }}
                      >
                        {editingStatusId === l.id ? (
                          // 編集モード
                          <Box className={styles.editStatusBox}>
                            <Box
                              onClick={handleCancelEdit}
                              className={styles.editStatusCloseButton}
                            >
                              <span
                                className={'material-icons'}
                                translate='no'
                                aria-hidden='true'
                                style={{ fontSize: '16px' }}
                              >
                                close
                              </span>
                            </Box>
                            <input
                              type='text'
                              value={editStatusTitle}
                              onChange={(e) => setEditStatusTitle(e.target.value)}
                              onKeyDown={handleEditKeyDown}
                              onCompositionStart={() => setIsComposing(true)}
                              onCompositionEnd={() => setIsComposing(false)}
                              className={styles.editStatusInput}
                            />
                            <Button
                              onClick={handleSaveEdit}
                              className={styles.statusSaveButton}
                              disabled={!editStatusTitle.trim() || isComposing}
                            >
                              保存
                            </Button>
                          </Box>
                        ) : (
                          // 通常モード
                          <>
                            <Flex align='center' gap='1' pl='16px'>
                              <StatusText
                                text={l.title}
                                color={l.color}
                                borderColor={l.borderColor}
                              />
                            </Flex>
                            <Box style={{ position: 'relative' }}>
                              {!canUpdateStatus(l) ? (
                                <Tooltip.Root delayDuration={200}>
                                  <Tooltip.Trigger asChild>
                                    <button
                                      className={'material-icons'}
                                      translate='no'
                                      type='button'
                                      disabled
                                      style={{
                                        cursor: 'not-allowed',
                                        opacity: 0.5,
                                        background: 'none',
                                        border: 'none',
                                        padding: 0,
                                      }}
                                      aria-label='メニューを開く（無効）'
                                    >
                                      more_horiz
                                    </button>
                                  </Tooltip.Trigger>
                                  <Tooltip.Portal>
                                    <Tooltip.Content
                                      side='top'
                                      align='center'
                                      sideOffset={4}
                                      className={styles.tooltip}
                                    >
                                      このステータスは変更することができません
                                    </Tooltip.Content>
                                  </Tooltip.Portal>
                                </Tooltip.Root>
                              ) : (
                                <button
                                  className={'material-icons'}
                                  translate='no'
                                  type='button'
                                  style={{
                                    cursor:
                                      isAddingStatus || editingStatusId ? 'not-allowed' : 'pointer',
                                    opacity: isAddingStatus || editingStatusId ? 0.5 : 1,
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                  }}
                                  onClick={(e) => handleStatusMenuClick(e, l.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      handleStatusMenuClick(e as any, l.id);
                                    }
                                  }}
                                  disabled={isAddingStatus || Boolean(editingStatusId)}
                                  aria-label='メニューを開く'
                                >
                                  more_horiz
                                </button>
                              )}
                              {statusMenuOpen === l.id && canUpdateStatus(l) && (
                                <Box
                                  style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    backgroundColor: 'var(--color-white)',
                                    border: '1px solid var(--border-color-separater)',
                                    borderRadius: '4px',
                                    boxShadow: '0 2px 8px var(--shadow-color-light)',
                                    zIndex: 1000,
                                    minWidth: '120px',
                                  }}
                                >
                                  <Box
                                    onClick={() =>
                                      canUpdateStatus(l) && handleEditClick(l.id, l.title)
                                    }
                                    style={getEditButtonStyle(l)}
                                    onMouseEnter={(e) => {
                                      if (canUpdateStatus(l)) {
                                        e.currentTarget.style.backgroundColor =
                                          'var(--overlay-color-light)';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'var(--color-white)';
                                    }}
                                  >
                                    編集
                                  </Box>
                                  <Box
                                    onClick={() => canUpdateStatus(l) && handleDeleteClick(l.id)}
                                    style={getDeleteButtonStyle(l)}
                                    onMouseEnter={(e) => {
                                      if (canUpdateStatus(l)) {
                                        e.currentTarget.style.backgroundColor =
                                          'var(--overlay-color-light)';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'var(--color-white)';
                                    }}
                                  >
                                    削除する
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          </>
                        )}
                      </Flex>
                    ))}
                  {isAddingStatus && (
                    <Flex
                      justify='between'
                      align='center'
                      py='8px'
                      pl='8px'
                      pr='24px'
                      style={{ position: 'relative' }}
                    >
                      <Box className={styles.editStatusBox}>
                        <Box className={styles.editStatusCloseButton} onClick={handleCancelAdd}>
                          <span
                            className={'material-icons'}
                            translate='no'
                            aria-hidden='true'
                            style={{ fontSize: '16px' }}
                          >
                            close
                          </span>
                        </Box>
                        <input
                          type='text'
                          value={newStatusTitle}
                          onChange={(e) => handleInputChange(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onCompositionStart={() => setIsComposing(true)}
                          onCompositionEnd={() => setIsComposing(false)}
                          placeholder='ステータス名'
                          className={styles.editStatusInput}
                        />
                        <Button
                          className={styles.statusSaveButton}
                          onClick={handleSaveStatus}
                          disabled={!newStatusTitle.trim() || isComposing}
                        >
                          保存
                        </Button>
                      </Box>
                    </Flex>
                  )}
                </Box>
              </Flex>
              <Popover.Arrow className={styles.popoverArrow} />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        {isOpenErrorDialog && (
          <DeleteErrorDialog
            isOpen={isOpenErrorDialog}
            onClose={() => setIsOpenErrorDialog(false)}
          />
        )}
      </>
    )
  );
}
