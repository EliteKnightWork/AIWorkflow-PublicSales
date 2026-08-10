import { Box, Flex, Text } from '@radix-ui/themes';
import type { SearchFilterPreset } from '@/api/generated/models';
import styles from './styles.module.css';

type Props = {
  presets: SearchFilterPreset[];
};

export const FilterPresetsTitleList = ({ presets }: Props) => {
  return (
    <Flex direction={'column'} className={styles.filterPresetTitleListBox}>
      {presets.map((preset) => (
        <Box className={styles.filterPresetTitleListRow} key={preset.id}>
          <Text>{preset.title}</Text>
        </Box>
      ))}
    </Flex>
  );
};
