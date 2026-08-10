'use client';
import { Box, Button, Flex, Grid, Text } from '@radix-ui/themes';
import { useEffect, useRef, useState } from 'react';
import { AppCheckbox } from '@/components/checkbox/AppCheckbox';
import { getPrefectureNames, prefecturesWithRegionList } from '@/utils/regionUtils';
import styles from './styles.module.css';

type Props = {
  selectedPrefectureIds: number[];
  onSelect: (selectedIds: number[]) => void;
};

export const PrefectureSelect = ({ selectedPrefectureIds, onSelect }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // クリックアウトサイドで閉じる
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 追加・削除用のヘルパー
  const addPrefecture = (ids: string[]) => {
    const newIds = Array.from(new Set([...selectedPrefectureIds, ...ids.map(Number)]));
    onSelect(newIds);
  };
  const removePrefecture = (ids: string[]) => {
    const newIds = selectedPrefectureIds.filter((id) => !ids.map(Number).includes(id));
    onSelect(newIds);
  };

  const handleUnselectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect([]);
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onSelect) {
      onSelect(selectedPrefectureIds);
    }
  };

  return (
    <Box>
      <Button
        type='button'
        variant='outline'
        className={styles.roundSelectTriggerButton}
        onClick={handleTriggerClick}
      >
        <Text className={styles.roundSelectTriggerText}>
          {selectedPrefectureIds.length > 0
            ? getPrefectureNames(selectedPrefectureIds).join(', ')
            : '-'}
        </Text>
        <span className={`material-icons ${styles.sideMenuIconHelp}`}>filter_alt</span>
      </Button>
      {isOpen && (
        <Box className={styles.dropdownContent} ref={dropdownRef}>
          <div className={styles.dropdownHeader}>
            <Button
              type='button'
              variant='ghost'
              size='1'
              onClick={handleUnselectAll}
              className={styles.selectAllButton}
              disabled={selectedPrefectureIds.length === 0}
            >
              全て解除
            </Button>
          </div>
          <Flex direction='row' className={styles.listBox}>
            <Flex direction='column' className={styles.regionListBox}>
              {prefecturesWithRegionList.map((region) => {
                const allChecked = region.prefectures.every((prefecture) =>
                  selectedPrefectureIds.includes(Number(prefecture.id))
                );
                return (
                  <Box
                    key={region.name}
                    className={`${selectedRegion === region.name ? styles.selectedRegion : styles.unselectedRegion} ${allChecked ? styles.allChecked : ''}`}
                    onClick={() => {
                      setSelectedRegion(region.name);
                    }}
                  >
                    <AppCheckbox
                      checked={allChecked}
                      onChange={(checked) => {
                        const prefectureIds = region.prefectures.map((prefecture) => prefecture.id);
                        if (checked) {
                          addPrefecture(prefectureIds);
                        } else {
                          removePrefecture(prefectureIds);
                        }
                        setSelectedRegion(region.name);
                      }}
                      label={region.name}
                      preventLabelToggle
                      checkboxClassName={styles.checkbox}
                      checkBoxCheckedClassName={styles.checkedCheckBox}
                      labelClassName={styles.regionText}
                      checkedTextClassName={styles.checkedRegionText}
                      rightComponent={
                        <span className='material-icons-outlined' translate='no' aria-hidden='true'>
                          chevron_right
                        </span>
                      }
                      parentBoxClassName={`${styles.parentBox} ${selectedRegion === region.name && styles.selectedParentBox}`}
                      parentBoxCheckedClassName={styles.checkedParentBox}
                    />
                  </Box>
                );
              })}
            </Flex>
            <Flex direction='column' gap='2' style={{ flex: 2, padding: '0 8px' }}>
              {(() => {
                const region = prefecturesWithRegionList.find((r) => r.name === selectedRegion);
                if (!region) return null;
                return (
                  <Grid columns='2' gapX='1' key={region.name}>
                    {region.prefectures.map((prefecture) => {
                      const checked = selectedPrefectureIds.includes(Number(prefecture.id));
                      return (
                        <Box
                          key={prefecture.id}
                          className={`${styles.prefectureListBoxItem} ${checked ? styles.checked : ''}`}
                        >
                          <AppCheckbox
                            checked={checked}
                            onChange={(checked) => {
                              if (checked) {
                                addPrefecture([prefecture.id]);
                              } else {
                                removePrefecture([prefecture.id]);
                              }
                            }}
                            label={prefecture.name}
                            checkedTextClassName={styles.checkedRegionText}
                            checkboxClassName={styles.checkbox}
                            checkBoxCheckedClassName={styles.checkedCheckBox}
                            labelClassName={styles.prefectureText}
                            parentBoxCheckedClassName={styles.checkedParentBox}
                          />
                        </Box>
                      );
                    })}
                  </Grid>
                );
              })()}
            </Flex>
          </Flex>
          <div className={styles.dropdownFooter}>
            <Button
              type='button'
              variant='solid'
              size='1'
              onClick={handleClose}
              className={styles.closeButton}
            >
              完了
            </Button>
          </div>
        </Box>
      )}
    </Box>
  );
};
