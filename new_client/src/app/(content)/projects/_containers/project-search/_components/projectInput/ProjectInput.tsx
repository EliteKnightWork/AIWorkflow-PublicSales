'use client';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { useEffect, useRef, useState } from 'react';
import { addBusinessDescriptionFormat } from '@/api/generated/endpoints/business-description-formats';
import { useGetFunctionalLimitations } from '@/api/generated/endpoints/companies';
import { useGetSuggestions } from '@/api/generated/endpoints/suggestions';
import type {
  SearchFilterPreset,
  SearchProjectsParams,
  SearchProjectsProjectSecurityQualificationsItem,
} from '@/api/generated/models';
import { PresetCreateForm } from '@/app/(content)/_containers/preset-create';
import { PresetEditDialog } from '@/app/(content)/_containers/preset-edit-dialog';
import { SearchFilterPresetList } from '@/app/(content)/mypage/_components/searchFilterPresetList/searchFilterPresetList';
import { AdditionalFilterForm } from '@/app/(content)/projects/_components/additionalFilterForm/additionalFilterForm';
import { useProjectList } from '@/app/(content)/projects/_context/projectListContext';
import { useProjectSearch } from '@/app/(content)/projects/_context/projectSearchContext';
import { useSelectedSearchFilterPreset } from '@/app/(content)/projects/_context/selectedSearchFilterPreset';
import { ProjectType } from '@/app/(content)/projects/types';
import AppOverlayModal from '@/components/appOverlayModal/AppOverlayModal';
import FilterClearButton from '@/components/filterClearButton/FilterClearButton';
import { PROJECT_SEARCH_INPUT } from '@/constants';
import { useCta } from '@/context/CtaContext';
import { useSearchFilterPreset } from '@/context/SearchFilterPresetContext';
import { useToast } from '@/context/ToastContext';
import { useApiError } from '@/hooks/useApiError';
import { useParticipateQualifications } from '@/hooks/useParticipateQualifications';
import { getSearchFilterPresetFilter } from '@/lib/getSearchFilterPresetFilter';
import { isEqualObjects } from '@/utils/compareObjectsUtil';
import { sendSearchEvent } from '@/utils/googleAnalyticsUtils';
import type { AdditionalFilterCondition, SearchInputChip } from '../../model';
import { convertToSearchInputChip, convertToSearchProjectsParams } from '../../model';
import type { SearchTag } from '../../types';
import { AllSuggestions } from '../allSuggestions/AllSuggestions';
import { SuggestionChipList } from '../suggestionChipList/SuggestionChipList';
import styles from './styles.module.css';

type Props = {
  isLogin: boolean;
  isModalOpen?: boolean;
  setIsModalOpen?: (open: boolean) => void;
  selectedSearchFilterPresetId?: number;
  setSelectedSearchFilterPresetId?: (id: number | undefined) => void;
  onSaveCondition?: (params: SearchProjectsParams, businessDescription: string | null) => void;
  onSearchInputParamsChange?: (params: SearchProjectsParams) => void;
  onBusinessDescriptionChange?: (description: string | null) => void;
};

const initialAdditionalFilterCondition: AdditionalFilterCondition = {
  keywords: '',
  orKeywords: '',
  notKeywords: '',
  businessDescription: '',
  procedureTypeGroups: undefined,
  prefectures: undefined,
  organizationName: '',
  bidCompanyName: undefined,
  plannedPriceFrom: undefined,
  plannedPriceTo: undefined,
  isExperienceRequired: undefined,
  isOfficeRequired: undefined,
  projectSecurityQualifications: undefined,
  deadlineDaysRemaining: undefined,
  participateQualificationTypes: undefined,
  participateQualificationPrefectures: undefined,
  participateQualificationIds: undefined,
  participateQualificationGradeIds: undefined,
  noQualification: false,
};

function isAdditionalFilterConditionEqual(
  a: AdditionalFilterCondition,
  b: AdditionalFilterCondition
): boolean {
  const keys = [
    'keywords',
    'orKeywords',
    'notKeywords',
    'businessDescription',
    'procedureTypeGroups',
    'prefectures',
    'organizationName',
    'bidCompanyName',
    'plannedPriceFrom',
    'plannedPriceTo',
    'publicationDateFrom',
    'publicationDateTo',
    'deadlineDaysRemaining',
    'isExperienceRequired',
    'isOfficeRequired',
    'projectSecurityQualifications',
    'participateQualificationTypes',
    'participateQualificationPrefectures',
    'participateQualificationIds',
    'participateQualificationGradeIds',
    'noQualification',
    'tenderOpeningDateFrom',
    'tenderOpeningDateTo',
  ];
  for (const key of keys) {
    const v1 = (a as any)[key];
    const v2 = (b as any)[key];
    if (Array.isArray(v1) || Array.isArray(v2)) {
      if (JSON.stringify(v1 ?? []) !== JSON.stringify(v2 ?? [])) return false;
    } else {
      if ((v1 ?? '') !== (v2 ?? '')) return false;
    }
  }
  return true;
}

function convertPresetToAdditionalFilterCondition(
  preset: SearchFilterPreset
): AdditionalFilterCondition {
  const filter = preset.filter || {};
  return {
    keywords: filter.keywords?.join(' ') || '',
    orKeywords: filter.orKeywords?.join(' ') || '',
    notKeywords: filter.notKeywords?.join(' ') || '',
    businessDescription: preset.businessDescription || '',
    procedureTypeGroups: filter.procedureTypeGroups || undefined,
    prefectures: filter.prefectures ? filter.prefectures.map(String) : undefined,
    organizationName: filter.organizations?.join(' ') || '',
    bidCompanyName: undefined,
    plannedPriceFrom: filter.plannedPriceFrom || undefined,
    plannedPriceTo: filter.plannedPriceTo || undefined,
    isExperienceRequired:
      filter.isExperienceRequired === null ? undefined : filter.isExperienceRequired,
    isOfficeRequired: filter.isOfficeRequired === null ? undefined : filter.isOfficeRequired,
    projectSecurityQualifications: filter.projectSecurityQualifications || undefined,
    deadlineDaysRemaining:
      filter.deadlineDaysRemaining === null ? undefined : filter.deadlineDaysRemaining,
    publicationDateFrom: filter.publicationDateFrom || undefined,
    publicationDateTo: filter.publicationDateTo || undefined,
    participateQualificationTypes: filter.participateQualificationTypes || undefined,
    participateQualificationPrefectures: filter.participateQualificationPrefectures || undefined,
    participateQualificationIds: filter.participateQualificationIds || undefined,
    participateQualificationGradeIds: filter.participateQualificationGradeIds || undefined,
    noQualification: filter.noQualification === null ? undefined : filter.noQualification,
    tenderOpeningDateFrom: filter.tenderOpeningDateFrom || undefined,
    tenderOpeningDateTo: filter.tenderOpeningDateTo || undefined,
  };
}

function convertProjectSearchParamsToAdditionalFilterCondition(
  params: SearchProjectsParams,
  businessDescription?: string
): AdditionalFilterCondition {
  return {
    keywords: params.keywords?.join(' ') || '',
    orKeywords: params.orKeywords?.join(' ') || '',
    notKeywords: params.notKeywords?.join(' ') || '',
    businessDescription: businessDescription || '',
    procedureTypeGroups: params.procedureTypeGroups || undefined,
    prefectures: params.prefectures ? params.prefectures.map(String) : undefined,
    organizationName: params.organizationNameArray?.join(' ') || '',
    bidCompanyName: params.bidCompanyName || undefined,
    plannedPriceFrom: params.plannedPriceFrom || undefined,
    plannedPriceTo: params.plannedPriceTo || undefined,
    isExperienceRequired:
      params.isExperienceRequired === null ? undefined : params.isExperienceRequired,
    isOfficeRequired: params.isOfficeRequired === null ? undefined : params.isOfficeRequired,
    projectSecurityQualifications: params.projectSecurityQualifications || undefined,
    deadlineDaysRemaining:
      params.deadlineDaysRemaining === null ? undefined : params.deadlineDaysRemaining,
    publicationDateFrom: params.publicationDateFrom || undefined,
    publicationDateTo: params.publicationDateTo || undefined,
    participateQualificationTypes: params.participateQualificationTypes || undefined,
    participateQualificationPrefectures: params.participateQualificationPrefectures || undefined,
    participateQualificationIds: params.participateQualificationIds || undefined,
    participateQualificationGradeIds: params.participateQualificationGradeIds || undefined,
    noQualification: params.noQualification || false,
    tenderOpeningDateFrom: params.tenderOpeningDateFrom || undefined,
    tenderOpeningDateTo: params.tenderOpeningDateTo || undefined,
    useSynonymSearch: params.useSynonymSearch || false,
  };
}

// チップ削除時のパラメータ更新ロジック
function getUpdatedParamsAfterChipRemoval(
  chip: SearchInputChip,
  chips: SearchInputChip[],
  projectSearchParams: SearchProjectsParams
): SearchProjectsParams {
  // 公告日のチップを削除する場合の特別処理
  if (chip.type === 'publicationDateFrom') {
    // fromとtoが同じ日付の場合、両方削除
    if (projectSearchParams.publicationDateFrom === projectSearchParams.publicationDateTo) {
      return convertToSearchProjectsParams(
        chips.filter((c) => c.type !== 'publicationDateFrom' && c.type !== 'publicationDateTo')
      );
    }
  }

  // 落札日のチップを削除する場合の特別処理
  if (chip.type === 'tenderOpeningDateFrom') {
    // fromとtoが同じ日付の場合、両方削除
    if (projectSearchParams.tenderOpeningDateFrom === projectSearchParams.tenderOpeningDateTo) {
      return convertToSearchProjectsParams(
        chips.filter((c) => c.type !== 'tenderOpeningDateFrom' && c.type !== 'tenderOpeningDateTo')
      );
    }
  }

  // 通常の削除処理
  return convertToSearchProjectsParams(
    chips.filter((c) => c.type !== chip.type || c.value !== chip.value)
  );
}

export default function ProjectInput({
  isLogin,
  isModalOpen: modalOpenProp,
  setIsModalOpen: setModalOpenProp,
  selectedSearchFilterPresetId: selectedSearchFilterPresetIdProp,
  setSelectedSearchFilterPresetId: setSelectedSearchFilterPresetIdProp,
  onSaveCondition,
  onSearchInputParamsChange,
  onBusinessDescriptionChange,
}: Props) {
  const { updateProjectSearchParams, projectSearchParams: searchParams } = useProjectSearch();

  const { openCta } = useCta();
  const { enqueueToast } = useToast();
  const { getApiErrorMessage } = useApiError();

  const [value, setValue] = useState('');
  const [isModalOpenState, setIsModalOpenState] = useState(false);
  const isModalOpen = modalOpenProp !== undefined ? modalOpenProp : isModalOpenState;
  const setIsModalOpen = setModalOpenProp !== undefined ? setModalOpenProp : setIsModalOpenState;
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isPresetEditDialogOpen, setIsPresetEditDialogOpen] = useState(false);
  const [isPresetListModalOpen, setIsPresetListModalOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addFormat, setAddFormat] = useState(false);

  const [projectSearchParams, setProjectSearchParams] =
    useState<SearchProjectsParams>(searchParams);

  // 参加資格データを取得
  const { data: qualifications } = useParticipateQualifications({
    ids: projectSearchParams.participateQualificationIds,
    gradeIds: projectSearchParams.participateQualificationGradeIds,
  });

  // チップの状態管理
  const [chips, setChips] = useState<SearchInputChip[]>([]);
  useEffect(() => {
    setChips(convertToSearchInputChip(projectSearchParams, qualifications || []));
  }, [projectSearchParams, qualifications]);

  const [businessDescription, setBusinessDescription] = useState<string | null>(null);
  // 親コンポーネントから状態を受け取るか、ローカル状態を使用
  const [selectedSearchFilterPresetIdLocal, setSelectedSearchFilterPresetIdLocal] = useState<
    number | undefined
  >(undefined);
  const selectedSearchFilterPresetId =
    selectedSearchFilterPresetIdProp !== undefined
      ? selectedSearchFilterPresetIdProp
      : selectedSearchFilterPresetIdLocal;
  const setSelectedSearchFilterPresetId =
    setSelectedSearchFilterPresetIdProp !== undefined
      ? setSelectedSearchFilterPresetIdProp
      : setSelectedSearchFilterPresetIdLocal;
  const [searchFilterPresets, setSearchFilterPresets] = useState<SearchFilterPreset[]>([]);
  const { setLoading } = useProjectList();
  const { businessDescription: description, updateBusinessDescription } =
    useSelectedSearchFilterPreset();

  const { presets, refreshPresets } = useSearchFilterPreset();

  const selectedPreset = presets.find((p) => p.id === selectedSearchFilterPresetId);

  const [additionalFilterCondition, setAdditionalFilterCondition] =
    useState<AdditionalFilterCondition>(initialAdditionalFilterCondition);

  const { data: functionalLimitations, refetch: refreshFunctionalLimitations } =
    useGetFunctionalLimitations();

  // 上限判定
  const disableAddFormat =
    functionalLimitations &&
    (functionalLimitations.maxBusinessDescriptionFormatCount ?? 0) -
      (functionalLimitations.businessDescriptionFormatCount ?? 0) <=
      0;

  useEffect(() => {
    if (selectedSearchFilterPresetId) {
      const preset = searchFilterPresets.find((p) => p.id === selectedSearchFilterPresetId);
      if (preset) {
        setBusinessDescription(preset.businessDescription || '');
      }
    }
  }, [selectedSearchFilterPresetId, searchFilterPresets]);

  useEffect(() => {
    if (projectSearchParams.keywords) {
      setAdditionalFilterCondition((prev) => ({
        ...prev,
        keywords: projectSearchParams.keywords?.join(' ') || '',
      }));
    } else {
      setAdditionalFilterCondition((prev) => ({
        ...prev,
        keywords: '',
      }));
    }

    if (projectSearchParams.orKeywords) {
      setAdditionalFilterCondition((prev) => ({
        ...prev,
        orKeywords: projectSearchParams.orKeywords?.join(' ') || '',
      }));
    } else {
      setAdditionalFilterCondition((prev) => ({
        ...prev,
        orKeywords: '',
      }));
    }

    if (projectSearchParams.notKeywords) {
      setAdditionalFilterCondition((prev) => ({
        ...prev,
        notKeywords: projectSearchParams.notKeywords?.join(' ') || '',
      }));
    } else {
      setAdditionalFilterCondition((prev) => ({
        ...prev,
        notKeywords: '',
      }));
    }

    if (projectSearchParams.procedureTypeGroups) {
      setAdditionalFilterCondition((prev) => ({
        ...prev,
        procedureTypeGroups: projectSearchParams.procedureTypeGroups,
      }));
    }

    if (projectSearchParams.prefectures) {
      setAdditionalFilterCondition((prev) => ({
        ...prev,
        prefectures: projectSearchParams.prefectures,
      }));
    }

    if (projectSearchParams.organizationNameArray) {
      setAdditionalFilterCondition((prev) => ({
        ...prev,
        organizationName: projectSearchParams.organizationNameArray?.join(' ') || '',
      }));
    } else {
      setAdditionalFilterCondition((prev) => ({
        ...prev,
        organizationName: '',
      }));
    }

    if (projectSearchParams.plannedPriceFrom) {
      setAdditionalFilterCondition((prev) => ({
        ...prev,
        plannedPriceFrom: projectSearchParams.plannedPriceFrom,
      }));
    }

    if (projectSearchParams.plannedPriceTo) {
      setAdditionalFilterCondition((prev) => ({
        ...prev,
        plannedPriceTo: projectSearchParams.plannedPriceTo,
      }));
    }

    if (projectSearchParams.isExperienceRequired) {
      setAdditionalFilterCondition((prev) => ({
        ...prev,
        isExperienceRequired: projectSearchParams.isExperienceRequired,
      }));
    }

    if (projectSearchParams.isOfficeRequired) {
      setAdditionalFilterCondition((prev) => ({
        ...prev,
        isOfficeRequired: projectSearchParams.isOfficeRequired,
      }));
    }

    if (projectSearchParams.projectSecurityQualifications) {
      setAdditionalFilterCondition((prev) => ({
        ...prev,
        projectSecurityQualifications: projectSearchParams.projectSecurityQualifications,
      }));
    }

    if (projectSearchParams.deadlineDaysRemaining) {
      setAdditionalFilterCondition((prev) => ({
        ...prev,
        deadlineDaysRemaining: projectSearchParams.deadlineDaysRemaining,
      }));
    }

    if (projectSearchParams.publicationDateFrom) {
      setAdditionalFilterCondition((prev) => ({
        ...prev,
        publicationDateFrom: projectSearchParams.publicationDateFrom,
      }));
    }

    if (projectSearchParams.publicationDateTo) {
      setAdditionalFilterCondition((prev) => ({
        ...prev,
        publicationDateTo: projectSearchParams.publicationDateTo,
      }));
    }

    if (projectSearchParams.participateQualificationTypes) {
      setAdditionalFilterCondition((prev) => ({
        ...prev,
        participateQualificationTypes: projectSearchParams.participateQualificationTypes,
      }));
    }

    if (projectSearchParams.participateQualificationPrefectures) {
      setAdditionalFilterCondition((prev) => ({
        ...prev,
        participateQualificationPrefectures:
          projectSearchParams.participateQualificationPrefectures,
      }));
    }

    if (projectSearchParams.participateQualificationIds) {
      setAdditionalFilterCondition((prev) => ({
        ...prev,
        participateQualificationIds: projectSearchParams.participateQualificationIds,
      }));
    }

    if (projectSearchParams.participateQualificationGradeIds) {
      setAdditionalFilterCondition((prev) => ({
        ...prev,
        participateQualificationGradeIds: projectSearchParams.participateQualificationGradeIds,
      }));
    }

    if (projectSearchParams.tenderOpeningDateFrom) {
      setAdditionalFilterCondition((prev) => ({
        ...prev,
        tenderOpeningDateFrom: projectSearchParams.tenderOpeningDateFrom,
      }));
    }

    if (projectSearchParams.tenderOpeningDateTo) {
      setAdditionalFilterCondition((prev) => ({
        ...prev,
        tenderOpeningDateTo: projectSearchParams.tenderOpeningDateTo,
      }));
    }
  }, [projectSearchParams]);

  useEffect(() => {
    setAdditionalFilterCondition((prev) => ({
      ...prev,
      businessDescription: businessDescription || undefined,
    }));
  }, [businessDescription]);

  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [value]);

  const { data: suggestions, isLoading } = useGetSuggestions({
    keyword: debouncedValue,
    limit: 10,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const additionalFilterFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSearchFilterPresets = async () => {
      setSearchFilterPresets(presets);
    };
    if (isLogin) {
      fetchSearchFilterPresets();
    } else {
      setSearchFilterPresets([]);
    }
  }, [isLogin, presets]);

  useEffect(() => {
    setProjectSearchParams(searchParams);
  }, [searchParams]);

  useEffect(() => {
    setBusinessDescription(description);
  }, [description]);

  // projectSearchParamsが変更された際に親コンポーネントに通知
  useEffect(() => {
    if (onSearchInputParamsChange) {
      // businessDescriptionを含めて親コンポーネントに通知
      const paramsWithBusinessDescription = {
        ...projectSearchParams,
        businessDescription: businessDescription || additionalFilterCondition.businessDescription,
      };
      onSearchInputParamsChange(paramsWithBusinessDescription);
    }
  }, [
    projectSearchParams,
    onSearchInputParamsChange,
    businessDescription,
    additionalFilterCondition.businessDescription,
  ]);

  // businessDescriptionが変更された際に親コンポーネントに通知
  useEffect(() => {
    if (onBusinessDescriptionChange) {
      onBusinessDescriptionChange(businessDescription || null);
    }
  }, [businessDescription, onBusinessDescriptionChange]);

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (
      suggestionsRef.current &&
      !suggestionsRef.current.contains(e.target as Node) &&
      !inputRef.current?.contains(e.target as Node) &&
      !additionalFilterFormRef.current?.contains(e.target as Node)
    ) {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const searchProjects = (newParams: SearchProjectsParams) => {
    // 値を元に遷移
    let updatedParams = newParams;
    updatedParams = {
      ...updatedParams,
      page: 1,
      ...(searchParams.tab && { tab: searchParams.tab }),
    };
    if (value.trim() !== '') {
      updatedParams = {
        ...projectSearchParams,
        orKeywords: projectSearchParams.orKeywords
          ? [...projectSearchParams.orKeywords, ...value.split(/\s+/)]
          : [...value.split(/\s+/)],
      };
      sendSearchEvent('project_keyword_search', updatedParams.orKeywords?.join(' ') || value);
    }

    setShowSuggestions(false);
    inputRef.current?.blur();

    // パラメータが変わってない場合は検索しない
    if (isEqualObjects(updatedParams, searchParams)) {
      return;
    }

    setProjectSearchParams(updatedParams);
    setValue('');
    setLoading(true);
    updateProjectSearchParams(updatedParams);
  };

  // サジェストデータの追加を行う
  // すでに同じ値が登録されていないかチェックを行う
  const addSuggestions = (params: SearchTag[], overwrite = false) => {
    let newParams = overwrite ? {} : projectSearchParams;

    for (const param of params) {
      if (param.tag_type === 'keywords') {
        // キーワード
        const keywords = newParams.keywords || [];
        if (!keywords.includes(param.tag_value)) {
          newParams = {
            ...newParams,
            keywords: keywords.length > 0 ? [...keywords, param.tag_value] : [param.tag_value],
          };
        }
      } else if (param.tag_type === 'notKeywords') {
        // 除外キーワード
        const notKeywords = newParams.notKeywords || [];
        if (!notKeywords.includes(param.tag_value)) {
          newParams = {
            ...newParams,
            notKeywords:
              notKeywords.length > 0 ? [...notKeywords, param.tag_value] : [param.tag_value],
          };
        }
      } else if (param.tag_type === 'orKeywords') {
        // OR検索キーワード
        const orKeywords = newParams.orKeywords || [];
        if (!orKeywords.includes(param.tag_value)) {
          newParams = {
            ...newParams,
            orKeywords:
              orKeywords.length > 0 ? [...orKeywords, param.tag_value] : [param.tag_value],
          };
        }
      } else if (param.tag_type === 'prefectures') {
        if (param.meta?.prefectureCode) {
          newParams = {
            ...newParams,
            prefectures: [
              ...new Set([...(newParams.prefectures || []), param.meta.prefectureCode as string]),
            ],
          };
        }
      } else if (param.tag_type === 'procedureTypeGroups') {
        const procedureTypeGroups = newParams.procedureTypeGroups || [];
        if (!procedureTypeGroups.includes(param.tag_value)) {
          newParams = {
            ...newParams,
            procedureTypeGroups: [
              ...new Set([...(newParams.procedureTypeGroups || []), param.tag_value]),
            ],
          };
        }
      } else if (param.tag_type === 'organizationNameArray') {
        newParams = {
          ...newParams,
          organizationNameArray: [
            ...new Set([...(newParams.organizationNameArray || []), param.tag_value]),
          ],
        };
      } else if (param.tag_type === 'bidCompanyName') {
        newParams = {
          ...newParams,
          bidCompanyName: param.tag_value,
        };
      } else if (param.tag_type === 'plannedPriceFrom') {
        newParams = {
          ...newParams,
          plannedPriceFrom: Number(param.tag_value),
        };
      } else if (param.tag_type === 'plannedPriceTo') {
        newParams = {
          ...newParams,
          plannedPriceTo: Number(param.tag_value),
        };
      } else if (param.tag_type === 'projectSecurityQualifications') {
        newParams = {
          ...newParams,
          projectSecurityQualifications: [
            ...new Set([
              ...(newParams.projectSecurityQualifications || []),
              param.tag_value,
            ] as SearchProjectsProjectSecurityQualificationsItem[]),
          ],
        };
      } else if (param.tag_type === 'isExperienceRequired') {
        newParams = {
          ...newParams,
          isExperienceRequired: param.tag_value === 'true',
        };
      } else if (param.tag_type === 'isOfficeRequired') {
        newParams = {
          ...newParams,
          isOfficeRequired: param.tag_value === 'true',
        };
      } else if (param.tag_type === 'deadlineDaysRemaining') {
        newParams = {
          ...newParams,
          deadlineDaysRemaining: Number(param.tag_value),
        };
      } else if (param.tag_type === 'publicationDateFrom') {
        newParams = {
          ...newParams,
          publicationDateFrom: param.tag_value,
        };
      } else if (param.tag_type === 'publicationDateTo') {
        newParams = {
          ...newParams,
          publicationDateTo: param.tag_value,
        };
      } else if (param.tag_type === 'participateQualificationIds') {
        newParams = {
          ...newParams,
          participateQualificationIds: [
            ...new Set([...(newParams.participateQualificationIds || []), Number(param.tag_value)]),
          ],
        };
      } else if (param.tag_type === 'participateQualificationGradeIds') {
        newParams = {
          ...newParams,
          participateQualificationGradeIds: [
            ...new Set([
              ...(newParams.participateQualificationGradeIds || []),
              Number(param.tag_value),
            ]),
          ],
        };
      } else if (param.tag_type === 'participateQualificationTypes') {
        newParams = {
          ...newParams,
          participateQualificationTypes: [
            ...new Set([...(newParams.participateQualificationTypes || []), param.tag_value]),
          ],
        };
      } else if (param.tag_type === 'participateQualificationPrefectures') {
        if (param.meta?.prefectureCode) {
          newParams = {
            ...newParams,
            participateQualificationPrefectures: [
              ...new Set([
                ...(newParams.participateQualificationPrefectures || []),
                param.meta.prefectureCode as string,
              ]),
            ],
          };
        }
      } else if (param.tag_type === 'noQualification') {
        newParams = {
          ...newParams,
          noQualification: param.tag_value === 'true',
        };
      } else if (param.tag_type === 'tenderOpeningDateFrom') {
        newParams = {
          ...newParams,
          tenderOpeningDateFrom: param.tag_value,
        };
      } else if (param.tag_type === 'tenderOpeningDateTo') {
        newParams = {
          ...newParams,
          tenderOpeningDateTo: param.tag_value,
        };
      } else if (param.tag_type === 'useSynonymSearch') {
        newParams = {
          ...newParams,
          useSynonymSearch: param.tag_value === 'true',
        };
      }
    }
    return newParams;
  };

  return (
    <>
      <AppOverlayModal
        title={'詳細条件'}
        contentComponent={
          <AdditionalFilterForm
            value={additionalFilterCondition}
            onChange={setAdditionalFilterCondition}
            selectedPresetTitle={selectedPreset?.title}
            addFormat={addFormat}
            onAddFormatChange={setAddFormat}
            disableAddFormat={disableAddFormat}
            refreshFunctionalLimitations={refreshFunctionalLimitations}
          />
        }
        footerComponent={
          <Box className={styles.footerBox}>
            <Button
              className={styles.cancelButton}
              onClick={() => {
                setIsModalOpen(false);
                setAddFormat(false); // キャンセル時にaddFormatをリセット
              }}
            >
              キャンセル
            </Button>
            {!isAdditionalFilterConditionEqual(
              additionalFilterCondition,
              initialAdditionalFilterCondition
            ) && (
              <Button
                className={styles.saveButton}
                onClick={() => {
                  const condition = additionalFilterCondition;
                  if (condition && onSaveCondition) {
                    const addCondition = {
                      ...condition,
                      keywords: condition.keywords
                        ? condition.keywords.split(/\s+/).filter((keyword) => keyword.trim() !== '')
                        : undefined,
                      orKeywords: condition.orKeywords
                        ? condition.orKeywords
                            .split(/\s+/)
                            .filter((keyword) => keyword.trim() !== '')
                        : undefined,
                      notKeywords: condition.notKeywords
                        ? condition.notKeywords
                            .split(/\s+/)
                            .filter((keyword) => keyword.trim() !== '')
                        : undefined,
                      procedureTypeGroups: condition.procedureTypeGroups,
                      prefectures: condition.prefectures,
                      organizationNameArray: condition.organizationName
                        ? condition.organizationName
                            .split(/[,\s]+/)
                            .filter((name) => name.trim() !== '')
                        : undefined,
                      bidCompanyName: condition.bidCompanyName,
                      noQualification: condition.noQualification,
                    };

                    const finalCondition = { ...projectSearchParams, ...addCondition };
                    setIsModalOpen(false);

                    // 詳細条件を反映した状態で保存処理を実行
                    onSaveCondition(finalCondition, condition.businessDescription || null);

                    // フォーマットに追加する処理
                    if (
                      addFormat &&
                      finalCondition.businessDescription &&
                      finalCondition.businessDescription.trim().length > 0
                    ) {
                      addBusinessDescriptionFormat({
                        description: finalCondition.businessDescription,
                      })
                        .then(() => {
                          enqueueToast('フォーマットを登録しました', 'success');
                        })
                        .catch((error) => {
                          const message = getApiErrorMessage(error);
                          enqueueToast(
                            `フォーマットの登録に失敗しました。${message.text}`,
                            'error'
                          );
                        });
                    }
                    // addFormatをリセット
                    setAddFormat(false);
                  }
                }}
              >
                条件を保存する
              </Button>
            )}
            <Button
              className={styles.submitButton}
              onClick={() => {
                const condition = additionalFilterCondition;
                if (condition) {
                  const addCondition = {
                    ...condition,
                    keywords: condition.keywords
                      ? condition.keywords.split(/\s+/).filter((keyword) => keyword.trim() !== '')
                      : undefined,
                    orKeywords: condition.orKeywords
                      ? condition.orKeywords.split(/\s+/).filter((keyword) => keyword.trim() !== '')
                      : undefined,
                    notKeywords: condition.notKeywords
                      ? condition.notKeywords
                          .split(/\s+/)
                          .filter((keyword) => keyword.trim() !== '')
                      : undefined,
                    procedureTypeGroups: condition.procedureTypeGroups,
                    prefectures: condition.prefectures,
                    organizationNameArray: condition.organizationName
                      ? condition.organizationName
                          .split(/[,\s]+/)
                          .filter((name) => name.trim() !== '')
                      : undefined,
                    bidCompanyName: condition.bidCompanyName,
                    useSynonymSearch: condition.useSynonymSearch,
                    noQualification: condition.noQualification,
                  };

                  searchProjects({ ...projectSearchParams, ...addCondition });
                  updateBusinessDescription(condition.businessDescription || null);
                  setIsModalOpen(false);
                  setAddFormat(false); // 検索実行時にaddFormatをリセット
                }
              }}
            >
              検索する
            </Button>
          </Box>
        }
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setAddFormat(false); // モーダルを閉じたときにaddFormatをリセット
        }}
        modalRef={additionalFilterFormRef}
      />
      {selectedSearchFilterPresetId && (
        <PresetEditDialog
          isOpen={isPresetEditDialogOpen}
          onClose={() => setIsPresetEditDialogOpen(false)}
          presetLists={searchFilterPresets}
          newPreset={getSearchFilterPresetFilter(projectSearchParams)}
          editPresetId={selectedSearchFilterPresetId}
          onCreatePreset={() => {
            refreshPresets();
            setSelectedSearchFilterPresetId(undefined);
          }}
          onEditPreset={(_preset) => {
            refreshPresets();
          }}
        />
      )}

      <AppOverlayModal
        title={'保存条件の登録'}
        contentComponent={
          <PresetCreateForm
            onCancel={() => {
              setIsPresetModalOpen(false);
            }}
            onSaved={() => {
              setIsPresetModalOpen(false);
              refreshPresets();
            }}
            initPreset={{
              filter: getSearchFilterPresetFilter(projectSearchParams),
              projectType: ProjectType.PROJECT,
              title: '',
              notificationRequired: false,
            }}
          />
        }
        isOpen={isPresetModalOpen}
        onClose={() => {
          setIsPresetModalOpen(false);
        }}
      />
      <AppOverlayModal
        title={'保存条件'}
        contentComponent={<SearchFilterPresetList />}
        isOpen={isPresetListModalOpen}
        onClose={() => {
          setIsPresetListModalOpen(false);
        }}
      />
      <div className={styles.inputContainer} ref={suggestionsRef}>
        <Box
          className={
            styles.projectInputBox +
            (showSuggestions
              ? ` ${styles.projectInputActiveBox}`
              : ` ${styles.projectInputInactiveBox}`)
          }
        >
          <span className='material-icons-outlined' translate='no' aria-hidden='true'>
            search
          </span>

          <SuggestionChipList
            showSuggestions={showSuggestions}
            inputChips={chips}
            onClickClose={(chip) => {
              const updatedParams = getUpdatedParamsAfterChipRemoval(
                chip,
                chips,
                projectSearchParams
              );
              setProjectSearchParams(updatedParams);
              inputRef.current?.focus();

              // updateProjectSearchParamsを使用してURLと状態を同期
              updateProjectSearchParams({
                ...updatedParams,
                page: searchParams.page,
                ...(searchParams.tab && { tab: searchParams.tab }),
              });
            }}
            onClickValues={() => inputRef.current?.focus()}
          >
            <input
              ref={inputRef}
              id={PROJECT_SEARCH_INPUT}
              autoComplete='off'
              type='text'
              className={styles.projectInput}
              placeholder='検索ワードを入力。スペース（ ）で複数ワードの検索ができます。'
              value={value}
              onFocus={handleInputFocus}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  searchProjects(projectSearchParams);
                  updateBusinessDescription(businessDescription || null);
                } else if (e.key === 'Backspace' && value.length === 0) {
                  // 一番後ろのchipを削除する
                  const lastChip = chips[chips.length - 1];
                  if (!lastChip) return;

                  if (chips.length === 1) {
                    setSelectedSearchFilterPresetId(undefined);
                  }

                  const updatedParams = getUpdatedParamsAfterChipRemoval(
                    lastChip,
                    chips,
                    projectSearchParams
                  );
                  setProjectSearchParams(updatedParams);

                  // updateProjectSearchParamsを使用してURLと状態を同期
                  updateProjectSearchParams({
                    ...updatedParams,
                    page: searchParams.page,
                    ...(searchParams.tab && { tab: searchParams.tab }),
                  });
                }
              }}
            />
          </SuggestionChipList>

          <Box className={styles.rightSlotBox}>
            <Box>
              {showSuggestions ? (
                <Flex
                  direction='row'
                  style={{ gap: '16px' }}
                  className={styles.projectInputActiveButtonBox}
                >
                  {(value.length !== 0 || chips.length > 0) && (
                    <FilterClearButton
                      onClick={(e) => {
                        e.stopPropagation();
                        const clearedParams = {};
                        setProjectSearchParams(clearedParams);
                        setBusinessDescription(null);
                        setSelectedSearchFilterPresetId(undefined);
                        setValue('');
                        setAdditionalFilterCondition(initialAdditionalFilterCondition);
                        updateBusinessDescription(null);
                        // updateProjectSearchParamsを使用してURLと状態を同期
                        updateProjectSearchParams({
                          page: 1,
                          ...(searchParams.tab && { tab: searchParams.tab }),
                        });
                      }}
                    />
                  )}
                </Flex>
              ) : null}
            </Box>
          </Box>
        </Box>
        {showSuggestions && (
          <Box
            className={styles.suggestions}
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
              if (e.key === 'Enter') {
                searchProjects(projectSearchParams);
                updateBusinessDescription(businessDescription || null);
              } else if (e.key === 'Backspace') {
                inputRef.current?.focus();
              } else if (e.key !== 'Tab' && e.key.length === 1) {
                inputRef.current?.focus();
              }
            }}
          >
            <div className={styles.suggestionList}>
              <AllSuggestions
                isLogin={isLogin}
                text={value}
                isLoading={isLoading}
                suggestions={suggestions?.suggestions || null}
                onAddSuggestions={(params, overwrite) => {
                  const newParams = addSuggestions(params, overwrite);
                  setProjectSearchParams(newParams);
                  setValue('');
                }}
                onSelectedPreset={(presetId) => {
                  setSelectedSearchFilterPresetId(presetId);
                  const preset = searchFilterPresets.find((p) => p.id === presetId);
                  if (preset) {
                    setAdditionalFilterCondition(convertPresetToAdditionalFilterCondition(preset));
                  }
                }}
                searchFilterPresets={searchFilterPresets}
                onClickPresetListButton={() => {
                  if (!isLogin) {
                    openCta();
                    return;
                  }
                  setIsPresetListModalOpen(true);
                }}
                selectedPresetId={selectedSearchFilterPresetId}
              />
              <div className={styles.suggestionButtonContainer}>
                <Button
                  className={styles.addDetailButton}
                  onClick={() => {
                    setAdditionalFilterCondition(
                      convertProjectSearchParamsToAdditionalFilterCondition(
                        projectSearchParams,
                        businessDescription || undefined
                      )
                    );
                    setIsModalOpen(true);
                  }}
                >
                  <Text>詳細な条件を追加する</Text>
                  <span className='material-icons-outlined' aria-hidden='true'>
                    add
                  </span>
                </Button>
                <Button
                  className={styles.searchButton}
                  onClick={() => {
                    searchProjects(projectSearchParams);
                    updateBusinessDescription(businessDescription || null);
                  }}
                >
                  <Text>検索する</Text>
                </Button>
              </div>
            </div>
          </Box>
        )}
      </div>
    </>
  );
}
