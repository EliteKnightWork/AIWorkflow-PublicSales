'use client';
import { useUser } from '@auth0/nextjs-auth0';
import { Box, Button, Flex, Text, TextArea } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import type { SearchFilterPreset } from '@/api/generated/models';
import { DeadlineDaysSelect } from '@/app/_components/deadlineDaysSelect/DeadlineDaysSelect';
import { FilterCard } from '@/app/_components/filterCard/FilterCard';
import { ExperienceRequiredSelect } from '@/app/_components/search_filter_preset/ExperienceRequiredSelect';
import { OfficeRequiredSelect } from '@/app/_components/search_filter_preset/OfficeRequiredSelect';
import { ParticipateQualificationsSelect } from '@/app/_components/search_filter_preset/ParticipateQualificationsSelect';
import { SavedConditionsSelect } from '@/app/_components/search_filter_preset/SavedConditionsSelect';
import { SecurityQualificationsSelect } from '@/app/_components/search_filter_preset/SecurityQualificationsSelect';
import { AppDatePicker } from '@/app/(content)/_components/datePicker/AppDatePicker';
import { FormatDescriptionSelect } from '@/app/(content)/_components/formatDescriptionSelect/FormatDescriptionSelect';
import { PrefectureSelect } from '@/app/(content)/_components/prefectureSelect/PrefectureSelect';
import { SearchFilterPresetList } from '@/app/(content)/mypage/_components/searchFilterPresetList/searchFilterPresetList';
import { SearchFilterQualificationsList } from '@/app/(content)/mypage/_components/searchFilterQualificationsList/SearchFilterQualificationsList';
import AppOverlayModal from '@/components/appOverlayModal/AppOverlayModal';
import { AppCheckbox } from '@/components/checkbox/AppCheckbox';
import { AppSwitch } from '@/components/switchbutton/AppSwitch';
import { useSearchFilterPreset } from '@/context/SearchFilterPresetContext';
import { convertDateToYYYYMMDD } from '@/utils/dateUtils';
import type { AdditionalFilterCondition } from '../../_containers/project-search/model';
import { ProcedureList } from '../../_containers/project-search/types';
import { useSelectedSearchFilterPreset } from '../../_context/selectedSearchFilterPreset';
import styles from './styles.module.css';

type Props = {
  value: AdditionalFilterCondition;
  onChange: (value: AdditionalFilterCondition) => void;
  selectedPresetTitle?: string;
  addFormat?: boolean;
  onAddFormatChange?: (value: boolean) => void;
  disableAddFormat?: boolean;
  refreshFunctionalLimitations?: () => void;
};

export const AdditionalFilterForm = ({
  value,
  onChange,
  selectedPresetTitle,
  addFormat: addFormatProp,
  onAddFormatChange,
  disableAddFormat = false,
  refreshFunctionalLimitations,
}: Props) => {
  const [selectedSavedCondition, setSelectedSavedCondition] = useState<string | undefined>(
    selectedPresetTitle
  );
  const [isPresetListModalOpen, setIsPresetListModalOpen] = useState(false);
  const [isQualificationsListModalOpen, setIsQualificationsListModalOpen] = useState(false);
  const [addFormat, setAddFormat] = useState(addFormatProp ?? false);
  const { user } = useUser();

  const handleAddFormatChange = (newValue: boolean) => {
    setAddFormat(newValue);
    onAddFormatChange?.(newValue);
  };
  const { refreshPresets, presets } = useSearchFilterPreset();
  const [isTextAreaFocused, setIsTextAreaFocused] = useState(false);
  useEffect(() => {
    setSelectedSavedCondition(selectedPresetTitle);
  }, [selectedPresetTitle]);
  const { setSelectedSearchFilterPresetId } = useSelectedSearchFilterPreset();

  const handleFormatDeleted = () => {
    if (refreshFunctionalLimitations) {
      refreshFunctionalLimitations();
    }
  };

  const applyPresetToForm = (preset: SearchFilterPreset) => {
    const filter = preset.filter || {};
    onChange({
      keywords: filter.keywords?.join(' ') || '',
      orKeywords: filter.orKeywords?.join(' ') || '',
      notKeywords: filter.notKeywords?.join(' ') || '',
      businessDescription: preset.businessDescription || '',
      procedureTypeGroups:
        filter.procedureTypeGroups && filter.procedureTypeGroups.length > 0
          ? filter.procedureTypeGroups
          : undefined,
      prefectures:
        filter.prefectures && filter.prefectures.length > 0
          ? filter.prefectures.map(String)
          : undefined,
      organizationName: filter.organizations?.join(' ') || '',
      bidCompanyName: undefined,
      plannedPriceFrom: filter.plannedPriceFrom || undefined,
      plannedPriceTo: filter.plannedPriceTo || undefined,
      isExperienceRequired:
        filter.isExperienceRequired === null ? undefined : filter.isExperienceRequired,
      isOfficeRequired: filter.isOfficeRequired === null ? undefined : filter.isOfficeRequired,
      projectSecurityQualifications:
        filter.projectSecurityQualifications && filter.projectSecurityQualifications.length > 0
          ? filter.projectSecurityQualifications
          : undefined,
      deadlineDaysRemaining:
        filter.deadlineDaysRemaining === null ? undefined : filter.deadlineDaysRemaining,
      publicationDateFrom: filter.publicationDateFrom || undefined,
      publicationDateTo: filter.publicationDateTo || undefined,
      participateQualificationTypes: filter.participateQualificationTypes || undefined,
      participateQualificationPrefectures: filter.participateQualificationPrefectures || undefined,
      participateQualificationIds: filter.participateQualificationIds || undefined,
      participateQualificationGradeIds: filter.participateQualificationGradeIds || undefined,
      noQualification: filter.noQualification || false,
      tenderOpeningDateFrom: filter.tenderOpeningDateFrom || undefined,
      tenderOpeningDateTo: filter.tenderOpeningDateTo || undefined,
      useSynonymSearch: filter.useSynonymSearch || false,
    });
    setSelectedSavedCondition(preset.title || '');
    setSelectedSearchFilterPresetId(preset.id);
  };

  return (
    <Flex direction={'column'} className={styles.additionalFilterForm}>
      <FilterCard title='保存条件'>
        <SavedConditionsSelect
          value={selectedSavedCondition}
          onOpenPresetList={() => setIsPresetListModalOpen(true)}
          hasPresets={presets && presets.length > 0}
        />
      </FilterCard>

      <FilterCard title='キーワード'>
        <Box className={styles.formBox}>
          <Text className={styles.formTitle}>類義語検索</Text>
          <Flex>
            <AppSwitch
              label='類義語検索'
              name='publificationDateSort'
              value='desc'
              checked={value.useSynonymSearch || false}
              onChange={() =>
                onChange({
                  ...value,
                  useSynonymSearch: !value.useSynonymSearch,
                })
              }
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
              placeholder='ORワードで検索(複数ある場合はスペース区切り)'
              value={value.orKeywords || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  orKeywords: e.target.value,
                })
              }
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
              placeholder='ANDワードで検索(複数ある場合はスペース区切り)'
              value={value.keywords || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  keywords: e.target.value,
                })
              }
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
              placeholder='NOTワードを設定(複数ある場合はスペース区切り)'
              value={value.notKeywords || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  notKeywords: e.target.value,
                })
              }
            />
          </Box>
        </Box>

        {user && (
          <Box className={styles.formBox}>
            <Flex justify='between' align='center'>
              <Text className={styles.formTitle}>事業内容</Text>
              <FormatDescriptionSelect
                onFormatDeleted={handleFormatDeleted}
                onSelectDescription={(description) => {
                  onChange({
                    ...value,
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
            </Box>
            <Box
              className={`${styles.textAreaContainer} ${isTextAreaFocused ? styles.textAreaContainerFocused : ''}`}
            >
              <TextArea
                variant='classic'
                className={styles.businessDescriptionTextArea}
                placeholder='入力してください'
                value={value.businessDescription || ''}
                onFocus={() => setIsTextAreaFocused(true)}
                onBlur={() => setIsTextAreaFocused(false)}
                onChange={(e) =>
                  onChange({
                    ...value,
                    businessDescription: e.target.value || undefined,
                  })
                }
              />
            </Box>
            <Button
              variant='outline'
              className={`${styles.formatAddButton} ${addFormat ? styles.formatAddButtonChecked : styles.formatAddButtonUnchecked}`}
              onClick={() => handleAddFormatChange(!addFormat)}
              disabled={disableAddFormat}
            >
              <input
                type='checkbox'
                checked={addFormat}
                onChange={(e) => handleAddFormatChange(e.target.checked)}
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
        )}
      </FilterCard>

      <FilterCard title='発注機関属性'>
        <Box className={styles.formBox}>
          <Text className={styles.formTitle}>都道府県</Text>
          <PrefectureSelect
            selectedPrefectureIds={value.prefectures?.map(Number) || []}
            onSelect={(selectedIds) => {
              onChange({
                ...value,
                prefectures: selectedIds.length > 0 ? selectedIds.map(String) : undefined,
              });
            }}
          />
        </Box>
        <Box className={styles.formBox}>
          <Text className={styles.formTitle}>発注機関</Text>
          <input
            className={styles.input}
            type='text'
            placeholder='発注機関名を入力(複数ある場合はスペース区切り)'
            value={value.organizationName || ''}
            onChange={(e) =>
              onChange({
                ...value,
                organizationName: e.target.value || undefined,
              })
            }
          />
        </Box>
      </FilterCard>

      <FilterCard title='スケジュール'>
        <Box className={styles.formBox}>
          <Text className={styles.formTitle}>公告日</Text>
          <Flex direction={'row'} justify={'start'} align={'center'}>
            <Box style={{ width: 'calc(50% - 8px)' }}>
              <AppDatePicker
                inputClassName={styles.input}
                value={value.publicationDateFrom ? new Date(value.publicationDateFrom) : undefined}
                maxDate={value.publicationDateTo ? new Date(value.publicationDateTo) : undefined}
                onChange={(date) => {
                  onChange({
                    ...value,
                    publicationDateFrom: date ? convertDateToYYYYMMDD(date) : undefined,
                  });
                }}
              />
            </Box>
            <Box style={{ marginInline: '16px' }}>〜</Box>
            <Box style={{ width: 'calc(50% - 8px)' }}>
              <AppDatePicker
                inputClassName={styles.input}
                value={value.publicationDateTo ? new Date(value.publicationDateTo) : undefined}
                minDate={
                  value.publicationDateFrom ? new Date(value.publicationDateFrom) : undefined
                }
                onChange={(date) => {
                  onChange({
                    ...value,
                    publicationDateTo: date ? convertDateToYYYYMMDD(date) : undefined,
                  });
                }}
              />
            </Box>
          </Flex>
          <Text className={styles.noteText}>
            ※上記の条件は[落札案件]では適用できません。[受付中]、[受付終了]にのみご利用いただけます。
          </Text>
        </Box>
        <Box className={styles.formBox}>
          <Text className={styles.formTitle}>落札日</Text>
          <Flex direction={'row'} justify={'start'} align={'center'}>
            <Box style={{ width: 'calc(50% - 8px)' }}>
              <AppDatePicker
                inputClassName={styles.input}
                value={
                  value.tenderOpeningDateFrom ? new Date(value.tenderOpeningDateFrom) : undefined
                }
                maxDate={
                  value.tenderOpeningDateTo ? new Date(value.tenderOpeningDateTo) : undefined
                }
                onChange={(date) => {
                  onChange({
                    ...value,
                    tenderOpeningDateFrom: date ? convertDateToYYYYMMDD(date) : undefined,
                  });
                }}
              />
            </Box>
            <Box style={{ marginInline: '16px' }}>〜</Box>
            <Box style={{ width: 'calc(50% - 8px)' }}>
              <AppDatePicker
                inputClassName={styles.input}
                value={value.tenderOpeningDateTo ? new Date(value.tenderOpeningDateTo) : undefined}
                minDate={
                  value.tenderOpeningDateFrom ? new Date(value.tenderOpeningDateFrom) : undefined
                }
                onChange={(date) => {
                  onChange({
                    ...value,
                    tenderOpeningDateTo: date ? convertDateToYYYYMMDD(date) : undefined,
                  });
                }}
              />
            </Box>
          </Flex>
          <Text className={styles.noteText}>
            ※上記の条件は[受付中]、[受付終了]では適用できません。[落札案件]にのみご利用いただけます。
          </Text>
        </Box>
        <DeadlineDaysSelect
          value={value.deadlineDaysRemaining}
          onChange={(v) => {
            onChange({
              ...value,
              deadlineDaysRemaining: v,
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
                  checked={value.procedureTypeGroups?.includes(procedure) || false}
                  onChange={(checked: boolean) => {
                    const currentProcedures = value.procedureTypeGroups || [];
                    const newProcedures = checked
                      ? [...currentProcedures, procedure]
                      : currentProcedures.filter((p) => p !== procedure);
                    onChange({
                      ...value,
                      procedureTypeGroups: newProcedures.length > 0 ? newProcedures : undefined,
                    });
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
              value={value.plannedPriceFrom?.toString() || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  plannedPriceFrom: Number(e.target.value),
                })
              }
            />
            <Box style={{ marginInline: '16px' }}>〜</Box>
            <input
              className={styles.input}
              type='number'
              placeholder='最高価格'
              value={value.plannedPriceTo?.toString() || ''}
              onChange={(e) => {
                onChange({
                  ...value,
                  plannedPriceTo: Number(e.target.value),
                });
              }}
            />
          </Flex>
          <Text className={styles.noteText}>
            ※上記の条件は[落札案件]では適用できません。[受付中]、[受付終了]にのみご利用いただけます。
          </Text>
        </Box>
      </FilterCard>

      <FilterCard title='参加資格'>
        <ParticipateQualificationsSelect
          types={value.participateQualificationTypes || []}
          prefectures={value.participateQualificationPrefectures}
          qualificationIds={value.participateQualificationIds}
          gradeIds={value.participateQualificationGradeIds}
          noQualification={value.noQualification || false}
          onOpenQualificationsList={() => setIsQualificationsListModalOpen(true)}
        />
        <ExperienceRequiredSelect
          value={value.isExperienceRequired}
          onChange={(v) => {
            onChange({
              ...value,
              isExperienceRequired: v,
            });
          }}
        />
        <OfficeRequiredSelect
          value={value.isOfficeRequired}
          onChange={(v) => {
            onChange({
              ...value,
              isOfficeRequired: v,
            });
          }}
        />
        <SecurityQualificationsSelect
          value={value.projectSecurityQualifications}
          onChange={(v) => {
            onChange({
              ...value,
              projectSecurityQualifications: v,
            });
          }}
        />
      </FilterCard>

      <AppOverlayModal
        title={'保存条件選択'}
        modalHeight={'82%'}
        contentComponent={
          <SearchFilterPresetList
            onSelectPreset={(preset) => {
              applyPresetToForm(preset);
              setIsPresetListModalOpen(false);
            }}
            isSimpleMode={true}
          />
        }
        isOpen={isPresetListModalOpen}
        onClose={() => {
          setIsPresetListModalOpen(false);
          refreshPresets();
        }}
      />
      <AppOverlayModal
        title={'入札参加資格を選択'}
        modalHeight={'82%'}
        modalWidth={'80vw'}
        contentComponent={
          <SearchFilterQualificationsList
            types={value.participateQualificationTypes || []}
            prefectures={value.participateQualificationPrefectures || []}
            qualificationIds={value.participateQualificationIds || []}
            gradeIds={value.participateQualificationGradeIds || []}
            noQualification={value.noQualification || false}
            onSelect={(selectedParams) => {
              onChange({
                ...value,
                participateQualificationTypes: selectedParams.participateQualificationTypes,
                participateQualificationPrefectures:
                  selectedParams.participateQualificationPrefectures,
                participateQualificationIds: selectedParams.participateQualificationIds,
                participateQualificationGradeIds: selectedParams.participateQualificationGradeIds,
                noQualification: selectedParams.noQualification,
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
  );
};
