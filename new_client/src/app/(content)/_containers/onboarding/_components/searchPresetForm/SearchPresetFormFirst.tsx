'use client';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import type { SearchFilterPreset } from '@/api/generated/models';
import { AppCheckbox } from '@/components/checkbox/AppCheckbox';
import { convertDateToYYYYMMDD } from '@/utils/dateUtils';
import { AppDatePicker } from '../../../../_components/datePicker/AppDatePicker';
import { PrefectureSelect } from '../../../../_components/prefectureSelect/PrefectureSelect';
import styles from './styles.module.css';

type Props = {
  preset: SearchFilterPreset;
  onNext: (preset: SearchFilterPreset, addSubscription?: boolean) => void;
};

export const SearchPresetFormFirst = ({ preset, onNext }: Props) => {
  const [targetPreset, setTargetPreset] = useState<SearchFilterPreset>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addSubscription, setAddSubscription] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 配列 <-> 文字列　で変換が必要なものは別途state管理する
  const [orKeywords, setOrKeywords] = useState<string>('');

  useEffect(() => {
    if (preset) {
      setOrKeywords(preset?.filter?.orKeywords?.join(' ') ?? '');
      setTargetPreset(preset);
    }
  }, [preset]);

  const validatePreset = () => {
    if (!targetPreset?.title) {
      setErrorMessage('タイトルは必須です');
      return false;
    }
    if (!orKeywords) {
      setErrorMessage('検索ワードは必須です');
      return false;
    }

    return true;
  };

  const onChangeProcedureTypeGroup = (label: string, checked: boolean) => {
    const newProcedureTypeGroups = checked
      ? [...(targetPreset?.filter?.procedureTypeGroups || []), label]
      : targetPreset?.filter?.procedureTypeGroups?.filter((group) => group !== label);

    setTargetPreset({
      ...targetPreset,
      filter: {
        ...targetPreset?.filter,
        procedureTypeGroups:
          !newProcedureTypeGroups || newProcedureTypeGroups.length === 0
            ? undefined
            : newProcedureTypeGroups,
      },
    });
  };

  return (
    <Flex direction={'column'} className={styles.presetForm}>
      <Box className={styles.formBox}>
        <Flex direction='row' gap='4px'>
          <Text className={styles.formTitle}>保存条件のタイトル</Text>
          <Box className={styles.requiredLabel}>必須</Box>
        </Flex>
        <input
          className={styles.input}
          type='text'
          placeholder='SNSプロモーション'
          value={targetPreset?.title ?? ''}
          onChange={(e) => {
            setTargetPreset({
              ...targetPreset,
              title: e.target.value,
            });
          }}
        />
      </Box>
      <Box className={styles.formBox}>
        <Flex direction='row' gap='4px'>
          <Text className={styles.formTitle}>検索ワード</Text>
          <Box className={styles.requiredLabel}>必須</Box>
        </Flex>
        <input
          className={styles.input}
          type='text'
          placeholder='スペース ( ) で複数ワードの入力ができます'
          value={orKeywords}
          onChange={(e) => {
            setOrKeywords(e.target.value);
          }}
        />
      </Box>
      <Box className={styles.formBox}>
        <Text className={styles.formTitle}>都道府県</Text>
        <PrefectureSelect
          onSelect={(ids) => {
            setTargetPreset({
              ...targetPreset,
              filter: {
                ...(targetPreset?.filter ?? {}),
                prefectures: ids.length > 0 ? ids : undefined,
              },
            });
          }}
          selectedPrefectureIds={targetPreset?.filter?.prefectures ?? []}
        />
      </Box>
      <Box className={styles.formBox}>
        <Text className={styles.formTitle}>発注機関名</Text>
        <input
          className={styles.input}
          type='text'
          placeholder='発注機関'
          value={targetPreset?.filter?.organizations?.join(' ') ?? ''}
          onChange={(e) => {
            setTargetPreset({
              ...targetPreset,
              filter: {
                ...targetPreset?.filter,
                organizations:
                  e.target.value.length > 0
                    ? e.target.value.split(/\s+/).filter((word) => word.trim() !== '')
                    : undefined,
              },
            });
          }}
        />
      </Box>
      <Box className={styles.formBox}>
        <Text className={styles.formTitle}>入札方式</Text>

        <Flex direction={'row'} className={styles.procedureTypeGroupBox}>
          <AppCheckbox
            label={'一般競争入札'}
            checked={targetPreset?.filter?.procedureTypeGroups?.includes('一般競争入札') as boolean}
            onChange={(checked) => onChangeProcedureTypeGroup('一般競争入札', checked)}
          />
          <AppCheckbox
            label={'指名競争入札'}
            checked={targetPreset?.filter?.procedureTypeGroups?.includes('指名競争入札') as boolean}
            onChange={(checked) => onChangeProcedureTypeGroup('指名競争入札', checked)}
          />
          <AppCheckbox
            label={'企画競争入札'}
            checked={targetPreset?.filter?.procedureTypeGroups?.includes('企画競争入札') as boolean}
            onChange={(checked) => onChangeProcedureTypeGroup('企画競争入札', checked)}
          />
          <AppCheckbox
            label={'随意契約'}
            checked={targetPreset?.filter?.procedureTypeGroups?.includes('随意契約') as boolean}
            onChange={(checked) => onChangeProcedureTypeGroup('随意契約', checked)}
          />
          <AppCheckbox
            label={'見積もり合わせ'}
            checked={
              targetPreset?.filter?.procedureTypeGroups?.includes('見積もり合わせ') as boolean
            }
            onChange={(checked) => onChangeProcedureTypeGroup('見積もり合わせ', checked)}
          />
          <AppCheckbox
            label={'資料招請'}
            checked={targetPreset?.filter?.procedureTypeGroups?.includes('資料招請') as boolean}
            onChange={(checked) => onChangeProcedureTypeGroup('資料招請', checked)}
          />
          <AppCheckbox
            label={'意見招請'}
            checked={targetPreset?.filter?.procedureTypeGroups?.includes('意見招請') as boolean}
            onChange={(checked) => onChangeProcedureTypeGroup('意見招請', checked)}
          />
          <AppCheckbox
            label={'その他'}
            checked={targetPreset?.filter?.procedureTypeGroups?.includes('その他') as boolean}
            onChange={(checked) => onChangeProcedureTypeGroup('その他', checked)}
          />
        </Flex>
      </Box>
      <Box className={styles.formBox}>
        <Text className={styles.formTitle}>公告日</Text>
        <Flex direction={'row'} justify={'start'} align={'center'}>
          <AppDatePicker
            value={
              targetPreset?.filter?.publicationDateFrom
                ? new Date(targetPreset.filter?.publicationDateFrom)
                : undefined
            }
            maxDate={
              targetPreset?.filter?.publicationDateTo
                ? new Date(targetPreset.filter?.publicationDateTo)
                : undefined
            }
            onChange={(date) => {
              setTargetPreset({
                ...targetPreset,
                filter: {
                  ...targetPreset?.filter,
                  publicationDateFrom: date ? convertDateToYYYYMMDD(date) : undefined,
                },
              });
            }}
          />
          <Box style={{ marginInline: '16px' }}>〜</Box>
          <AppDatePicker
            value={
              targetPreset?.filter?.publicationDateTo
                ? new Date(targetPreset.filter?.publicationDateTo)
                : undefined
            }
            minDate={
              targetPreset?.filter?.publicationDateFrom
                ? new Date(targetPreset.filter?.publicationDateFrom)
                : undefined
            }
            onChange={(date) => {
              setTargetPreset({
                ...targetPreset,
                filter: {
                  ...targetPreset?.filter,
                  publicationDateTo: date ? convertDateToYYYYMMDD(date) : undefined,
                },
              });
            }}
          />
        </Flex>
      </Box>
      <Flex justify='center' align='center' gap='2'>
        <AppCheckbox
          label='この条件で配信する'
          checked={addSubscription}
          onChange={(checked) => {
            setAddSubscription(checked);
          }}
        />
      </Flex>

      {errorMessage.length > 0 && <Box className={styles.errorMessageBox}>{errorMessage}</Box>}
      <Box className={styles.buttonBox}>
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
                    orKeywords: orKeywords.split(/\s+/).filter((word) => word.trim() !== ''),
                  },
                };
                onNext(preset, addSubscription);
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
