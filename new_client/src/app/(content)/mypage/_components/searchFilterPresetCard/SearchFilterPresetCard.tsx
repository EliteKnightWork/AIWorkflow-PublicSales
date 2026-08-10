import { Box, Button, Flex } from '@radix-ui/themes';
import { useEffect, useRef, useState } from 'react';
import {
  useDeleteSearchFilterPreset,
  useRecommendSearchFilterPreset,
  useSubscribeSearchFilterPreset,
  useUnrecommendSearchFilterPreset,
  useUnsubscribeSearchFilterPreset,
} from '@/api/generated/endpoints/search-filter-presets';
import type { GetFunctionalLimitations200, SearchFilterPreset } from '@/api/generated/models';
import { PresetInfoCard } from '@/app/(content)/_components/presetInfoCard/PresetInfoCard';
import { PresetEditForm, type PresetEditFormRef } from '@/app/(content)/_containers/preset-edit';
import AppOverlayModal from '@/components/appOverlayModal/AppOverlayModal';
import { AppCheckbox } from '@/components/checkbox/AppCheckbox';
import { useToast } from '@/context/ToastContext';
import styles from './styles.module.css';

type Props = {
  preset: SearchFilterPreset;
  functionalLimitations: GetFunctionalLimitations200;
  onChangeNotificationSetting: () => void;
  onChangeReccomendSetting: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export const SearchFilterPresetCard = ({
  preset,
  functionalLimitations,
  onChangeNotificationSetting,
  onChangeReccomendSetting,
  onEdit,
  onDelete,
}: Props) => {
  const [targetPreset, setTargetPreset] = useState(preset);
  const presetEditFormRef = useRef<PresetEditFormRef>(null);

  const { enqueueToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const deleteSearchFilterMutation = useDeleteSearchFilterPreset();
  const { mutate: subscribeMutate } = useSubscribeSearchFilterPreset();
  const { mutate: unsubscribeMutate } = useUnsubscribeSearchFilterPreset();
  const { mutate: recommendMutate } = useRecommendSearchFilterPreset();
  const { mutate: unrecommendMutate } = useUnrecommendSearchFilterPreset();

  useEffect(() => {
    setTargetPreset(preset);
  }, [preset]);

  return (
    <Box className={styles.presetCard}>
      <AppOverlayModal
        modalHeight={'82%'}
        title={preset.title ?? ''}
        contentComponent={
          <PresetEditForm
            ref={presetEditFormRef}
            onCancel={() => {
              setIsModalOpen(false);
            }}
            onSaved={(savedPreset) => {
              onChangeReccomendSetting();
              onEdit();
              setIsModalOpen(false);
              setTargetPreset({
                ...preset,
                recommended: savedPreset.recommended,
                businessDescription: savedPreset.businessDescription,
                filter: savedPreset.filter,
              });
            }}
            preset={targetPreset}
          />
        }
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
        footerComponent={
          <Box className={styles.footerBox}>
            <Button className={styles.cancelButton} onClick={() => setIsModalOpen(false)}>
              キャンセル
            </Button>
            <Button
              className={styles.saveButton}
              onClick={() => {
                presetEditFormRef.current?.handleSave();
              }}
            >
              条件を保存する
            </Button>
          </Box>
        }
      />
      <Flex direction={'row'} justify={'between'} className={styles.presetCardHeader}>
        <Flex direction={'row'} className={styles.presetCardHeaderCheckboxBox}>
          <AppCheckbox
            label={`この条件で配信する(残り${(functionalLimitations.maxSearchFilterPresetNotificationCount ?? 0) - (functionalLimitations.searchFilterPresetNotificationCount ?? 0)}件)`}
            checked={targetPreset.notificationRequired as boolean}
            disabled={
              (functionalLimitations.maxSearchFilterPresetNotificationCount ?? 0) -
                (functionalLimitations.searchFilterPresetNotificationCount ?? 0) <=
                0 && !targetPreset.notificationRequired
            }
            labelClassName={styles.presetCardHeaderCheckboxLabel}
            checkboxClassName={styles.presetCardHeaderCheckbox}
            onChange={(checked) => {
              const remain =
                (functionalLimitations.maxSearchFilterPresetNotificationCount ?? 0) -
                (functionalLimitations.searchFilterPresetNotificationCount ?? 0);
              if (remain <= 0 && checked) {
                return;
              }
              if (checked) {
                subscribeMutate(
                  { id: targetPreset.id?.toString() as string },
                  {
                    onSuccess: () => {
                      onChangeNotificationSetting();
                      enqueueToast('配信設定を追加しました', 'success');
                    },
                    onError: (_error) => {
                      enqueueToast('配信設定の追加に失敗しました', 'error');
                    },
                  }
                );
                setTargetPreset({ ...targetPreset, notificationRequired: true });
              } else {
                unsubscribeMutate(
                  { id: targetPreset.id?.toString() as string },
                  {
                    onSuccess: () => {
                      onChangeNotificationSetting();
                      enqueueToast('配信設定を解除しました', 'success');
                    },
                    onError: (_error) => {
                      enqueueToast('配信設定の解除に失敗しました', 'error');
                    },
                  }
                );
                setTargetPreset({ ...targetPreset, notificationRequired: false });
              }
            }}
          />
          <AppCheckbox
            label={`イチオシ条件に追加する(残り${(functionalLimitations.maxRecommendationCount ?? 0) - (functionalLimitations.recommendationCount ?? 0)}件)`}
            labelClassName={styles.presetCardHeaderCheckboxLabel}
            checkboxClassName={styles.presetCardHeaderCheckbox}
            disabled={
              (functionalLimitations.maxRecommendationCount ?? 0) -
                (functionalLimitations.recommendationCount ?? 0) <=
                0 && !targetPreset.recommended
            }
            checked={targetPreset.recommended ?? false}
            onChange={() => {
              if (
                (functionalLimitations.maxRecommendationCount ?? 0) -
                  (functionalLimitations.recommendationCount ?? 0) <=
                  0 &&
                !targetPreset.recommended
              ) {
                return;
              }

              if (targetPreset.recommended) {
                // イチオシ設定を解除
                unrecommendMutate(
                  { id: targetPreset.id?.toString() as string },
                  {
                    onSuccess: () => {
                      onChangeNotificationSetting();
                      enqueueToast('イチオシ条件の対象から除外しました', 'success');
                    },
                    onError: (_error) => {
                      enqueueToast('イチオシ条件の対象設定の除外に失敗しました', 'error');
                    },
                  }
                );
                setTargetPreset({ ...targetPreset, recommended: false });
              } else {
                // 事業内容を設定ずみであれば、イチオシ設定を追加
                if (targetPreset.businessDescription) {
                  recommendMutate(
                    { id: targetPreset.id?.toString() as string },
                    {
                      onSuccess: () => {
                        onChangeNotificationSetting();
                        enqueueToast('イチオシ条件の対象に追加しました', 'success');
                      },
                      onError: (_error) => {
                        enqueueToast('イチオシ条件の対象追加に失敗しました', 'error');
                      },
                    }
                  );
                  setTargetPreset({ ...targetPreset, recommended: true });
                } else {
                  setIsModalOpen(true);
                }
              }
            }}
          />
        </Flex>
        <Flex direction={'row'} gap={'2'}>
          <Button
            variant='ghost'
            className={styles.presetCardButton}
            onClick={() => setIsModalOpen(true)}
          >
            <span className={`material-icons-outlined ${styles.presetCardButtonIcon}`}>edit</span>{' '}
            編集する
          </Button>
          <Button
            variant='ghost'
            className={styles.presetCardButton}
            onClick={() => {
              if (window.confirm('本当に削除しますか？')) {
                deleteSearchFilterMutation.mutate(
                  { id: targetPreset.id as number },
                  {
                    onSuccess: () => {
                      onDelete();
                      enqueueToast('保存条件を削除しました', 'success');
                    },
                    onError: (_error) => {
                      enqueueToast('保存条件の削除に失敗しました', 'error');
                    },
                  }
                );
              }
            }}
          >
            <span className={`material-icons-outlined ${styles.presetCardButtonIcon}`}>delete</span>{' '}
            削除する
          </Button>
        </Flex>
      </Flex>
      <PresetInfoCard targetPreset={targetPreset} />
    </Box>
  );
};
