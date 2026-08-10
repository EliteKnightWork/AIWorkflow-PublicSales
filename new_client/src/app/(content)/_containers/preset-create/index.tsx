import { addBusinessDescriptionFormat } from '@/api/generated/endpoints/business-description-formats';
import { useGetFunctionalLimitations } from '@/api/generated/endpoints/companies';
import { addSearchFilterPreset } from '@/api/generated/endpoints/search-filter-presets';
import type { SearchFilterPreset, SearchFilterPresetFilter } from '@/api/generated/models';
import { useToast } from '@/context/ToastContext';
import { useApiError } from '@/hooks/useApiError';
import { PresetForm } from '../../_components/presetForm/PresetForm';

type Props = {
  initPreset: SearchFilterPreset;
  onCancel: () => void;
  onSaved?: (presetFilter: SearchFilterPresetFilter) => void;
};

export const PresetCreateForm = ({ initPreset, onCancel, onSaved }: Props) => {
  const { enqueueToast } = useToast();
  const { getApiErrorMessage } = useApiError();

  const { data: functionalLimitations, refetch: refreshFunctionalLimitations } =
    useGetFunctionalLimitations();

  const disableAddRecommend = () => {
    return (
      !functionalLimitations ||
      (functionalLimitations.maxRecommendationCount ?? 0) -
        (functionalLimitations.recommendationCount ?? 0) ===
        0
    );
  };

  const disableAddSubscribe = () => {
    return (
      !functionalLimitations ||
      (functionalLimitations.maxSearchFilterPresetNotificationCount ?? 0) -
        (functionalLimitations.searchFilterPresetNotificationCount ?? 0) ===
        0
    );
  };

  return (
    <PresetForm
      disableAddFormat={
        functionalLimitations
          ? (functionalLimitations.maxBusinessDescriptionFormatCount ?? 0) -
              (functionalLimitations.businessDescriptionFormatCount ?? 0) <=
            0
          : true
      }
      preset={initPreset}
      onCancel={onCancel}
      onSave={async (preset, addFormat) => {
        const promiseList = [];

        if (preset.filter) {
          const addSubscribe = !disableAddSubscribe();

          promiseList.push(
            addSearchFilterPreset({
              filter: preset.filter,
              title: preset.title,
              projectType: preset.projectType,
              subscribed: addSubscribe,
              businessDescription: preset.businessDescription,
              recommended:
                !disableAddRecommend() &&
                !!preset.businessDescription &&
                preset.businessDescription.length > 0 &&
                ((!!preset.filter.keywords && preset.filter.keywords.length > 0) ||
                  (!!preset.filter.orKeywords && preset.filter.orKeywords.length > 0)),
            })
              .then(() => {
                onSaved?.(preset.filter as SearchFilterPresetFilter);
                enqueueToast('保存条件を作成しました', 'success');
                if (!addSubscribe) {
                  enqueueToast('案件配信設定数の上限を超えています', 'success');
                }
              })
              .catch((error) => {
                const message = getApiErrorMessage(error);
                enqueueToast(`保存条件の登録に失敗しました。${message.text}`, 'error');
              })
          );
        }

        if (addFormat && preset.businessDescription && preset.businessDescription?.length > 0) {
          promiseList.push(
            addBusinessDescriptionFormat({
              description: preset.businessDescription,
            }).catch((error) => {
              const message = getApiErrorMessage(error);
              enqueueToast(`フォーマットの登録に失敗しました。${message.text}`, 'error');
            })
          );
        }

        await Promise.all(promiseList);
      }}
      refreshFunctionalLimitations={refreshFunctionalLimitations}
    />
  );
};
