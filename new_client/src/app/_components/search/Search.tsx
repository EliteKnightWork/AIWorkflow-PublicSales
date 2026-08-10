'use client';
import { Box, Flex, Grid, Text } from '@radix-ui/themes';
import { prefecturesWithRegionList } from '@/utils/regionUtils';
import SearchItemCard from './SearchItemCard';
import styles from './styles.module.css';

const ChipCard = ({ title, onClick }: { title: string; onClick: () => void }) => {
  return (
    <Box className={styles.chipBox} onClick={onClick}>
      {title}
    </Box>
  );
};

const Search = () => {
  return (
    <Box className={styles.searchContainer}>
      <Flex direction='column' gap='4' className={styles.contentFlex}>
        <SearchItemCard
          title='入札案件を探す'
          content={
            <Grid columns='2' gap='3' width='auto'>
              {prefecturesWithRegionList.map((region) => {
                return (
                  <Flex
                    key={region.name}
                    direction={'column'}
                    justify={'start'}
                    align={'start'}
                    gap='4'
                  >
                    <Text className={styles.areaTitle}>{region.name}</Text>
                    <Flex direction={'row'} gap={'2'} className={styles.chipList}>
                      {region.prefectures.map((p) => {
                        return (
                          <ChipCard
                            title={p.name}
                            onClick={() => {
                              window.open(`/projects?prefectures=${p.id}`, '_blank');
                            }}
                            key={p.id}
                          />
                        );
                      })}
                    </Flex>
                  </Flex>
                );
              })}
            </Grid>
          }
        />
        <SearchItemCard
          title='落札案件を探す'
          content={
            <Grid columns='2' gap='3' width='auto'>
              {prefecturesWithRegionList.map((region) => {
                return (
                  <Flex
                    key={region.name}
                    direction={'column'}
                    justify={'start'}
                    align={'start'}
                    gap='4'
                  >
                    <Text className={styles.areaTitle}>{region.name}</Text>
                    <Flex direction={'row'} gap={'2'} className={styles.chipList}>
                      {region.prefectures.map((p) => {
                        return (
                          <ChipCard
                            title={p.name}
                            key={p.id}
                            onClick={() => {
                              window.open(`/projects?tab=bid&prefectures=${p.id}`, '_blank');
                            }}
                          />
                        );
                      })}
                    </Flex>
                  </Flex>
                );
              })}
            </Grid>
          }
        />
      </Flex>
    </Box>
  );
};

export default Search;
