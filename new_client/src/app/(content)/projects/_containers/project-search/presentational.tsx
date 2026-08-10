'use client';
import { Box, Flex } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import {
  addSearchFilterPreset,
  updateSearchFilterPresetsId,
} from '@/api/generated/endpoints/search-filter-presets';
import type { SearchProjectsParams } from '@/api/generated/models';
import { SAVE_CONDITION_BUTTON } from '@/constants';
import { useSearchFilterPreset } from '@/context/SearchFilterPresetContext';
import { useToast } from '@/context/ToastContext';
import { useApiError } from '@/hooks/useApiError';
import { useParticipateQualifications } from '@/hooks/useParticipateQualifications';
import { getSearchFilterPresetFilter } from '@/lib/getSearchFilterPresetFilter';
import { useProjectSearch } from '../../_context/projectSearchContext';
import { useSelectedSearchFilterPreset } from '../../_context/selectedSearchFilterPreset';
import ProjectInput from './_components/projectInput/ProjectInput';
import ProjectInputWarning from './_components/projectInputWarning/ProjectInputWarning';
import DetailSearchButton from './DetailSearchButton/DetailSearchButton';
import { convertToSearchInputChip } from './model';
import OverwriteConditionConfirmDialog from './OverwriteConditionConfirmDialog/OverwriteConditionConfirmDialog';
import {
  calculateFilterDifference,
  type FilterDifference,
} from './OverwriteConditionConfirmDialog/utils';
import SaveConditionButton from './SaveConditionButton/SaveConditionButton';
import SaveConditionTitleDialog from './SaveConditionTitleDialog/SaveConditionTitleDialog';
import styles from './styles.module.css';

type Props = {
  isLogin: boolean;
};

export default function ProjectSearchPresentational({ isLogin }: Props) {
  const { projectSearchParams } = useProjectSearch();
  const { selectedSearchFilterPresetId, setSelectedSearchFilterPresetId, businessDescription } =
    useSelectedSearchFilterPreset();
  const { enqueueToast } = useToast();
  const { getApiErrorMessage } = useApiError();
  const { refreshPresets, presets } = useSearchFilterPreset();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isOverwriteModalOpen, setIsOverwriteModalOpen] = useState(false);
  const [tempSearchParams, setTempSearchParams] = useState<SearchProjectsParams | null>(null);
  const [tempBusinessDescription, setTempBusinessDescription] = useState<string | null>(null);
  // 保存後に詳細モーダルを再表示するためのフラグ
  const [shouldReopenModalOnSave, setShouldReopenModalOnSave] = useState(false);
  // 検索窓の実際の検索カード状態を管理
  const [currentSearchInputParams, setCurrentSearchInputParams] =
    useState<SearchProjectsParams>(projectSearchParams);
  const [currentBusinessDescription, setCurrentBusinessDescription] = useState<string | null>(
    businessDescription || null
  );

  // 選択された保存条件を取得
  const selectedPreset = selectedSearchFilterPresetId
    ? presets.find((preset) => preset.id === selectedSearchFilterPresetId)
    : undefined;

  // 参加資格データを取得
  const { data: qualifications } = useParticipateQualifications({
    ids: [
      ...new Set([
        ...(selectedPreset?.filter?.participateQualificationIds || []),
        ...(tempSearchParams?.participateQualificationIds ||
          currentSearchInputParams.participateQualificationIds ||
          []),
      ]),
    ],
    gradeIds: [
      ...new Set([
        ...(selectedPreset?.filter?.participateQualificationGradeIds || []),
        ...(tempSearchParams?.participateQualificationGradeIds ||
          currentSearchInputParams.participateQualificationGradeIds ||
          []),
      ]),
    ],
  });

  // 検索パラメータが存在するか判定
  const hasSearchParams =
    convertToSearchInputChip(projectSearchParams, qualifications || []).length > 0;

  // 差分の状態
  const [filterDifference, setFilterDifference] = useState<FilterDifference>({
    added: [],
    removed: [],
  });
  useEffect(() => {
    if (!selectedPreset?.filter) {
      setFilterDifference({ added: [], removed: [] });
    } else {
      const difference = calculateFilterDifference(
        selectedPreset.filter,
        getSearchFilterPresetFilter(tempSearchParams || currentSearchInputParams),
        qualifications || [],
        selectedPreset.businessDescription,
        tempBusinessDescription || currentBusinessDescription
      );
      setFilterDifference(difference);
    }
  }, [
    selectedPreset,
    tempSearchParams,
    currentSearchInputParams,
    tempBusinessDescription,
    currentBusinessDescription,
    qualifications,
  ]);

  const handleSaveConditionClick = () => {
    // 検索窓横のボタンから呼ばれた場合は、モーダルを再表示しない
    setShouldReopenModalOnSave(false);
    if (selectedSearchFilterPresetId && selectedPreset) {
      // 既存の保存条件が選択されている場合は上書き確認ダイアログを表示
      setIsOverwriteModalOpen(true);
    } else {
      // 新規保存の場合は通常のタイトル入力ダイアログを表示
      setIsSaveModalOpen(true);
    }
  };

  const handleSaveConditionWithParams = (
    params: SearchProjectsParams,
    businessDescription: string | null
  ) => {
    // 詳細モーダル内のボタンから呼ばれた場合は、モーダルを再表示する
    setShouldReopenModalOnSave(true);
    // 詳細条件を含む保存処理
    if (selectedSearchFilterPresetId && selectedPreset) {
      // 既存の保存条件が選択されている場合は上書き確認ダイアログを表示
      setIsOverwriteModalOpen(true);
    } else {
      // 新規保存の場合は通常のタイトル入力ダイアログを表示
      setIsSaveModalOpen(true);
    }
    // 一時的にprojectSearchParamsを更新するためのstate管理が必要
    setTempSearchParams(params);
    setTempBusinessDescription(businessDescription);
  };

  const handleSaveCondition = async (title: string) => {
    try {
      const paramsToUse = tempSearchParams || currentSearchInputParams;
      const descriptionToUse = tempBusinessDescription || currentBusinessDescription;
      const result = await addSearchFilterPreset({
        filter: getSearchFilterPresetFilter(paramsToUse),
        title,
        projectType: 'PROJECT',
        subscribed: false,
        businessDescription: descriptionToUse || null,
      });
      enqueueToast('検索条件を保存しました', 'success');
      // 新規作成したプリセットのIDをセット
      if (result?.id) {
        setSelectedSearchFilterPresetId(result.id);
      }
      // プリセットリストを更新
      refreshPresets();
      setIsSaveModalOpen(false);
      setTempSearchParams(null);
      setTempBusinessDescription(null);
      setTimeout(() => {
        const saveConditionButton = document.getElementById(
          SAVE_CONDITION_BUTTON
        ) as HTMLButtonElement;
        if (saveConditionButton) {
          saveConditionButton.disabled = true;
        }
      }, 100);
      if (shouldReopenModalOnSave) {
        setIsModalOpen(true);
      }
    } catch (error) {
      const message = getApiErrorMessage(error);
      enqueueToast(`保存条件の登録に失敗しました。${message.text}`, 'error');
    }
  };

  const handleOverwriteCondition = async () => {
    if (!selectedPreset?.id) return;

    try {
      const paramsToUse = tempSearchParams || currentSearchInputParams;
      const descriptionToUse = tempBusinessDescription || currentBusinessDescription;
      await updateSearchFilterPresetsId(selectedPreset.id, {
        filter: getSearchFilterPresetFilter(paramsToUse),
        title: selectedPreset.title || '',
        projectType: selectedPreset.projectType || 'PROJECT',
        subscribed: selectedPreset.notificationRequired || false,
        businessDescription: descriptionToUse || null,
        recommended: selectedPreset.recommended,
      });
      enqueueToast('保存条件を上書きしました', 'success');
      refreshPresets();
      setIsOverwriteModalOpen(false);
      setTempSearchParams(null);
      setTempBusinessDescription(null);
      // 条件保存後に詳細な条件でさがすモーダルを再度開く
      if (shouldReopenModalOnSave) {
        setIsModalOpen(true);
      }
    } catch (error) {
      const message = getApiErrorMessage(error);
      enqueueToast(`保存条件の上書きに失敗しました。${message.text}`, 'error');
    }
  };

  const handleSaveAsNew = () => {
    setIsOverwriteModalOpen(false);
    setIsSaveModalOpen(true);
  };

  // ダイアログを閉じる処理をまとめた関数
  const handleCloseDialog = () => {
    setIsSaveModalOpen(false);
    setIsOverwriteModalOpen(false);
    setTempSearchParams(null);
    setTempBusinessDescription(null);
    // ダイアログを閉じた後に詳細な条件でさがすモーダルを再度開く
    if (shouldReopenModalOnSave) {
      setIsModalOpen(true);
    }
  };

  return (
    <Flex direction={'column'} className={styles.projectSearchContainer}>
      <Flex className={styles.projectSearchBox}>
        <Box width='100%'>
          <ProjectInput
            isLogin={isLogin}
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
            selectedSearchFilterPresetId={selectedSearchFilterPresetId}
            setSelectedSearchFilterPresetId={setSelectedSearchFilterPresetId}
            onSaveCondition={handleSaveConditionWithParams}
            onSearchInputParamsChange={setCurrentSearchInputParams}
            onBusinessDescriptionChange={setCurrentBusinessDescription}
          />
        </Box>
        <Box className={styles.projectSearchSort}>
          {hasSearchParams ? (
            <SaveConditionButton
              onClick={handleSaveConditionClick}
              isSaved={
                selectedPreset &&
                filterDifference.added.length === 0 &&
                filterDifference.removed.length === 0
              }
              isLogin={isLogin}
            />
          ) : (
            <DetailSearchButton onClick={() => setIsModalOpen(true)} />
          )}
        </Box>
      </Flex>
      <Box className={styles.projectSearchWarningBox}>
        <ProjectInputWarning />
      </Box>
      <SaveConditionTitleDialog
        isOpen={isSaveModalOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveCondition}
      />
      <OverwriteConditionConfirmDialog
        isOpen={isOverwriteModalOpen}
        onClose={handleCloseDialog}
        onOverwrite={handleOverwriteCondition}
        onSaveAsNew={handleSaveAsNew}
        presetTitle={selectedPreset?.title || ''}
        filterDifference={filterDifference}
      />
    </Flex>
  );
}
