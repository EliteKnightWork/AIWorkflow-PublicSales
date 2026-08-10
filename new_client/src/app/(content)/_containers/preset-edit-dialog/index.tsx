import * as Dialog from '@radix-ui/react-dialog';
import { Box, Flex, IconButton, Text } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { useGetFunctionalLimitations } from '@/api/generated/endpoints/companies';
import {
  addSearchFilterPreset,
  updateSearchFilterPresetsId,
} from '@/api/generated/endpoints/search-filter-presets';
import type {
  SearchFilterPreset,
  SearchFilterPresetFilter,
  SearchFilterPresetInput,
} from '@/api/generated/models';
import { RoundButton } from '@/components/roundButton/RoundeButton';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import { getPrefectureName } from '@/utils/regionUtils';
import { ProjectType } from '../../projects/types';
import { ConfirmCreateDialog } from './confirmCreateDialog';
import styles from './styles.module.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  presetLists: SearchFilterPreset[];
  newPreset: SearchFilterPresetFilter;
  editPresetId: number;
  onEditPreset: (preset: SearchFilterPreset) => void;
  onCreatePreset: (preset: SearchFilterPresetInput) => void;
};

export const PresetEditDialog = ({
  isOpen,
  onClose,
  presetLists,
  newPreset,
  editPresetId,
  onEditPreset,
  onCreatePreset,
}: Props) => {
  const { enqueueToast } = useToast();
  const [oldPreset, setOldPreset] = useState<SearchFilterPreset | undefined>(undefined);
  const [presetTitle, setPresetTitle] = useState('');

  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [addConditions, setAddConditions] = useState<string[]>([]);
  const [removeConditions, setRemoveConditions] = useState<string[]>([]);
  const { data: functionalLimitations } = useGetFunctionalLimitations();

  const disableAddSubscribe = () => {
    return (
      !functionalLimitations ||
      (functionalLimitations.maxSearchFilterPresetNotificationCount ?? 0) -
        (functionalLimitations.searchFilterPresetNotificationCount ?? 0) ===
        0
    );
  };

  useEffect(() => {
    if (isOpen) {
      const oldPreset = presetLists.find((p) => p.id === editPresetId);
      if (!oldPreset || !oldPreset.filter) {
        // TODO: 通知
        enqueueToast('上書きする対象の保存条件が見つかりませんでした。', 'error');
        return;
      }
      setOldPreset(oldPreset);
      setPresetTitle(oldPreset.title ?? '');

      const diff = getConditionDiff(oldPreset.filter, newPreset);
      setAddConditions(diff.addConditions);
      setRemoveConditions(diff.removeConditions);
    }
  }, [isOpen]);

  const getConditionDiff = (old: SearchFilterPresetFilter, latest: SearchFilterPresetFilter) => {
    const addConditions: string[] = [];
    const removeConditions: string[] = [];

    // キーワードの差分
    for (const keyword of latest.keywords ?? []) {
      if (!old.keywords?.includes(keyword)) {
        addConditions.push(`キーワード: ${keyword}`);
      }
    }
    for (const keyword of old.keywords ?? []) {
      if (!latest.keywords?.includes(keyword)) {
        removeConditions.push(`キーワード: ${keyword}`);
      }
    }

    // ORキーワードの差分
    for (const keyword of latest.orKeywords ?? []) {
      if (!old.orKeywords?.includes(keyword)) {
        addConditions.push(`ORキーワード: ${keyword}`);
      }
    }
    for (const keyword of old.orKeywords ?? []) {
      if (!latest.orKeywords?.includes(keyword)) {
        removeConditions.push(`ORキーワード: ${keyword}`);
      }
    }

    // 除外キーワードの差分
    for (const keyword of latest.notKeywords ?? []) {
      if (!old.notKeywords?.includes(keyword)) {
        addConditions.push(`除外キーワード: ${keyword}`);
      }
    }
    for (const keyword of old.notKeywords ?? []) {
      if (!latest.notKeywords?.includes(keyword)) {
        removeConditions.push(`除外キーワード: ${keyword}`);
      }
    }

    // 都道府県の差分
    for (const pref of latest.prefectures ?? []) {
      if (!old.prefectures?.includes(pref)) {
        addConditions.push(`都道府県: ${getPrefectureName(pref)}`);
      }
    }
    for (const pref of old.prefectures ?? []) {
      if (!latest.prefectures?.includes(pref)) {
        removeConditions.push(`都道府県: ${getPrefectureName(pref)}`);
      }
    }

    // 発注機関名の差分
    for (const org of latest.organizations ?? []) {
      if (!old.organizations?.includes(org)) {
        addConditions.push(`発注機関: ${org}`);
      }
    }
    for (const org of old.organizations ?? []) {
      if (!latest.organizations?.includes(org)) {
        removeConditions.push(`発注機関: ${org}`);
      }
    }

    // 入札方式の差分
    for (const type of latest.procedureTypes ?? []) {
      if (!old.procedureTypes?.includes(type)) {
        addConditions.push(`入札方式: ${type}`);
      }
    }
    for (const type of old.procedureTypes ?? []) {
      if (!latest.procedureTypes?.includes(type)) {
        removeConditions.push(`入札方式: ${type}`);
      }
    }

    for (const type of latest.procedureTypeGroups ?? []) {
      if (!old.procedureTypeGroups?.includes(type)) {
        addConditions.push(`入札方式: ${type}`);
      }
    }
    for (const type of old.procedureTypeGroups ?? []) {
      if (!latest.procedureTypeGroups?.includes(type)) {
        removeConditions.push(`入札方式: ${type}`);
      }
    }

    // 公告日
    if (
      latest.publicationDateFrom !== old.publicationDateFrom &&
      (latest.publicationDateFrom !== undefined || old.publicationDateFrom !== undefined)
    ) {
      if (latest.publicationDateFrom) {
        addConditions.push(`公告日: ${latest.publicationDateFrom}~`);
      }
      if (old.publicationDateFrom) {
        removeConditions.push(`公告日: ${old.publicationDateFrom}~`);
      }
    }

    if (
      latest.publicationDateTo !== old.publicationDateTo &&
      (latest.publicationDateTo !== undefined || old.publicationDateTo !== undefined)
    ) {
      if (latest.publicationDateTo) {
        addConditions.push(`公告日: ~${latest.publicationDateTo}`);
      }
      if (old.publicationDateTo) {
        removeConditions.push(`公告日: ~${old.publicationDateTo}`);
      }
    }

    // 予定価格
    if (
      latest.plannedPriceFrom !== old.plannedPriceFrom &&
      (latest.plannedPriceFrom !== undefined || old.plannedPriceFrom !== undefined)
    ) {
      if (latest.plannedPriceFrom) {
        addConditions.push(`予定価格: ${latest.plannedPriceFrom}~`);
      }
      if (old.plannedPriceFrom) {
        removeConditions.push(`予定価格: ${old.plannedPriceFrom}~`);
      }
    }

    if (
      latest.plannedPriceTo !== old.plannedPriceTo &&
      (latest.plannedPriceTo !== undefined || old.plannedPriceTo !== undefined)
    ) {
      if (latest.plannedPriceTo) {
        addConditions.push(`予定価格: ~${latest.plannedPriceTo}`);
      }
      if (old.plannedPriceTo) {
        removeConditions.push(`予定価格: ~${old.plannedPriceTo}`);
      }
    }

    // 実績有無
    if (latest.isExperienceRequired !== old.isExperienceRequired) {
      if (latest.isExperienceRequired) {
        addConditions.push('実績有無: 有');
      }
      if (old.isExperienceRequired) {
        removeConditions.push('実績有無: 有');
      }
    }

    // 事業所要件の有無
    if (latest.isOfficeRequired !== old.isOfficeRequired) {
      if (latest.isOfficeRequired) {
        addConditions.push('事業所要件の有無: 有');
      }
      if (old.isOfficeRequired) {
        removeConditions.push('事業所要件の有無: 有');
      }
    }

    // 情報セキュリティ
    if (latest.projectSecurityQualifications !== old.projectSecurityQualifications) {
      if (latest.projectSecurityQualifications) {
        addConditions.push('情報セキュリティ: 有');
      }
      if (old.projectSecurityQualifications) {
        removeConditions.push('情報セキュリティ: 有');
      }
    }

    // 締切日
    if (latest.deadlineDaysRemaining !== old.deadlineDaysRemaining) {
      if (latest.deadlineDaysRemaining) {
        addConditions.push(`締切日: ${latest.deadlineDaysRemaining}日以上先`);
      }
      if (old.deadlineDaysRemaining) {
        removeConditions.push(`締切日: ${old.deadlineDaysRemaining}日以上先`);
      }
    }

    // 落札日
    if (
      latest.tenderOpeningDateFrom !== old.tenderOpeningDateFrom &&
      (latest.tenderOpeningDateFrom !== undefined || old.tenderOpeningDateFrom !== undefined)
    ) {
      if (latest.tenderOpeningDateFrom) {
        addConditions.push(`落札日: ${latest.tenderOpeningDateFrom}~`);
      }
      if (old.tenderOpeningDateFrom) {
        removeConditions.push(`落札日: ${old.tenderOpeningDateFrom}~`);
      }
    }

    if (
      latest.tenderOpeningDateTo !== old.tenderOpeningDateTo &&
      (latest.tenderOpeningDateTo !== undefined || old.tenderOpeningDateTo !== undefined)
    ) {
      if (latest.tenderOpeningDateTo) {
        addConditions.push(`落札日: ~${latest.tenderOpeningDateTo}`);
      }
      if (old.tenderOpeningDateTo) {
        removeConditions.push(`落札日: ~${old.tenderOpeningDateTo}`);
      }
    }

    return { addConditions, removeConditions };
  };
  const editPreset = async () => {
    const input = {
      filter: newPreset,
      title: presetTitle,
      projectType: oldPreset?.projectType,
      subscribed: oldPreset?.notificationRequired,
      businessDescription: oldPreset?.businessDescription,
      recommended: oldPreset?.recommended,
    };
    setLoading(true);
    await updateSearchFilterPresetsId(editPresetId, input)
      .then(() => {
        enqueueToast('保存条件を更新しました', 'success');
        onClose();
        onEditPreset({
          ...input,
          id: editPresetId,
        });
      })
      .catch((error) => {
        const message = getApiErrorMessage(error);
        enqueueToast(`保存条件の更新に失敗しました。${message.text}`, 'error');
      })
      .finally(() => setLoading(false));
  };

  const createPreset = async () => {
    const addSubscribe = !disableAddSubscribe();

    const preset = {
      filter: newPreset,
      title: presetTitle,
      projectType: ProjectType.PROJECT,
      subscribed: addSubscribe,
      businessDescription: '',
      recommended: false,
    };
    setLoading(true);
    await addSearchFilterPreset(preset)
      .then(() => {
        enqueueToast('保存条件を保存しました', 'success');
        if (!addSubscribe) {
          enqueueToast('案件配信設定数の上限を超えています', 'success');
        }
        onClose();
        onCreatePreset(preset);
      })
      .catch((error) => {
        const message = getApiErrorMessage(error);
        enqueueToast(`保存条件の保存に失敗しました。${message.text}`, 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <ConfirmCreateDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
        }}
        onConfirm={() => {
          setIsConfirmOpen(false);
          createPreset();
        }}
        preset={{
          filter: newPreset,
          title: presetTitle,
          projectType: ProjectType.PROJECT,
          notificationRequired: false,
          businessDescription: '',
          recommended: false,
        }}
      />
      <Dialog.Root open={isOpen && !isConfirmOpen} onOpenChange={() => {}}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content asChild>
            <Box className={styles.modal}>
              <Box className={styles.modalTitleBox}>
                <Dialog.Title className={styles.headerTitle}>
                  編集した保存条件を上書き保存しますか？
                </Dialog.Title>
                <IconButton
                  className={styles.headerClokseBtn}
                  variant='outline'
                  size='2'
                  onClick={() => onClose()}
                >
                  <span className={'material-icons'}>close</span>
                </IconButton>
              </Box>
              <Box className={styles.modalContentBox}>
                <Box className={styles.modalContent}>
                  <Box>
                    <input
                      className={styles.input}
                      type='text'
                      placeholder='保存条件タイトル'
                      value={presetTitle}
                      onChange={(e) => setPresetTitle(e.target.value)}
                    />
                  </Box>
                  <Flex direction={'column'} className={styles.conditionInfo}>
                    <Flex className={styles.removeConditions}>
                      <span className={`material-icons ${styles.errorIcon}`}>error</span>
                      <Flex direction={'column'}>
                        <Text className={styles.title}>削除した条件</Text>
                        <Flex className={styles.conditionChipList}>
                          {removeConditions.length === 0 && <Text>削除される条件がありません</Text>}

                          {removeConditions.map((c) => {
                            return (
                              <Box key={c} className={styles.conditionChip}>
                                {c}
                              </Box>
                            );
                          })}
                        </Flex>
                      </Flex>
                    </Flex>
                    <Flex className={styles.addConditions}>
                      <span className={`material-icons ${styles.errorIcon}`}>error</span>
                      <Flex direction={'column'}>
                        <Text className={styles.title}>追加した条件</Text>
                        <Flex className={styles.conditionChipList}>
                          {addConditions.length === 0 && <Text>追加される条件がありません</Text>}
                          {addConditions.map((c) => {
                            return (
                              <Box key={c} className={styles.conditionChip}>
                                {c}
                              </Box>
                            );
                          })}
                        </Flex>
                      </Flex>
                    </Flex>
                  </Flex>

                  <Flex justify={'center'} className={styles.buttonRow}>
                    <RoundButton
                      buttonClassName={styles.createButton}
                      hideIcon
                      text='新規で保存条件に追加する'
                      disabled={
                        loading ||
                        (addConditions.length === 0 &&
                          removeConditions.length === 0 &&
                          oldPreset?.title === presetTitle)
                      }
                      loading={loading}
                      onClick={() => {
                        if (oldPreset?.title === presetTitle) {
                          setIsConfirmOpen(true);
                          return;
                        }
                        createPreset();
                      }}
                    />
                    <RoundButton
                      buttonClassName={styles.editButton}
                      disabled={
                        loading ||
                        (addConditions.length === 0 &&
                          removeConditions.length === 0 &&
                          oldPreset?.title === presetTitle)
                      }
                      loading={loading}
                      hideIcon
                      text='上書き保存する'
                      onClick={() => {
                        editPreset();
                      }}
                    />
                  </Flex>
                </Box>
              </Box>
            </Box>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};
