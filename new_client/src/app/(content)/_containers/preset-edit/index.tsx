import { Box } from '@radix-ui/themes';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { addBusinessDescriptionFormat } from '@/api/generated/endpoints/business-description-formats';
import { useGetFunctionalLimitations } from '@/api/generated/endpoints/companies';
import { updateSearchFilterPresetsId } from '@/api/generated/endpoints/search-filter-presets';
import type { SearchFilterPreset } from '@/api/generated/models';
import { useToast } from '@/context/ToastContext';
import { useApiError } from '@/hooks/useApiError';
import { PresetForm } from '../../_components/presetForm/PresetForm';

type Props = {
  preset: SearchFilterPreset;
  onCancel: () => void;
  onSaved?: (presetFilter: SearchFilterPreset) => void;
};

export type PresetEditFormRef = {
  handleSave: () => Promise<void>;
};

export const PresetEditForm = forwardRef<PresetEditFormRef, Props>(
  ({ preset, onCancel, onSaved }, ref) => {
    const { enqueueToast } = useToast();
    const { getApiErrorMessage } = useApiError();
    const { data: functionalLimitations, refetch: refreshFunctionalLimitations } =
      useGetFunctionalLimitations();
    const presetFormRef = useRef<HTMLDivElement>(null);

    const disableAddRecommend = () => {
      return (
        !preset.recommended &&
        (!functionalLimitations ||
          (functionalLimitations.maxRecommendationCount ?? 0) -
            (functionalLimitations.recommendationCount ?? 0) ===
            0)
      );
    };

    useImperativeHandle(ref, () => ({
      handleSave: async () => {
        if (presetFormRef.current) {
          const saveButton = presetFormRef.current.querySelector(
            'button[data-save-button]'
          ) as HTMLButtonElement;
          if (saveButton) {
            saveButton.click();
          }
        }
      },
    }));

    return (
      <Box ref={presetFormRef}>
        <PresetForm
          disableAddFormat={
            functionalLimitations
              ? (functionalLimitations.maxBusinessDescriptionFormatCount ?? 0) -
                  (functionalLimitations.businessDescriptionFormatCount ?? 0) <=
                0
              : true
          }
          preset={preset}
          onCancel={onCancel}
          onSave={async (targetPreset, addFormat) => {
            const promiseList = [];

            if (targetPreset.filter && targetPreset.id) {
              const isRecommend =
                !disableAddRecommend() &&
                !!targetPreset.businessDescription &&
                targetPreset.businessDescription.length > 0 &&
                ((!!targetPreset.filter.keywords && targetPreset.filter.keywords.length > 0) ||
                  (!!targetPreset.filter.orKeywords && targetPreset.filter.orKeywords.length > 0));

              promiseList.push(
                updateSearchFilterPresetsId(targetPreset.id, {
                  filter: targetPreset.filter,
                  title: targetPreset.title,
                  projectType: targetPreset.projectType,
                  subscribed: targetPreset.notificationRequired,
                  businessDescription: targetPreset.businessDescription,
                  recommended: isRecommend,
                })
                  .then(() => {
                    onSaved?.({ ...targetPreset, recommended: isRecommend });
                    enqueueToast('保存条件を更新しました', 'success');
                  })
                  .catch((error) => {
                    const message = getApiErrorMessage(error);
                    enqueueToast(`保存条件の更新に失敗しました。${message.text}`, 'error');
                  })
              );

              if (
                addFormat &&
                targetPreset.businessDescription &&
                targetPreset.businessDescription?.length > 0
              ) {
                addBusinessDescriptionFormat({
                  description: targetPreset.businessDescription,
                }).catch((error) => {
                  const message = getApiErrorMessage(error);
                  enqueueToast(`フォーマットの登録に失敗しました。${message.text}`, 'error');
                });
              }
            }
            await Promise.all(promiseList);
          }}
          refreshFunctionalLimitations={refreshFunctionalLimitations}
        />
      </Box>
    );
  }
);
