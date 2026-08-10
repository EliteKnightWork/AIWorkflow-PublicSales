'use client';
import { Box } from '@radix-ui/themes';
import { redirect, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useGetFunctionalLimitations } from '@/api/generated/endpoints/companies';
import { addSearchFilterPreset } from '@/api/generated/endpoints/search-filter-presets';
import type { SearchFilterPreset, SearchProjectsParams } from '@/api/generated/models';
import { NOT_DISPLAY_ONBOARDING_KEY } from '@/constants';
import { useSearchFilterPreset } from '@/context/SearchFilterPresetContext';
import { useToast } from '@/context/ToastContext';
import { useApiError } from '@/hooks/useApiError';
import { getSearchProjectsQueryParams } from '@/lib/getSearchProjectsQueryParams';
import { getLocalStorage, setLocalStorage } from '@/utils/localStorageUtil';
import { ProjectType } from '../../projects/types';
import BusinessDescriptionDialog from './_components/businessDescriptionDialog/BusinessDescriptionDialog';
import CompleteDialog from './_components/completeDialog/CompleteDialog';
import ConfirmDialog from './_components/confirmDialog/ConfirmDialog';
import OpeningDialog from './_components/openingDialog/OpeningDialog';
import SearchPresetFirst from './_components/searchPreset/SearchPresetFirst';
import SearchPresetSecond from './_components/searchPreset/SearchPresetSecond';
import { OnboardingStatus, OnboardingStatusFlow } from './types';

type Props = {
  redirectPath: string;
};

export const OnboardingContainer = ({ redirectPath }: Props) => {
  const router = useRouter();
  const { enqueueToast } = useToast();
  const { getApiErrorMessage } = useApiError();
  const { refetch: refetchFunctionalLimitations } = useGetFunctionalLimitations();
  const { refreshPresets: refetchSearchFilterPresets } = useSearchFilterPreset();

  const [preset, setPreset] = useState<SearchFilterPreset>({} as SearchFilterPreset);
  const [addSubscription, setAddSubscription] = useState<boolean>(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);

  // オンボーディングステータスの管理
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>(
    OnboardingStatus.OPENING
  );

  const onNext = (targetPreset?: SearchFilterPreset, addSubscription?: boolean) => {
    // 現在のステータスのインデックスを取得
    if (targetPreset) {
      setPreset(targetPreset);
    }
    if (addSubscription !== undefined) {
      setAddSubscription(addSubscription);
    }
    const currentIndex = OnboardingStatusFlow.indexOf(onboardingStatus);
    // 次のステータスをセット
    setOnboardingStatus(OnboardingStatusFlow[currentIndex + 1]);
  };

  const onBack = () => {
    const currentIndex = OnboardingStatusFlow.indexOf(onboardingStatus);
    setOnboardingStatus(OnboardingStatusFlow[currentIndex - 1]);
  };

  const onSkip = (isNotShownNext: boolean) => {
    if (isNotShownNext) {
      setLocalStorage(NOT_DISPLAY_ONBOARDING_KEY, true);
    }
    router.push(redirectPath);
  };

  const onCancel = () => {
    setIsCancelModalOpen(true);
  };

  const onSave = async () => {
    if (preset.title && preset.filter) {
      addSearchFilterPreset({
        filter: preset.filter,
        title: preset.title,
        projectType: ProjectType.PROJECT,
        businessDescription: preset.businessDescription,
        subscribed: addSubscription,
        recommended:
          !!preset.businessDescription &&
          preset.businessDescription.length > 0 &&
          ((!!preset.filter.keywords && preset.filter.keywords.length > 0) ||
            (!!preset.filter.orKeywords && preset.filter.orKeywords.length > 0)),
      })
        .then(() => {
          refetchFunctionalLimitations();
          refetchSearchFilterPresets();
          enqueueToast('保存条件を更新しました', 'success');
          const newParams: SearchProjectsParams = {
            page: 1,
            keywords: preset.filter?.keywords ?? undefined,
            orKeywords: preset.filter?.orKeywords ?? undefined,
            notKeywords: preset.filter?.notKeywords ?? undefined,
            procedureTypes: preset.filter?.procedureTypes ?? undefined,
            prefectures: preset.filter?.prefectures?.map((i) => String(i)),
            organizationNameArray: preset.filter?.organizations ?? undefined,
            publicationDateFrom: preset.filter?.publicationDateFrom ?? undefined,
            publicationDateTo: preset.filter?.publicationDateTo ?? undefined,
            plannedPriceFrom: preset.filter?.plannedPriceFrom ?? undefined,
            plannedPriceTo: preset.filter?.plannedPriceTo ?? undefined,
            isExperienceRequired: preset.filter?.isExperienceRequired ?? undefined,
            isOfficeRequired: preset.filter?.isOfficeRequired ?? undefined,
            projectSecurityQualifications:
              preset.filter?.projectSecurityQualifications ?? undefined,
            tenderOpeningDateFrom: preset.filter?.tenderOpeningDateFrom ?? undefined,
            tenderOpeningDateTo: preset.filter?.tenderOpeningDateTo ?? undefined,
          };
          const params = getSearchProjectsQueryParams(newParams);
          router.push(`/projects?${params}`);
        })
        .catch((error) => {
          const message = getApiErrorMessage(error);
          enqueueToast(`保存条件の登録に失敗しました。${message.text}`, 'error');
          router.push(redirectPath);
        });
    }
  };

  useEffect(() => {
    const val = getLocalStorage(NOT_DISPLAY_ONBOARDING_KEY);
    if (val) {
      redirect(redirectPath);
    }
  }, [redirectPath]);

  return (
    <Box>
      {isCancelModalOpen && (
        <ConfirmDialog
          onSubmit={() => {
            router.push(redirectPath);
          }}
          onCancel={() => {
            setIsCancelModalOpen(false);
          }}
          title='確認'
          description='これまでの入力内容を保存せず入力を中断します。よろしいですか？'
        />
      )}
      {onboardingStatus === OnboardingStatus.OPENING ? (
        <OpeningDialog onSubmit={onNext} onSkip={onSkip} />
      ) : onboardingStatus === OnboardingStatus.SEARCH_PRESET_FIRST_HALF ? (
        <SearchPresetFirst preset={preset} onNext={onNext} onClose={onCancel} />
      ) : onboardingStatus === OnboardingStatus.SEARCH_PRESET_SECOND_HALF ? (
        <SearchPresetSecond preset={preset} onNext={onNext} onBack={onBack} onClose={onCancel} />
      ) : onboardingStatus === OnboardingStatus.BUSINESS_DESCRIPTION ? (
        <BusinessDescriptionDialog
          preset={preset}
          onNext={onNext}
          onBack={onBack}
          onClose={onCancel}
        />
      ) : (
        <CompleteDialog onSubmit={onSave} />
      )}
    </Box>
  );
};
