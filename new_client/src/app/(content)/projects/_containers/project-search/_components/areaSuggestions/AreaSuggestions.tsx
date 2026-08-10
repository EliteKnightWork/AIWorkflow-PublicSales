import { Box, Flex, Grid, Text } from '@radix-ui/themes';
import { useState } from 'react';
import { AppCheckbox } from '@/components/checkbox/AppCheckbox';
import { prefecturesWithRegionList } from '@/utils/regionUtils';
import styles from './styles.module.css';

type Props = {
  addPrefecture: (prefectureIds: string[]) => void;
  removePrefecture: (prefectureIds: string[]) => void;
  selectedPrefectures: string[];
};
export const AreaSuggestions = ({
  addPrefecture,
  removePrefecture,
  selectedPrefectures,
}: Props) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  return (
    <Box>
      <Box className={styles.titleBox}>
        <Text className={styles.title}>都道府県</Text>
      </Box>

      <Flex direction='row' gap='1' className={styles.listBox}>
        <Flex direction='column' className={styles.regionListBox}>
          {prefecturesWithRegionList.map((region) => (
            <Box
              key={region.name}
              className={`${styles.regionListBoxItem} ${selectedRegion === region.name ? styles.selectedRegion : styles.unselectedRegion}`}
              onClick={() => {
                setSelectedRegion(region.name);
              }}
            >
              <AppCheckbox
                checked={region.prefectures.every((prefecture) =>
                  selectedPrefectures.includes(prefecture.id)
                )}
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
                labelClassName={styles.regionText}
                rightComponent={
                  <span className='material-icons-outlined' translate='no' aria-hidden='true'>
                    chevron_right
                  </span>
                }
                parentBoxClassName={`${styles.parentBox} ${selectedRegion === region.name && styles.selectedParentBox}`}
              />
            </Box>
          ))}
        </Flex>
        <Flex direction='column' gap='2' style={{ flex: 2 }}>
          {(() => {
            const region = prefecturesWithRegionList.find((r) => r.name === selectedRegion);
            if (!region) return null;

            return (
              <Grid columns='2' gapX='1' key={region.name}>
                {region.prefectures.map((prefecture) => (
                  <Box key={prefecture.id} className={styles.prefectureListBoxItem}>
                    <AppCheckbox
                      checked={selectedPrefectures.includes(prefecture.id)}
                      onChange={(checked) => {
                        if (checked) {
                          addPrefecture([prefecture.id]);
                        } else {
                          removePrefecture([prefecture.id]);
                        }
                      }}
                      label={prefecture.name}
                      checkboxClassName={styles.checkbox}
                      labelClassName={styles.prefectureText}
                    />
                  </Box>
                ))}
              </Grid>
            );
          })()}
        </Flex>
      </Flex>
    </Box>
  );
};
