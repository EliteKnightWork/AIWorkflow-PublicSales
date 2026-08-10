import { Box, Flex, Spinner } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { useGetFunctionalLimitations } from '@/api/generated/endpoints/companies';
import type { SearchFilterPreset } from '@/api/generated/models';
import AppInput from '@/components/appInput/AppInput';
import { useSearchFilterPreset } from '@/context/SearchFilterPresetContext';
import { getPrefectureNames } from '@/utils/regionUtils';
import { SearchFilterPresetCard } from '../searchFilterPresetCard/SearchFilterPresetCard';
import { SearchFilterPresetSimpleCard } from '../searchFilterPresetSimpleCard';
import styles from './styles.module.css';

type Props = {
  onSelectPreset?: (preset: SearchFilterPreset) => void;
  isSimpleMode?: boolean;
};

export const SearchFilterPresetList = ({ onSelectPreset, isSimpleMode = false }: Props) => {
  const {
    presets,
    isLoading,
    refreshPresets: refetchSearchFilterPresets,
  } = useSearchFilterPreset();

  const { data: functionalLimitations, refetch: refetchFunctionalLimitations } =
    useGetFunctionalLimitations();

  const [searchWord, setSearchWord] = useState('');

  const [filteredPresets, setFilteredPresets] = useState<SearchFilterPreset[]>([]);

  useEffect(() => {
    refetchSearchFilterPresets();
    refetchFunctionalLimitations();
  }, [refetchSearchFilterPresets, refetchFunctionalLimitations]);

  useEffect(() => {
    if (presets) {
      setFilteredPresets(_sortPresets(presets));
    }
  }, [presets]);

  const filterPresets = (filterText: string) => {
    const newFilteredPresets =
      presets.filter((preset) => {
        // タイトルでの検索
        if (preset.title?.toLowerCase().includes(filterText.toLowerCase())) {
          return true;
        }

        // フィルター条件での検索
        const filterValues = Object.values(preset.filter || {}).flat();

        filterValues.push(...getPrefectureNames(preset.filter?.prefectures || []));

        // 類義語検索の有無も検索対象に含める
        if (preset.filter?.useSynonymSearch !== undefined) {
          filterValues.push(preset.filter.useSynonymSearch ? '類義語検索あり' : '類義語検索なし');
        }

        return filterValues.some((value) =>
          String(value).toLowerCase().includes(filterText.toLowerCase())
        );
      }) || [];

    setFilteredPresets(_sortPresets(newFilteredPresets));
  };

  const _sortPresets = (presets: SearchFilterPreset[]) => {
    return presets.sort((a, b) => {
      if (a.notificationRequired !== b.notificationRequired) {
        return (b.notificationRequired ?? false) === true ? 1 : -1;
      }
      return (b.id ?? 0) - (a.id ?? 0);
    });
  };

  return (
    <>
      <Box className={styles.searchInputBox}>
        <AppInput
          placeholder='フリーワード検索'
          value={searchWord}
          onChange={(value) => {
            setSearchWord(value);
            filterPresets(value);
          }}
        />
      </Box>
      {isLoading ? (
        <Flex justify={'center'} align={'center'} width={'100%'}>
          <Spinner size={'3'} />
        </Flex>
      ) : (
        <Flex className={styles.presetListBox}>
          {filteredPresets.length > 0 &&
            filteredPresets.map((preset) => (
              <Box
                key={preset.id}
                className={
                  onSelectPreset
                    ? `${styles.presetCardBox} ${styles.selectable}`
                    : styles.presetCardBox
                }
                onClick={
                  onSelectPreset
                    ? (e) => {
                        e.stopPropagation();
                        onSelectPreset(preset);
                      }
                    : undefined
                }
                style={onSelectPreset ? { cursor: 'pointer' } : {}}
              >
                {isSimpleMode ? (
                  <SearchFilterPresetSimpleCard preset={preset} />
                ) : (
                  <SearchFilterPresetCard
                    preset={preset}
                    functionalLimitations={functionalLimitations || {}}
                    onChangeNotificationSetting={() => {
                      refetchFunctionalLimitations();
                    }}
                    onChangeReccomendSetting={() => {
                      refetchFunctionalLimitations();
                    }}
                    onEdit={() => {
                      refetchSearchFilterPresets();
                    }}
                    onDelete={() => {
                      refetchSearchFilterPresets();
                    }}
                  />
                )}
              </Box>
            ))}
        </Flex>
      )}
    </>
  );
};
