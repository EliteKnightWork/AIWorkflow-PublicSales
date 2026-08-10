import { Box } from '@radix-ui/themes';
import type { SearchFilterPreset } from '@/api/generated/models';
import { PresetInfoCard } from '@/app/(content)/_components/presetInfoCard/PresetInfoCard';
import styles from './styles.module.css';

type Props = {
  preset: SearchFilterPreset;
};

export const SearchFilterPresetSimpleCard = ({ preset }: Props) => {
  return (
    <Box className={styles.presetCard}>
      <PresetInfoCard targetPreset={preset} />
    </Box>
  );
};
