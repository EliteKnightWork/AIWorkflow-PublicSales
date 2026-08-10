'use client';
import { Box, Button, Flex, IconButton, Text } from '@radix-ui/themes';
import { useEffect, useRef, useState } from 'react';
import type { Project, SearchFilterPreset } from '@/api/generated/models';
import { FilterPresetSelect } from '@/app/(content)/_components/filterPresetSelect/FilterPresetSelect';
import { ProjectSummaryCard } from '@/app/(content)/_components/projectSummaryCard/ProjectSummaryCard';
import { PresetEditForm } from '@/app/(content)/_containers/preset-edit';
import { SearchFilterPresetList } from '@/app/(content)/mypage/_components/searchFilterPresetList/searchFilterPresetList';
import AppOverlayModal from '@/components/appOverlayModal/AppOverlayModal';
import { RoundButton } from '@/components/roundButton/RoundeButton';
import { downloadCSV } from '@/lib/csv/downloadCSV';
import { convertProjectToCSV } from '@/lib/csv/project/convertProjectToCSV';
import styles from './styles.module.css';

type Props = {
  isExpand: boolean;
  setIsExpand: (isExpand: boolean) => void;
  presets: SearchFilterPreset[];
  selectedPreset: SearchFilterPreset | undefined;
  onSelectedPreset: (preset: SearchFilterPreset | undefined) => void;
  recommendedProjects: Project[];
  loading: boolean;
};

export default function MypageRecommendListPresentational({
  isExpand,
  setIsExpand,
  presets,
  selectedPreset,
  onSelectedPreset,
  recommendedProjects,
  loading,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPresetListModalOpen, setIsPresetListModalOpen] = useState(false);
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
  }, [recommendedProjects, isExpand]);

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
    const csv = convertProjectToCSV(recommendedProjects);
    downloadCSV(csv, `イチオシ案件_${timestamp}.csv`);
  };

  return (
    <Flex direction={'column'} gap={'4'} className={styles.mypageContentBoard}>
      <AppOverlayModal
        modalHeight={'90%'}
        title={selectedPreset?.title ?? ''}
        contentComponent={
          <PresetEditForm
            onCancel={() => {
              setIsModalOpen(false);
            }}
            onSaved={(savedPreset) => {
              setIsModalOpen(false);
              onSelectedPreset(savedPreset);
            }}
            preset={selectedPreset ?? {}}
          />
        }
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
      />
      {presets.length === 0 && (
        <AppOverlayModal
          title={'保存条件'}
          contentComponent={<SearchFilterPresetList />}
          isOpen={isPresetListModalOpen}
          onClose={() => {
            setIsPresetListModalOpen(false);
          }}
        />
      )}
      <Flex
        justify={'between'}
        align={'center'}
        gap={'4'}
        className={styles.mypageContentHeader}
        onClick={() => setIsExpand(!isExpand)}
      >
        <Text className={styles.mypageContentBoxTitle}>イチオシ案件</Text>
        <Flex direction={'row'} gap={'4'} align={'center'}>
          <FilterPresetSelect
            presets={presets}
            currentPreset={selectedPreset}
            onSelect={(preset) => onSelectedPreset(preset)}
            disabled={loading}
          />
          <Button
            variant='outline'
            onClick={createCsv}
            className={styles.downloadButton}
            disabled={recommendedProjects.length === 0}
          >
            CSV出力
            <span className={'material-icons'} translate='no' aria-hidden='true'>
              download
            </span>
          </Button>
          <Flex gap={'4'} align={'center'}>
            <span
              className={`material-icons ${styles.mypageExpandIcon}`}
              translate='no'
              aria-hidden='true'
            >
              {isExpand ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
            </span>
          </Flex>
        </Flex>
      </Flex>
      {isExpand && (
        <Flex direction={'row'} gap={'4'} overflow={'auto'} className={styles.expandableContent}>
          {loading ? (
            <Box className={styles.messageBox}>
              <Text className={styles.messageText}>今案件を探しています・・・🔍</Text>
            </Box>
          ) : presets.length === 0 ? (
            <Box className={styles.messageBox}>
              <Flex
                direction={'column'}
                justify={'center'}
                align={'center'}
                width={'100%'}
                gap={'7'}
                className={styles.noItemFlex}
              >
                <Text className={styles.messageText}>
                  [事業内容]と[ORワード]を入力しましょう！
                  <br />
                  あなたにピッタリな案件をおすすめします💡
                </Text>
                <RoundButton
                  hideIcon
                  text='事業内容を編集する'
                  buttonClassName={styles.messageButton}
                  buttonBoxClassName={styles.messageButtonBox}
                  onClick={() => {
                    setIsPresetListModalOpen(true);
                  }}
                />
              </Flex>
            </Box>
          ) : !selectedPreset ? (
            <Box className={styles.messageBox}>
              <Text className={styles.messageText}>
                表示するイチオシ案件の条件を選択してください
              </Text>
            </Box>
          ) : recommendedProjects.length === 0 ? (
            <Box className={styles.messageBox}>
              <Flex
                direction={'column'}
                justify={'center'}
                align={'center'}
                width={'100%'}
                gap={'7'}
                className={styles.noItemFlex}
              >
                <Text className={styles.messageText}>
                  すみません...案件がみつかりませんでした😞
                  <br />
                  条件を変更してみませんか？思わぬ発見があるかもしれません！
                </Text>
                <RoundButton
                  hideIcon
                  text='案件を探す'
                  buttonClassName={styles.messageButton}
                  buttonBoxClassName={styles.messageButtonBox}
                  onClick={() => {
                    setIsModalOpen(true);
                  }}
                />
              </Flex>
            </Box>
          ) : (
            <>
              {canScrollLeft && (
                <IconButton
                  radius='full'
                  variant='soft'
                  className={styles.leftScrollButton}
                  onClick={() => scroll('left')}
                >
                  <span
                    className={`material-icons ${styles.leftScrollIcon}`}
                    translate='no'
                    aria-hidden='true'
                  >
                    chevron_left
                  </span>
                </IconButton>
              )}
              {canScrollRight && (
                <IconButton
                  radius='full'
                  variant='soft'
                  className={styles.rightScrollButton}
                  onClick={() => scroll('right')}
                >
                  <span
                    className={`material-icons ${styles.rightScrollIcon}`}
                    translate='no'
                    aria-hidden='true'
                  >
                    chevron_right
                  </span>
                </IconButton>
              )}
              <div ref={containerRef} className={styles.scrollContainer}>
                {recommendedProjects.map((project) => (
                  <Box key={project.uuid} className={styles.projectCardBox}>
                    <ProjectSummaryCard project={project} source='recommendation' />
                  </Box>
                ))}
              </div>
            </>
          )}
        </Flex>
      )}
    </Flex>
  );
}
