'use client';

import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { useEffect, useRef } from 'react';
import styles from './OverwriteConditionConfirmDialog.module.css';
import type { FilterDifference } from './utils';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onOverwrite: () => void;
  onSaveAsNew: () => void;
  presetTitle: string;
  filterDifference: FilterDifference;
};

export default function OverwriteConditionConfirmDialog({
  isOpen,
  onClose,
  onOverwrite,
  onSaveAsNew,
  presetTitle,
  filterDifference,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Box className={styles.dialogOverlay}>
      <Box ref={dialogRef} className={styles.dialog}>
        <div className={styles.dialogHeader}>
          <Text className={styles.dialogTitle}>保存条件を上書きしますか？</Text>
          <button
            type='button'
            className={styles.closeButton}
            onClick={onClose}
            aria-label='閉じる'
          >
            <span className='material-icons'>close</span>
          </button>
        </div>
        <Box className={styles.dialogContent}>
          <Text className={styles.presetTitle}>保存条件のタイトル:「{presetTitle}」</Text>

          {filterDifference.added.length === 0 && filterDifference.removed.length === 0 ? (
            <Box className={styles.noDifferenceSection}>
              <Text>保存条件の内容に変更がないようです🤔</Text>
              <Text>内容を変更すると上書き保存ができます</Text>
            </Box>
          ) : (
            <Flex direction='column' className={styles.conditionInfo}>
              <Flex className={styles.removeConditions}>
                <span className={`material-icons ${styles.errorIcon}`}>remove_circle</span>
                <Flex direction='column'>
                  <Text className={styles.title}>削除した条件</Text>
                  <Flex className={styles.conditionChipList}>
                    {filterDifference.removed.length === 0 && (
                      <Text>削除される条件がありません</Text>
                    )}
                    {filterDifference.removed.map((condition) => (
                      <Box key={condition} className={styles.conditionChip}>
                        {condition}
                      </Box>
                    ))}
                  </Flex>
                </Flex>
              </Flex>
              <Flex className={styles.addConditions}>
                <span className={`material-icons ${styles.errorIcon}`}>add_circle</span>
                <Flex direction='column'>
                  <Text className={styles.title}>追加した条件</Text>
                  <Flex className={styles.conditionChipList}>
                    {filterDifference.added.length === 0 && <Text>追加される条件がありません</Text>}
                    {filterDifference.added.map((condition) => (
                      <Box key={condition} className={styles.conditionChip}>
                        {condition}
                      </Box>
                    ))}
                  </Flex>
                </Flex>
              </Flex>
            </Flex>
          )}

          <Flex gap='3' justify='center' className={styles.buttonContainer}>
            <Button size='3' className={styles.saveNewButton} onClick={onSaveAsNew}>
              新規で保存条件に追加する
            </Button>
            <Button
              size='3'
              className={styles.overwriteButton}
              onClick={onOverwrite}
              disabled={
                filterDifference.added.length === 0 && filterDifference.removed.length === 0
              }
            >
              上書き保存する
            </Button>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}
