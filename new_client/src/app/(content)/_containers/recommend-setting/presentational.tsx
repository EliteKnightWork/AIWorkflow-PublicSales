'use client';
import { Box, Flex, Text } from '@radix-ui/themes';
import type { SearchFilterPreset } from '@/api/generated/models';
import AppOverlayModal from '@/components/appOverlayModal/AppOverlayModal';
import { RoundButton } from '@/components/roundButton/RoundeButton';
import { SearchFilterPresetList } from '../../mypage/_components/searchFilterPresetList/searchFilterPresetList';
import styles from './styles.module.css';

type Props = {
  searchFilterPresets: SearchFilterPreset[];
  isModalOpen: boolean;
  onModalOpen: () => void;
  onModalClose: () => void;
};

export default function RecommendSettingPresentational({
  searchFilterPresets,
  isModalOpen,
  onModalOpen,
  onModalClose,
}: Props) {
  return (
    <Flex direction='column' gap='4' className={styles.recommendSettingArea}>
      <AppOverlayModal
        title={'保存条件'}
        contentComponent={<SearchFilterPresetList />}
        isOpen={isModalOpen}
        onClose={() => {
          onModalClose();
        }}
      />
      <Flex
        direction='row'
        justify='between'
        align='center'
        className={styles.recommendSettingHeader}
      >
        <Text className={styles.recommendSettingTitle}>おすすめする条件</Text>
        <RoundButton
          icon='autorenew'
          buttonClassName={styles.notificationFilterButton}
          text='条件を変更する'
          onClick={(e) => {
            e.stopPropagation();
            onModalOpen();
          }}
        />
      </Flex>

      <Box className={styles.recommendSettingList}>
        {searchFilterPresets.map((preset) => {
          return (
            <Box key={preset.id} className={styles.recommendSettingListRow}>
              <Text truncate as={'div'}>
                {preset.title}
              </Text>
            </Box>
          );
        })}
      </Box>
    </Flex>
  );
}
