'use client';
import { Box, Button, Flex, IconButton, Text } from '@radix-ui/themes';
import { useEffect, useRef, useState } from 'react';
import type { Project, SearchFilterPreset } from '@/api/generated/models';
import { FilterPresetSelect } from '@/app/(content)/_components/filterPresetSelect/FilterPresetSelect';
import { ProjectSummaryCard } from '@/app/(content)/_components/projectSummaryCard/ProjectSummaryCard';
import { downloadCSV } from '@/lib/csv/downloadCSV';
import { convertProjectToCSV } from '@/lib/csv/project/convertProjectToCSV';
import pageStyles from '../../styles.module.css';
import styles from './styles.module.css';

type Props = {
  isExpand: boolean;
  loading: boolean;
  setIsExpand: (isExpand: boolean) => void;
  filteredProjects: Project[];
  presets: SearchFilterPreset[];
  selecterPreset: SearchFilterPreset | undefined;
  onSelectedPreset: (preset: SearchFilterPreset | undefined) => void;
};

export default function FilteredProjectListPresentational({
  isExpand,
  loading,
  setIsExpand,
  filteredProjects,
  presets,
  selecterPreset,
  onSelectedPreset,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateScrollState();
    container.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);

    return () => {
      container.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [filteredProjects, isExpand]);

  const updateScrollState = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      Math.ceil(container.scrollLeft) < container.scrollWidth - container.clientWidth
    );
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    const scrollAmount = 500;
    containerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
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
    const csv = convertProjectToCSV(filteredProjects);
    downloadCSV(csv, `新着案件_${timestamp}.csv`);
  };

  return (
    <Flex direction={'column'} gap={'4'} className={pageStyles.mypageContentBoard}>
      <Flex
        justify={'between'}
        align={'center'}
        gap={'4'}
        className={pageStyles.mypageContentHeader}
        onClick={() => setIsExpand(!isExpand)}
      >
        <Text className={pageStyles.mypageContentBoxTitle}>新着案件</Text>

        <Flex direction={'row'} gap={'4'} align={'center'}>
          <FilterPresetSelect
            currentPreset={selecterPreset}
            presets={presets}
            onSelect={(preset) => onSelectedPreset(preset)}
            disabled={loading}
          />
          <Button
            variant='outline'
            onClick={createCsv}
            className={styles.downloadButton}
            disabled={filteredProjects.length === 0}
          >
            CSV出力
            <span className={'material-icons'}>download</span>
          </Button>
          <Flex gap={'4'} align={'center'}>
            <span className={`material-icons ${pageStyles.mypageExpandIcon}`}>
              {isExpand ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
            </span>
          </Flex>
        </Flex>
      </Flex>
      {isExpand && (
        <Flex
          direction={'row'}
          gap={'4'}
          overflow={'auto'}
          className={pageStyles.expandableContent}
        >
          {loading ? (
            <Box className={pageStyles.messageBox}>
              <Text className={pageStyles.messageText}>今案件を探しています・・・🔍</Text>
            </Box>
          ) : selecterPreset ? (
            filteredProjects.length > 0 ? (
              <>
                {canScrollLeft && (
                  <IconButton
                    radius='full'
                    variant='soft'
                    className={pageStyles.leftScrollButton}
                    onClick={() => scroll('left')}
                  >
                    <span className={`material-icons ${pageStyles.leftScrollIcon}`}>
                      chevron_left
                    </span>
                  </IconButton>
                )}
                {canScrollRight && (
                  <IconButton
                    radius='full'
                    variant='soft'
                    className={pageStyles.rightScrollButton}
                    onClick={() => scroll('right')}
                  >
                    <span className={`material-icons ${pageStyles.rightScrollIcon}`}>
                      chevron_right
                    </span>
                  </IconButton>
                )}
                <div ref={containerRef} className={pageStyles.scrollContainer}>
                  {filteredProjects.map((project) => (
                    <Box key={project.uuid} className={pageStyles.projectCardBox}>
                      <ProjectSummaryCard project={project} source='new' />
                    </Box>
                  ))}
                </div>
              </>
            ) : (
              <Box className={`${pageStyles.messageBox} ${styles.messageBox}`}>
                <Flex
                  justify={'center'}
                  align={'center'}
                  width={'100%'}
                  className={styles.notFoundFlex}
                >
                  <Text className={pageStyles.messageText}>
                    すみません...案件がみつかりませんでした😞
                    <br />
                    条件を変更してみませんか？思わぬ発見があるかもしれません！
                  </Text>
                </Flex>
              </Box>
            )
          ) : (
            <Box className={pageStyles.messageBox}>
              <Text className={pageStyles.messageText}>表示する保存条件を選択してください</Text>
            </Box>
          )}
        </Flex>
      )}
    </Flex>
  );
}
