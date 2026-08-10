'use client';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import type { SearchFilterPreset } from '@/api/generated/models';
import { ExperienceRequiredSelect } from '@/app/_components/search_filter_preset/ExperienceRequiredSelect';
import { OfficeRequiredSelect } from '@/app/_components/search_filter_preset/OfficeRequiredSelect';
import { SecurityQualificationsSelect } from '@/app/_components/search_filter_preset/SecurityQualificationsSelect';
import styles from './styles.module.css';

type Props = {
  preset: SearchFilterPreset;
  onNext: (preset: SearchFilterPreset, addSubscription?: boolean) => void;
  onBack: () => void;
};

export const SearchPresetFormSecond = ({ preset, onNext, onBack }: Props) => {
  const [targetPreset, setTargetPreset] = useState<SearchFilterPreset>({} as SearchFilterPreset);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 配列 <-> 文字列　で変換が必要なものは別途state管理する
  const [keywords, setKeywords] = useState<string>('');
  const [notKeywords, setNotKeywords] = useState<string>('');

  useEffect(() => {
    if (preset) {
      setKeywords(preset?.filter?.keywords?.join(' ') ?? '');
      setNotKeywords(preset?.filter?.notKeywords?.join(' ') ?? '');
      setTargetPreset(preset);
    }
  }, [preset]);

  const validatePreset = () => {
    if (targetPreset?.filter?.plannedPriceFrom) {
      if (targetPreset.filter.plannedPriceFrom < 0) {
        setErrorMessage('予定価格の最低価格は0以上の数値を入力してください');
        return false;
      }
    }
    if (targetPreset?.filter?.plannedPriceFrom) {
      if (targetPreset.filter.plannedPriceFrom < 0) {
        setErrorMessage('予定価格の最高価格は0以上の数値を入力してください');
        return false;
      }
    }
    if (targetPreset?.filter?.plannedPriceFrom && targetPreset?.filter?.plannedPriceTo) {
      if (targetPreset.filter.plannedPriceFrom > targetPreset.filter.plannedPriceTo)
        setErrorMessage('予定価格の最高価格は最低価格以上の数値を入力してください');
      return false;
    }

    return true;
  };

  return (
    <Flex direction={'column'} className={styles.presetForm}>
      <Box className={styles.formBox}>
        <Text className={styles.formTitle}>ANDワード</Text>
        <input
          className={styles.input}
          type='text'
          placeholder='ANDワード(複数ある場合はスペース区切り)'
          value={keywords}
          onChange={(e) => {
            setKeywords(e.target.value);
          }}
        />
      </Box>
      <Box className={styles.formBox}>
        <Text className={styles.formTitle}>NOTワード</Text>
        <input
          className={styles.input}
          type='text'
          placeholder='NOTワード(複数ある場合はスペース区切り)'
          value={notKeywords}
          onChange={(e) => {
            setNotKeywords(e.target.value);
          }}
        />
      </Box>

      <Box className={styles.formBox}>
        <Text className={styles.formTitle}>予定価格</Text>
        <Flex direction={'row'} justify={'start'} align={'center'}>
          <input
            className={styles.input}
            type='number'
            placeholder='最低価格'
            value={targetPreset?.filter?.plannedPriceFrom?.toString() || ''}
            onChange={(e) =>
              setTargetPreset({
                ...targetPreset,
                filter: {
                  ...targetPreset?.filter,
                  plannedPriceFrom: Number(e.target.value),
                },
              })
            }
          />
          <Box style={{ marginInline: '16px' }}>〜</Box>
          <input
            className={styles.input}
            type='number'
            placeholder='最高価格'
            value={targetPreset?.filter?.plannedPriceTo?.toString() || ''}
            onChange={(e) => {
              setTargetPreset({
                ...targetPreset,
                filter: {
                  ...targetPreset?.filter,
                  plannedPriceTo: Number(e.target.value),
                },
              });
            }}
          />
        </Flex>
      </Box>

      <ExperienceRequiredSelect
        value={targetPreset?.filter?.isExperienceRequired}
        onChange={(value) => {
          setTargetPreset({
            ...targetPreset,
            filter: {
              ...targetPreset?.filter,
              isExperienceRequired: value,
            },
          });
        }}
      />

      <OfficeRequiredSelect
        value={targetPreset?.filter?.isOfficeRequired}
        onChange={(value) => {
          setTargetPreset({
            ...targetPreset,
            filter: {
              ...targetPreset?.filter,
              isOfficeRequired: value,
            },
          });
        }}
      />

      <SecurityQualificationsSelect
        value={targetPreset?.filter?.projectSecurityQualifications}
        onChange={(value) => {
          setTargetPreset({
            ...targetPreset,
            filter: {
              ...targetPreset?.filter,
              projectSecurityQualifications: value,
            },
          });
        }}
      />

      {errorMessage.length > 0 && <Box className={styles.errorMessageBox}>{errorMessage}</Box>}
      <Box className={styles.buttonBox}>
        <Button className={styles.backButton} onClick={onBack}>
          戻る
        </Button>
        <Button
          className={styles.nextButton}
          disabled={isLoading}
          onClick={async () => {
            setIsLoading(true);
            setErrorMessage('');
            try {
              if (validatePreset()) {
                const preset = {
                  ...targetPreset,
                  filter: {
                    ...targetPreset?.filter,
                    keywords: keywords.split(/\s+/).filter((word) => word.trim() !== ''),
                    notKeywords: notKeywords.split(/\s+/).filter((word) => word.trim() !== ''),
                  },
                };
                onNext(preset);
              }
            } finally {
              setIsLoading(false);
            }
          }}
        >
          次へ
        </Button>
      </Box>
    </Flex>
  );
};
