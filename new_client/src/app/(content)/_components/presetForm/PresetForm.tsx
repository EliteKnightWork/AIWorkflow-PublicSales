import { Box, Button, Flex, Text, TextArea } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import type { SearchFilterPreset } from '@/api/generated/models';
import { DeadlineDaysSelect } from '@/app/_components/deadlineDaysSelect/DeadlineDaysSelect';
import { FilterCard } from '@/app/_components/filterCard/FilterCard';
import { ExperienceRequiredSelect } from '@/app/_components/search_filter_preset/ExperienceRequiredSelect';
import { OfficeRequiredSelect } from '@/app/_components/search_filter_preset/OfficeRequiredSelect';
import { ParticipateQualificationsSelect } from '@/app/_components/search_filter_preset/ParticipateQualificationsSelect';
import { SecurityQualificationsSelect } from '@/app/_components/search_filter_preset/SecurityQualificationsSelect';
import AppTooltip from '@/app/_components/tooltip/AppTooltip';
import { SearchFilterQualificationsList } from '@/app/(content)/mypage/_components/searchFilterQualificationsList/SearchFilterQualificationsList';
import AppOverlayModal from '@/components/appOverlayModal/AppOverlayModal';
import { AppCheckbox } from '@/components/checkbox/AppCheckbox';
import { AppSwitch } from '@/components/switchbutton/AppSwitch';
import { convertDateToYYYYMMDD } from '@/utils/dateUtils';
import { ProcedureList } from '../../projects/_containers/project-search/types';
import { AppDatePicker } from '../datePicker/AppDatePicker';
import { FormatDescriptionSelect } from '../formatDescriptionSelect/FormatDescriptionSelect';
import { PrefectureSelect } from '../prefectureSelect/PrefectureSelect';
import styles from './styles.module.css';

type Props = {
  preset: SearchFilterPreset;
  onCancel: () => void;
  onSave: (preset: SearchFilterPreset, addFormat: boolean) => Promise<void>;
  disableAddFormat: boolean;
  refreshFunctionalLimitations?: () => void;
};

export const PresetForm = ({
  preset,
  onSave,
  disableAddFormat,
  refreshFunctionalLimitations,
}: Props) => {
  const [targetPreset, setTargetPreset] = useState<SearchFilterPreset>();

  const [_isLoading, setIsLoading] = useState<boolean>(false);
  const [addFormat, setAddFormat] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isQualificationsListModalOpen, setIsQualificationsListModalOpen] = useState(false);

  // 配列 <-> 文字列　で変換が必要なものは別途state管理する
  const [keywords, setKeywords] = useState<string>('');
  const [orKeywords, setOrKeywords] = useState<string>('');
  const [notKeywords, setNotKeywords] = useState<string>('');
  const [searchWithSynonym, setSearchWithSynonym] = useState(false);

  const [isTextAreaFocused, setIsTextAreaFocused] = useState(false);

  const handleFormatDeleted = () => {
    console.log('handleFormatDeleted1');
    if (refreshFunctionalLimitations) {
      console.log('handleFormatDeleted2');
      refreshFunctionalLimitations();
    }
  };

  useEffect(() => {
    if (preset) {
      setKeywords(preset?.filter?.keywords?.join(' ') ?? '');
      setOrKeywords(preset?.filter?.orKeywords?.join(' ') ?? '');
      setNotKeywords(preset?.filter?.notKeywords?.join(' ') ?? '');
      setSearchWithSynonym(preset?.filter?.useSynonymSearch ?? false);
      setTargetPreset(preset);
    }
  }, [preset]);

  const validatePreset = () => {
    if (!targetPreset?.title) {
      setErrorMessage('タイトルは必須です');
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
    targetPreset && (
      <Flex direction={'column'} className={styles.presetForm}>
        {/* <Box className={styles.infoBox}>
          <span className='material-icons' translate='no' aria-hidden='true'>
            info
          </span>
          <Text className={styles.infoMessage}>
            <Strong>[事業内容]</Strong>と<Strong>[ORワード]</Strong>の入力が必要です！
            <br />
            あなたにピッタリな案件をおすすめします💡
          </Text>
        </Box> */}
        <FilterCard title='保存条件のタイトル'>
          <Box className={styles.formBox}>
            <input
              className={styles.input}
              type='text'
              placeholder='タイトルを入力'
              value={targetPreset.title}
              onChange={(e) => {
                setTargetPreset({
                  ...targetPreset,
                  title: e.target.value,
                });
              }}
            />
          </Box>
        </FilterCard>

        <FilterCard title='キーワード'>
          <Box className={styles.formBox}>
            <Text className={styles.formTitle}>類義語検索</Text>
            <Flex>
              <AppSwitch
                label='類義語検索'
                name='publificationDateSort'
                value='desc'
                checked={searchWithSynonym}
                onChange={() => setSearchWithSynonym(!searchWithSynonym)}
              />
            </Flex>
          </Box>
          <Box className={styles.formBox}>
            <Text className={styles.formTitle}>ORワード</Text>
            <Box className={styles.inputWithIcon}>
              <span className='material-icons-outlined' translate='no' aria-hidden='true'>
                search
              </span>
              <input
                className={styles.input}
                type='text'
                placeholder='ORワード(複数ある場合はスペース区切り)'
                value={orKeywords}
                onChange={(e) => {
                  setOrKeywords(e.target.value);
                }}
              />
            </Box>
          </Box>
          <Box className={styles.formBox}>
            <Text className={styles.formTitle}>ANDワード</Text>
            <Box className={styles.inputWithIcon}>
              <span className='material-icons-outlined' translate='no' aria-hidden='true'>
                search
              </span>
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
          </Box>
          <Box className={styles.formBox}>
            <Text className={styles.formTitle}>NOTワード</Text>
            <Box className={styles.inputWithIcon}>
              <span className='material-icons-outlined' translate='no' aria-hidden='true'>
                search
              </span>
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
          </Box>

          <Box className={styles.formBox}>
            <Flex align='center' justify='between'>
              <Text className={styles.formTitle}>事業内容</Text>
              <FormatDescriptionSelect
                onFormatDeleted={handleFormatDeleted}
                onSelectDescription={(description) => {
                  setTargetPreset({
                    ...targetPreset,
                    businessDescription: description,
                  });
                }}
              />
            </Flex>
            <Box className={styles.tooltipContainer}>
              <span className='material-icons' translate='no' aria-hidden='true'>
                info
              </span>
              <Text className={styles.tooltipText}>
                事業内容を入力するとよりマッチした案件を見つけることができます
              </Text>

              <AppTooltip
                triggerChildren={
                  <Flex direction='row' align='center' gap='2'>
                    <Text className={styles.warningDescription}>イチオシ案件とは</Text>
                    <span className='material-icons' translate='no' aria-hidden='true'>
                      help_outline
                    </span>
                  </Flex>
                }
                content={
                  <Box className={styles.tooltip}>
                    <Text>事業内容をもとに、あなたにイチオシしたい案件をAIがおすすめします</Text>
                  </Box>
                }
              />
            </Box>
            <Box
              className={`${styles.textAreaContainer} ${isTextAreaFocused ? styles.textAreaContainerFocused : ''}`}
            >
              <TextArea
                variant='surface'
                className={styles.businessDescriptionTextArea}
                placeholder='入力してください'
                value={targetPreset.businessDescription ?? ''}
                onFocus={() => setIsTextAreaFocused(true)}
                onBlur={() => setIsTextAreaFocused(false)}
                onChange={(e) => {
                  setTargetPreset({
                    ...targetPreset,
                    businessDescription: e.target.value,
                  });
                }}
              />
            </Box>
            <Button
              variant='outline'
              className={`${styles.formatAddButton} ${addFormat ? styles.formatAddButtonChecked : styles.formatAddButtonUnchecked}`}
              onClick={() => setAddFormat(!addFormat)}
              disabled={disableAddFormat}
            >
              <input
                type='checkbox'
                checked={addFormat}
                onChange={(e) => setAddFormat(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                style={{ marginRight: '8px' }}
                disabled={disableAddFormat}
              />
              <Text>フォーマットに追加する</Text>
            </Button>
            {disableAddFormat && (
              <Text style={{ color: 'red', marginTop: '8px', fontSize: '14px' }}>
                登録上限数に達しているため、フォーマットに追加できません
              </Text>
            )}
          </Box>
        </FilterCard>

        <FilterCard title='発注機関属性'>
          <Box className={styles.formBox}>
            <Text className={styles.formTitle}>都道府県</Text>
            <PrefectureSelect
              onSelect={(ids) => {
                setTargetPreset({
                  ...targetPreset,
                  filter: {
                    ...targetPreset.filter,
                    prefectures: ids.length > 0 ? ids : undefined,
                  },
                });
              }}
              selectedPrefectureIds={targetPreset.filter?.prefectures ?? []}
            />
          </Box>
          <Box className={styles.formBox}>
            <Text className={styles.formTitle}>発注機関名</Text>
            <input
              className={styles.input}
              type='text'
              placeholder='入力してください'
              value={targetPreset.filter?.organizations?.join(' ') ?? ''}
              onChange={(e) => {
                setTargetPreset({
                  ...targetPreset,
                  filter: {
                    ...targetPreset.filter,
                    organizations:
                      e.target.value.length > 0
                        ? e.target.value.split(/\s+/).filter((word) => word.trim() !== '')
                        : undefined,
                  },
                });
              }}
            />
          </Box>
        </FilterCard>

        <FilterCard title='スケジュール'>
          <Box className={styles.formBox}>
            <Text className={styles.formTitle}>公告日</Text>
            <Flex direction={'row'} justify={'start'} align={'center'}>
              <AppDatePicker
                inputClassName={styles.input}
                value={
                  targetPreset.filter?.publicationDateFrom
                    ? new Date(targetPreset.filter?.publicationDateFrom)
                    : undefined
                }
                maxDate={
                  targetPreset.filter?.publicationDateTo
                    ? new Date(targetPreset.filter?.publicationDateTo)
                    : undefined
                }
                onChange={(date) => {
                  setTargetPreset({
                    ...targetPreset,
                    filter: {
                      ...targetPreset.filter,
                      publicationDateFrom: date ? convertDateToYYYYMMDD(date) : undefined,
                    },
                  });
                }}
              />
              <Box style={{ marginInline: '16px' }}>〜</Box>
              <AppDatePicker
                inputClassName={styles.input}
                value={
                  targetPreset.filter?.publicationDateTo
                    ? new Date(targetPreset.filter?.publicationDateTo)
                    : undefined
                }
                minDate={
                  targetPreset.filter?.publicationDateFrom
                    ? new Date(targetPreset.filter?.publicationDateFrom)
                    : undefined
                }
                onChange={(date) => {
                  setTargetPreset({
                    ...targetPreset,
                    filter: {
                      ...targetPreset.filter,
                      publicationDateTo: date ? convertDateToYYYYMMDD(date) : undefined,
                    },
                  });
                }}
              />
            </Flex>
          </Box>
          <Box className={styles.formBox}>
            <Text className={styles.formTitle}>落札日</Text>
            <Flex direction={'row'} justify={'start'} align={'center'}>
              <AppDatePicker
                inputClassName={styles.input}
                value={
                  targetPreset.filter?.tenderOpeningDateFrom
                    ? new Date(targetPreset.filter?.tenderOpeningDateFrom)
                    : undefined
                }
                maxDate={
                  targetPreset.filter?.tenderOpeningDateTo
                    ? new Date(targetPreset.filter?.tenderOpeningDateTo)
                    : undefined
                }
                onChange={(date) => {
                  setTargetPreset({
                    ...targetPreset,
                    filter: {
                      ...targetPreset.filter,
                      tenderOpeningDateFrom: date ? convertDateToYYYYMMDD(date) : undefined,
                    },
                  });
                }}
              />
              <Box style={{ marginInline: '16px' }}>〜</Box>
              <AppDatePicker
                inputClassName={styles.input}
                value={
                  targetPreset.filter?.tenderOpeningDateTo
                    ? new Date(targetPreset.filter?.tenderOpeningDateTo)
                    : undefined
                }
                minDate={
                  targetPreset.filter?.tenderOpeningDateFrom
                    ? new Date(targetPreset.filter?.tenderOpeningDateFrom)
                    : undefined
                }
                onChange={(date) => {
                  setTargetPreset({
                    ...targetPreset,
                    filter: {
                      ...targetPreset.filter,
                      tenderOpeningDateTo: date ? convertDateToYYYYMMDD(date) : undefined,
                    },
                  });
                }}
              />
            </Flex>
          </Box>
          <DeadlineDaysSelect
            value={targetPreset.filter?.deadlineDaysRemaining ?? undefined}
            onChange={(value) => {
              setTargetPreset({
                ...targetPreset,
                filter: {
                  ...targetPreset.filter,
                  deadlineDaysRemaining: value,
                },
              });
            }}
          />
        </FilterCard>

        <FilterCard title='形式'>
          <Box className={styles.formBox}>
            <Text className={styles.formTitle}>入札方式</Text>
            <Flex direction={'row'} wrap={'wrap'} gap={'12px'}>
              {ProcedureList.map((procedure) => (
                <Box key={procedure} style={{ width: 'calc(25% - 9px)' }}>
                  <AppCheckbox
                    key={procedure}
                    label={procedure}
                    parentBoxCheckedClassName={styles.checkBoxParentBoxChecked}
                    checkBoxCheckedClassName={styles.checkBoxChecked}
                    checkedTextClassName={styles.checkBoxCheckedText}
                    checked={targetPreset.filter?.procedureTypeGroups?.includes(procedure) || false}
                    onChange={(checked: boolean) => {
                      onChangeProcedureTypeGroup(procedure, checked);
                    }}
                  />
                </Box>
              ))}
            </Flex>
          </Box>
          <Box className={styles.formBox}>
            <Text className={styles.formTitle}>予定価格</Text>
            <Flex direction={'row'} justify={'start'} align={'center'}>
              <input
                className={styles.input}
                type='number'
                placeholder='最低価格'
                value={targetPreset.filter?.plannedPriceFrom?.toString() || ''}
                onChange={(e) =>
                  setTargetPreset({
                    ...targetPreset,
                    filter: {
                      ...targetPreset.filter,
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
                value={targetPreset.filter?.plannedPriceTo?.toString() || ''}
                onChange={(e) => {
                  setTargetPreset({
                    ...targetPreset,
                    filter: {
                      ...targetPreset.filter,
                      plannedPriceTo: Number(e.target.value),
                    },
                  });
                }}
              />
            </Flex>
          </Box>
        </FilterCard>

        <FilterCard title='参加資格'>
          <ParticipateQualificationsSelect
            types={targetPreset.filter?.participateQualificationTypes || []}
            prefectures={targetPreset.filter?.participateQualificationPrefectures}
            qualificationIds={targetPreset.filter?.participateQualificationIds}
            gradeIds={targetPreset.filter?.participateQualificationGradeIds}
            noQualification={targetPreset.filter?.noQualification || false}
            onOpenQualificationsList={() => setIsQualificationsListModalOpen(true)}
          />
          <ExperienceRequiredSelect
            value={targetPreset.filter?.isExperienceRequired}
            onChange={(value) => {
              setTargetPreset({
                ...targetPreset,
                filter: {
                  ...targetPreset.filter,
                  isExperienceRequired: value,
                },
              });
            }}
          />
          <OfficeRequiredSelect
            value={targetPreset.filter?.isOfficeRequired}
            onChange={(value) => {
              setTargetPreset({
                ...targetPreset,
                filter: {
                  ...targetPreset.filter,
                  isOfficeRequired: value,
                },
              });
            }}
          />
          <SecurityQualificationsSelect
            value={targetPreset.filter?.projectSecurityQualifications}
            onChange={(value) => {
              setTargetPreset({
                ...targetPreset,
                filter: {
                  ...targetPreset.filter,
                  projectSecurityQualifications: value,
                },
              });
            }}
          />
        </FilterCard>

        {errorMessage.length > 0 && <Box className={styles.errorMessageBox}>{errorMessage}</Box>}
        <Button
          type='button'
          style={{ display: 'none' }}
          data-save-button
          onClick={async () => {
            setIsLoading(true);
            setErrorMessage('');
            try {
              if (validatePreset()) {
                const preset = {
                  ...targetPreset,
                  filter: {
                    ...targetPreset.filter,
                    keywords: keywords.split(/\s+/).filter((word) => word.trim() !== ''),
                    orKeywords: orKeywords.split(/\s+/).filter((word) => word.trim() !== ''),
                    notKeywords: notKeywords.split(/\s+/).filter((word) => word.trim() !== ''),
                    useSynonymSearch: searchWithSynonym,
                  },
                };
                setTargetPreset(preset);
                await onSave(preset, addFormat);
              }
            } finally {
              setIsLoading(false);
            }
          }}
        >
          保存
        </Button>

        <AppOverlayModal
          title={'入札参加資格を選択'}
          modalHeight={'74%'}
          modalWidth={'80vw'}
          contentComponent={
            <SearchFilterQualificationsList
              types={targetPreset.filter?.participateQualificationTypes || []}
              prefectures={targetPreset.filter?.participateQualificationPrefectures || []}
              qualificationIds={targetPreset.filter?.participateQualificationIds || []}
              gradeIds={targetPreset.filter?.participateQualificationGradeIds || []}
              noQualification={targetPreset.filter?.noQualification || false}
              onSelect={(selectedParams) => {
                setTargetPreset({
                  ...targetPreset,
                  filter: {
                    ...targetPreset.filter,
                    participateQualificationTypes: selectedParams.participateQualificationTypes,
                    participateQualificationPrefectures:
                      selectedParams.participateQualificationPrefectures,
                    participateQualificationIds: selectedParams.participateQualificationIds,
                    participateQualificationGradeIds:
                      selectedParams.participateQualificationGradeIds,
                    noQualification: selectedParams.noQualification,
                  },
                });
                setIsQualificationsListModalOpen(false);
              }}
              onCancel={() => setIsQualificationsListModalOpen(false)}
            />
          }
          isOpen={isQualificationsListModalOpen}
          onClose={() => {
            setIsQualificationsListModalOpen(false);
          }}
        />
      </Flex>
    )
  );
};
