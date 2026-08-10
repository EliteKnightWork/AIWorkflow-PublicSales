import { Box, Button, Skeleton, Text } from '@radix-ui/themes';
import { useEffect, useMemo, useState } from 'react';
import {
  type ParticipateQualification,
  type ParticipateQualificationGradesItem,
  ParticipateQualificationParticipateQualificationType,
} from '@/api/generated/models';
import { ChipList } from '@/app/(content)/management/_components/chipList/ChipList';
import { AppCheckbox } from '@/components/checkbox/AppCheckbox';
import { useParticipateQualifications } from '@/hooks/useParticipateQualifications';
import { displayQualificationName } from '@/utils/participateQualificationUtils';
import { prefecturesWithRegionList } from '@/utils/regionUtils';
import { ParticipateQualificationTypes } from '../../constants';
import type { ParticipateQualificationSearchParams } from '../../types';
import { convertParamsToChips } from '../../utils';
import styles from './styles.module.css';
import type { SelectableQualificationType } from './types';

type Props = {
  types: string[];
  prefectures: string[] | undefined;
  qualificationIds: number[] | undefined;
  gradeIds: number[] | undefined;
  noQualification?: boolean;
  hideNoQualification?: boolean;
  onSelect: (qualificationParams: ParticipateQualificationSearchParams) => void;
  onCancel: () => void;
  selectableTypes?: SelectableQualificationType[]; // 選択可能な資格種別を制限する場合に使用
};

type SearchFilterQualificationsDisplayListPath = {
  type: ParticipateQualificationParticipateQualificationType | null;
  region: string | null;
  prefecture: string | null;
  qualification: number | null;
};

type SearchFilterQualificationsDisplayList = {
  regions: string[] | null;
  prefectures: { id: string; name: string }[] | null;
  qualifications: ParticipateQualification[] | null;
  grades: ParticipateQualificationGradesItem[] | null;
};

export const SearchFilterQualificationsList = ({
  types,
  prefectures,
  qualificationIds,
  gradeIds,
  noQualification = undefined,
  // biome-ignore lint/correctness/noUnusedFunctionParameters: interface互換のため未使用
  hideNoQualification = false,
  onSelect,
  onCancel,
  selectableTypes = ['type', 'prefecture', 'qualification', 'grade'],
}: Props) => {
  // メインとなる状態変数
  const [selectedParams, setSelectedParams] = useState<ParticipateQualificationSearchParams>({
    participateQualificationTypes: types || undefined,
    participateQualificationPrefectures: prefectures || undefined,
    participateQualificationIds: qualificationIds || undefined,
    participateQualificationGradeIds: gradeIds || undefined,
    noQualification: noQualification || undefined,
  });

  // 取得済みの資格情報を保持する状態
  const [loadedQualifications, setLoadedQualifications] = useState<ParticipateQualification[]>([]);

  // 選択済み資格と等級に関連するデータを取得
  const { data: selectedQualifications } = useParticipateQualifications({
    ids: selectedParams.participateQualificationIds,
    gradeIds: selectedParams.participateQualificationGradeIds,
  });

  // チップ表示用の文字列
  const [chipStrings, setChipStrings] = useState<string[]>([]);

  // リストパスの状態変数
  const [displayListPath, setDisplayListPath] = useState<SearchFilterQualificationsDisplayListPath>(
    {
      type: null,
      region: null,
      prefecture: null,
      qualification: null,
    }
  );

  const [displayList, setDisplayList] = useState<SearchFilterQualificationsDisplayList>({
    regions: null,
    prefectures: null,
    qualifications: null,
    grades: null,
  });

  // 検索ワードの状態
  const [searchWord, _setSearchWord] = useState<string>('');

  // selectableTypes に応じて選択可否を判定
  const selectableMap = useMemo(
    () => ({
      type: selectableTypes.includes('type'),
      prefecture: selectableTypes.includes('prefecture'),
      qualification: selectableTypes.includes('qualification'),
      grade: selectableTypes.includes('grade'),
    }),
    [selectableTypes]
  );

  // selectedParamsが変更されたらチップ表示を更新
  useEffect(() => {
    // selectedQualificationsがローディング中の場合は何もしない
    if (selectedQualifications === undefined) {
      if (
        selectedParams.participateQualificationGradeIds ||
        selectedParams.participateQualificationIds
      ) {
        return;
      }
    }

    const chips = convertParamsToChips(selectedParams, selectedQualifications || []);
    setChipStrings(chips);
  }, [selectedParams, selectedQualifications]);

  // 表示用の資格リストデータ一覧
  const { data: displayListQualifications } = useParticipateQualifications({
    types:
      displayListPath.type &&
      displayListPath.type !== ParticipateQualificationParticipateQualificationType.都道府県
        ? [displayListPath.type]
        : undefined,
    prefectures: displayListPath.prefecture ? [displayListPath.prefecture] : undefined,
  });

  // 表示パスとAPIレスポンスに基づいて表示リストを更新
  useEffect(() => {
    const list: SearchFilterQualificationsDisplayList = {
      regions: null,
      prefectures: null,
      qualifications: null,
      grades: null,
    };

    // 地域リストの設定
    if (displayListPath.type === ParticipateQualificationParticipateQualificationType.都道府県) {
      list.regions = prefecturesWithRegionList.map((region) => region.name);
    }

    // 都道府県リストの設定
    if (displayListPath.region) {
      const region = displayListPath.region;
      list.prefectures = prefecturesWithRegionList
        .filter((r) => r.name === region)
        .flatMap((r) => r.prefectures);
    }

    if (displayListQualifications) {
      if (displayListPath.type === ParticipateQualificationParticipateQualificationType.官公庁) {
        list.grades = displayListQualifications.flatMap((q) => q.grades);
      } else if (
        displayListPath.type === ParticipateQualificationParticipateQualificationType.都道府県
      ) {
        list.qualifications = displayListQualifications;
      } else if (
        displayListPath.type === ParticipateQualificationParticipateQualificationType.外郭団体 ||
        displayListPath.type === ParticipateQualificationParticipateQualificationType.その他
      ) {
        list.qualifications = displayListQualifications;
      }

      // 特定の資格が選択された場合、その等級を表示
      if (displayListPath.qualification) {
        const qualification = displayListQualifications.find(
          (q) => q.id === displayListPath.qualification
        );
        if (qualification) {
          list.grades = qualification.grades;
        }
      }
    }

    setDisplayList(list);
  }, [displayListPath, displayListQualifications]);

  // ロード済みの資格情報を更新
  useEffect(() => {
    // loadedQualifications, selectedQualifications, displayListQualifications を重複なく結合
    const allQualifications = [
      ...new Set([
        ...(loadedQualifications || []),
        ...(selectedQualifications || []),
        ...(displayListQualifications || []),
      ]),
    ];
    setLoadedQualifications(allQualifications);
  }, [selectedQualifications, displayListQualifications]);

  // 検索ワードによるフィルタリング
  const filteredDisplayList = useMemo(() => {
    if (!searchWord) return displayList;

    const lowerSearchWord = searchWord.toLowerCase();
    return {
      regions: displayList.regions,
      prefectures: displayList.prefectures,
      qualifications:
        displayList.qualifications?.filter((qualification) =>
          qualification.name.toLowerCase().includes(lowerSearchWord)
        ) || null,
      grades: displayList.grades,
    };
  }, [displayList, searchWord]);

  // チップの削除処理
  const handleChipClose = (num: number) => {
    const types = [...(selectedParams.participateQualificationTypes || [])];
    const prefectures = [...(selectedParams.participateQualificationPrefectures || [])];
    const qualificationIds = [...(selectedParams.participateQualificationIds || [])];
    const gradeIds = [...(selectedParams.participateQualificationGradeIds || [])];

    // チップの表示順序を考慮して削除
    const chip = chipStrings[num];

    if (chip.startsWith('参加資格種別:')) {
      // 種別の削除
      const typeName = chip.replace('参加資格種別: ', '');
      const typeObj = ParticipateQualificationTypes.find((t) => t.name === typeName);
      if (typeObj) {
        const index = types.indexOf(typeObj.type);
        if (index > -1) {
          types.splice(index, 1);
        }
      }
    } else if (chip.startsWith('都道府県:')) {
      // 都道府県の削除
      const prefectureName = chip.replace('都道府県: ', '');
      const prefectureObj = prefecturesWithRegionList
        .flatMap((r) => r.prefectures)
        .find((p) => p.name === prefectureName);
      if (prefectureObj) {
        const index = prefectures.indexOf(prefectureObj.id);
        if (index > -1) {
          prefectures.splice(index, 1);
        }
      }
    } else if (chip.startsWith('参加資格:')) {
      // 資格の削除
      const qualificationName = chip.replace('参加資格: ', '');
      if (qualificationName === 'なし') {
        // 参加資格なしの削除
        setSelectedParams({
          ...selectedParams,
          noQualification: undefined,
        });
        return;
      }
      const qualification = selectedQualifications?.find(
        (q) => displayQualificationName(q) === qualificationName
      );
      if (qualification) {
        const index = qualificationIds.indexOf(qualification.id);
        if (index > -1) {
          qualificationIds.splice(index, 1);
        }
      }
    } else if (chip.includes(':')) {
      // 資格名: 等級名形式の削除
      const [qualificationName] = chip.split(':');
      const qualification = selectedQualifications?.find(
        (q) => displayQualificationName(q) === qualificationName.trim()
      );
      if (qualification) {
        // この資格のすべての等級を削除
        qualification.grades.forEach((grade) => {
          if (grade.gradeId) {
            const index = gradeIds.indexOf(grade.gradeId);
            if (index > -1) {
              gradeIds.splice(index, 1);
            }
          }
        });
      }
    }

    setSelectedParams({
      participateQualificationTypes: types.length > 0 ? types : undefined,
      participateQualificationPrefectures: prefectures.length > 0 ? prefectures : undefined,
      participateQualificationIds: qualificationIds.length > 0 ? qualificationIds : undefined,
      participateQualificationGradeIds: gradeIds.length > 0 ? gradeIds : undefined,
      noQualification: selectedParams.noQualification,
    });
  };

  // type が選択されているか判定する関数
  const isTypeChecked = (type: string) => {
    // types に含まれている場合は true
    if ((selectedParams.participateQualificationTypes || []).includes(type)) {
      return true;
    }

    return false;
  };

  // prefecture が選択されているか判定する関数
  const isPrefectureChecked = (prefectureId: string) => {
    // types に 都道府県 が含まれている場合は true
    if (isTypeChecked(ParticipateQualificationParticipateQualificationType.都道府県)) {
      return true;
    }

    // prefectures に prefectureId が含まれている場合は true
    if (
      (selectedParams.participateQualificationPrefectures || [])
        .map((p) => p.padStart(2, '0'))
        .includes(prefectureId.padStart(2, '0'))
    ) {
      return true;
    }

    return false;
  };

  // region が選択されているか判定する関数
  const isRegionChecked = (region: string) => {
    // region に属する全ての都道府県が 選択されている場合は true
    const regionData = prefecturesWithRegionList
      .find((r) => r.name === region)
      ?.prefectures.map((p) => p.id);

    if (regionData?.every((id) => isPrefectureChecked(id))) {
      return true;
    }

    return false;
  };

  // qualification が選択されているか判定する関数
  const isQualificationChecked = (qualification: ParticipateQualification) => {
    // types に qualification.participateQualificationType が含まれている場合は true
    if (isTypeChecked(qualification.participateQualificationType)) {
      return true;
    }

    // prefecture に qualification.lgCode が含まれている場合は true
    if (qualification.lgCode && isPrefectureChecked(qualification.lgCode)) {
      return true;
    }

    // ids に qualification.id が含まれている場合は true
    if ((selectedParams.participateQualificationIds || []).includes(qualification.id)) {
      return true;
    }

    // qualificationのgradeが全て選択されている場合は true
    if (
      qualification.grades.every(
        (g) => g.gradeId && selectedParams.participateQualificationGradeIds?.includes(g.gradeId)
      )
    ) {
      return true;
    }

    return false;
  };

  // grade が選択されているか判定する関数
  const isGradeChecked = (grade: ParticipateQualificationGradesItem) => {
    // 対応する qualification を取得
    const qualification = selectedQualifications?.find((q) =>
      q.grades.find((g) => g.gradeId === grade.gradeId)
    );

    // qualification が選択されている場合は true
    if (qualification && isQualificationChecked(qualification)) {
      return true;
    }

    // gradeIds に grade.gradeId が含まれている場合は true
    if (
      grade.gradeId &&
      (selectedParams.participateQualificationGradeIds || []).includes(grade.gradeId)
    ) {
      return true;
    }

    return false;
  };

  // inputのselectedParamsのデータの中で包含しているものを取り除きstateの更新を行う
  const updateSelectedParams = (udpateParams: ParticipateQualificationSearchParams) => {
    // 既存のparamsにaddとdeleteを適用
    const newParams = { ...udpateParams };

    // typesが選択されている場合の処理
    if (newParams.participateQualificationTypes) {
      for (const t of newParams.participateQualificationTypes) {
        loadedQualifications
          ?.filter((q) => q.participateQualificationType === t)
          .forEach((q) => {
            // 紐づく都道府県を削除
            if (q.lgCode) {
              newParams.participateQualificationPrefectures =
                newParams.participateQualificationPrefectures?.filter(
                  (p) => Number(p) !== Number(q.lgCode)
                );
            }
            // 紐づくqualificationを削除
            if (q.id) {
              newParams.participateQualificationIds = newParams.participateQualificationIds?.filter(
                (id) => id !== q.id
              );
            }
            // 紐づくgradesを削除
            if (q.grades) {
              q.grades.forEach((g) => {
                if (g.gradeId) {
                  newParams.participateQualificationGradeIds =
                    newParams.participateQualificationGradeIds?.filter((id) => id !== g.gradeId);
                }
              });
            }
          });
      }
    }

    // prefecturesが選択されている場合の処理
    if (newParams.participateQualificationPrefectures) {
      // prefecturesが選択されている場合の処理
      // 紐づくqualificationを削除
      for (const p of newParams.participateQualificationPrefectures) {
        loadedQualifications
          ?.filter((q) => Number(q.lgCode) === Number(p))
          .forEach((q) => {
            // qualificationを削除
            if (q.id) {
              newParams.participateQualificationIds = newParams.participateQualificationIds?.filter(
                (id) => id !== q.id
              );
            }
            // gradesを削除
            if (q.grades) {
              q.grades.forEach((g) => {
                if (g.gradeId) {
                  newParams.participateQualificationGradeIds =
                    newParams.participateQualificationGradeIds?.filter((id) => id !== g.gradeId);
                }
              });
            }
          });
      }
    }

    // idsが選択されている場合の処理
    if (newParams.participateQualificationIds) {
      // QualificationIds配下のgradesを削除
      for (const qualificationId of newParams.participateQualificationIds) {
        loadedQualifications
          ?.filter((qq) => qq.id === qualificationId)
          .forEach((q) => {
            if (q.grades) {
              q.grades.forEach((g) => {
                newParams.participateQualificationGradeIds =
                  newParams.participateQualificationGradeIds?.filter((id) => id !== g.gradeId);
              });
            }
          });
      }
    }
    const selectedParams = {
      participateQualificationTypes:
        newParams.participateQualificationTypes &&
        newParams.participateQualificationTypes.length > 0
          ? newParams.participateQualificationTypes
          : undefined,
      participateQualificationPrefectures:
        newParams.participateQualificationPrefectures &&
        newParams.participateQualificationPrefectures.length > 0
          ? newParams.participateQualificationPrefectures
          : undefined,
      participateQualificationIds:
        newParams.participateQualificationIds && newParams.participateQualificationIds.length > 0
          ? newParams.participateQualificationIds
          : undefined,
      participateQualificationGradeIds:
        newParams.participateQualificationGradeIds &&
        newParams.participateQualificationGradeIds.length > 0
          ? newParams.participateQualificationGradeIds
          : undefined,
      noQualification: newParams.noQualification,
    };
    setSelectedParams(selectedParams);
  };

  return (
    <Box className={styles.listBox}>
      <Box className={styles.selectedBox}>
        <Text className={styles.selectedTitle}>選択中の資格</Text>
        {chipStrings.length > 0 ? (
          <Box className={styles.chipListBox}>
            <ChipList inputChips={chipStrings} onClickClose={(id) => handleChipClose(id)} />
            <Button
              variant='ghost'
              className={styles.allClearButton}
              onClick={() => {
                setSelectedParams({
                  participateQualificationTypes: undefined,
                  participateQualificationPrefectures: undefined,
                  participateQualificationIds: undefined,
                  participateQualificationGradeIds: undefined,
                  noQualification: undefined,
                });
              }}
            >
              <Text>選択を解除</Text>
            </Button>
          </Box>
        ) : (
          <Text className={styles.noSelectedText}>こちらに選択された資格が表示されます</Text>
        )}
      </Box>
      <Box className={styles.selectBox}>
        {/* typeを跨いでの検索が難しいので一旦コメントアウト */}
        {/* <Box className={styles.inputBox}>
            <span className='material-icons-outlined' translate='no' aria-hidden='true'>
              search
            </span>
            <input
              className={styles.input}
              type='text'
              placeholder='入札参加資格を絞り込む'
              value={searchWord}
              onChange={(e) => {
                setDisplayListPath({
                  type: displayListPath.type,
                  region: displayListPath.region,
                  prefecture: displayListPath.prefecture,
                  qualification: null,
                });
                setSearchWord(e.target.value);
              }}
            />
          </Box> */}
        <Box className={styles.choicesBox}>
          {/* 一旦リリースしないのでコメントアウト */}
          {/* 参加資格なしのチェックボックス */}
          {/* <Box className={`${styles.listItemsBox} ${styles.typeListBox}`}>
            {!hideNoQualification && (
              <AppCheckbox
                label='なし'
                parentBoxClassName={styles.listItemsParentBox}
                parentBoxCheckedClassName={styles.parentBoxChecked}
                checkBoxCheckedClassName={styles.checkBoxChecked}
                checkedTextClassName={styles.checkedText}
                checkboxClassName={styles.checkbox}
                hideIndicator={!selectableMap.qualification}
                checked={selectedParams.noQualification || false}
                onChange={() => {
                  setSelectedParams({
                    participateQualificationTypes: undefined,
                    participateQualificationPrefectures: undefined,
                    participateQualificationIds: undefined,
                    participateQualificationGradeIds: undefined,
                    noQualification: !selectedParams.noQualification,
                  });
                }}
              />
            )}
          </Box> */}
          {/* typesの列表示 */}
          <Box className={`${styles.listItemsBox} ${styles.typeListBox}`}>
            {ParticipateQualificationTypes.map((item) => (
              <AppCheckbox
                key={item.name}
                label={item.name}
                parentBoxClassName={`${styles.listItemsParentBox} ${displayListPath.type === item.type ? styles.highlightedParentBox : ''}`}
                parentBoxCheckedClassName={styles.parentBoxChecked}
                checkBoxCheckedClassName={styles.checkBoxChecked}
                checkedTextClassName={styles.checkedText}
                checkboxClassName={styles.checkbox}
                hideIndicator={!selectableMap.type}
                checked={isTypeChecked(item.type)}
                onChange={() => {
                  const types = [...(selectedParams.participateQualificationTypes || [])];
                  if (types.includes(item.type)) {
                    types.splice(types.indexOf(item.type), 1);
                  } else {
                    types.push(item.type);

                    // パスをセット
                    setDisplayListPath({
                      type: displayListPath.type === item.type ? item.type : null,
                      region: displayListPath.type === item.type ? displayListPath.region : null,
                      prefecture:
                        displayListPath.type === item.type ? displayListPath.prefecture : null,
                      qualification:
                        displayListPath.type === item.type ? displayListPath.qualification : null,
                    });
                  }
                  updateSelectedParams({
                    participateQualificationTypes: types.length > 0 ? types : undefined,
                    participateQualificationPrefectures:
                      selectedParams.participateQualificationPrefectures,
                    participateQualificationIds: selectedParams.participateQualificationIds,
                    participateQualificationGradeIds:
                      selectedParams.participateQualificationGradeIds,
                    noQualification: undefined,
                  });
                }}
                separateTextAction={true}
                onClickText={() => {
                  setDisplayListPath({
                    type: item.type,
                    region: displayListPath.type === item.type ? displayListPath.region : null,
                    prefecture:
                      displayListPath.type === item.type ? displayListPath.prefecture : null,
                    qualification:
                      displayListPath.type === item.type ? displayListPath.qualification : null,
                  });
                }}
                rightComponent={
                  <span
                    className={`material-symbols-outlined ${styles.arrowIcon}`}
                    translate='no'
                    aria-hidden='true'
                  >
                    keyboard_arrow_right
                  </span>
                }
              />
            ))}
          </Box>
          {displayListPath.type ===
            ParticipateQualificationParticipateQualificationType.都道府県 && (
            <Box className={`${styles.listItemsBox} ${styles.regionListBox}`}>
              {filteredDisplayList.regions?.map((region) => (
                <AppCheckbox
                  key={region}
                  label={region}
                  parentBoxClassName={`${styles.listItemsParentBox} ${displayListPath.region === region ? styles.highlightedParentBox : ''}`}
                  parentBoxCheckedClassName={styles.parentBoxChecked}
                  checkBoxCheckedClassName={styles.checkBoxChecked}
                  checkedTextClassName={styles.checkedText}
                  checkboxClassName={styles.checkbox}
                  hideIndicator={!selectableMap.prefecture}
                  checked={isRegionChecked(region)}
                  disabled={
                    isRegionChecked(region) &&
                    selectedParams.participateQualificationTypes?.includes(
                      ParticipateQualificationParticipateQualificationType.都道府県
                    )
                  }
                  onChange={() => {
                    const prefectures = [
                      ...(selectedParams.participateQualificationPrefectures || []),
                    ];
                    const regionData = prefecturesWithRegionList
                      .find((r) => r.name === region)
                      ?.prefectures.map((p) => p.id);

                    if (regionData) {
                      if (regionData.every((id) => prefectures.includes(id))) {
                        // すべて選択されている場合は解除
                        regionData.forEach((id) => {
                          const index = prefectures.indexOf(id);
                          if (index > -1) {
                            prefectures.splice(index, 1);
                          }
                        });
                      } else {
                        // 一部または全く選択されていない場合はすべて選択
                        regionData.forEach((id) => {
                          if (!prefectures.includes(id)) {
                            prefectures.push(id);
                          }
                        });

                        // パスをセット
                        setDisplayListPath({
                          type: displayListPath.type,
                          region: displayListPath.region === region ? region : null,
                          prefecture:
                            displayListPath.region === region ? displayListPath.prefecture : null,
                          qualification:
                            displayListPath.region === region
                              ? displayListPath.qualification
                              : null,
                        });
                      }

                      updateSelectedParams({
                        participateQualificationTypes: selectedParams.participateQualificationTypes,
                        participateQualificationPrefectures:
                          prefectures.length > 0 ? prefectures : undefined,
                        participateQualificationIds: selectedParams.participateQualificationIds,
                        participateQualificationGradeIds:
                          selectedParams.participateQualificationGradeIds,
                        noQualification: undefined,
                      });
                    }
                  }}
                  separateTextAction={true}
                  onClickText={() => {
                    setDisplayListPath({
                      type: displayListPath.type,
                      region: region,
                      prefecture:
                        displayListPath.region === region ? displayListPath.prefecture : null,
                      qualification:
                        displayListPath.region === region ? displayListPath.qualification : null,
                    });
                  }}
                  rightComponent={
                    <span
                      className={`material-symbols-outlined ${styles.arrowIcon} ${isRegionChecked(region) ? styles.checkedArrowIcon : ''}`}
                      translate='no'
                      aria-hidden='true'
                    >
                      keyboard_arrow_right
                    </span>
                  }
                />
              ))}
            </Box>
          )}
          {displayListPath.type === ParticipateQualificationParticipateQualificationType.都道府県 &&
            displayListPath.region && (
              <Box className={`${styles.listItemsBox} ${styles.prefectureListBox}`}>
                {filteredDisplayList.prefectures?.map((prefecture) => (
                  <AppCheckbox
                    key={prefecture.id}
                    label={prefecture.name}
                    parentBoxClassName={`${styles.listItemsParentBox} ${displayListPath.prefecture === prefecture.id ? styles.highlightedParentBox : ''}`}
                    checkboxClassName={styles.checkbox}
                    parentBoxCheckedClassName={styles.parentBoxChecked}
                    checkBoxCheckedClassName={styles.checkBoxChecked}
                    checkedTextClassName={styles.checkedText}
                    hideIndicator={!selectableMap.prefecture}
                    checked={isPrefectureChecked(prefecture.id)}
                    disabled={
                      isPrefectureChecked(prefecture.id) &&
                      !selectedParams.participateQualificationPrefectures?.includes(prefecture.id)
                    }
                    onChange={() => {
                      const prefectures = [
                        ...(selectedParams.participateQualificationPrefectures || []),
                      ];
                      if (prefectures.includes(prefecture.id)) {
                        prefectures.splice(prefectures.indexOf(prefecture.id), 1);
                      } else {
                        prefectures.push(prefecture.id);

                        // パスをセット
                        setDisplayListPath({
                          type: displayListPath.type,
                          region: displayListPath.region,
                          prefecture:
                            displayListPath.prefecture === prefecture.id ? prefecture.id : null,
                          qualification:
                            displayListPath.prefecture === prefecture.id
                              ? displayListPath.qualification
                              : null,
                        });
                      }
                      updateSelectedParams({
                        participateQualificationTypes: selectedParams.participateQualificationTypes,
                        participateQualificationPrefectures:
                          prefectures.length > 0 ? prefectures : undefined,
                        participateQualificationIds: selectedParams.participateQualificationIds,
                        participateQualificationGradeIds:
                          selectedParams.participateQualificationGradeIds,
                        noQualification: undefined,
                      });
                    }}
                    separateTextAction={true}
                    onClickText={() => {
                      setDisplayListPath({
                        type: displayListPath.type,
                        region: displayListPath.region,
                        prefecture: prefecture.id,
                        qualification:
                          displayListPath.prefecture === prefecture.id
                            ? displayListPath.qualification
                            : null,
                      });
                    }}
                    rightComponent={
                      <span
                        className={`material-symbols-outlined ${styles.arrowIcon} ${isPrefectureChecked(prefecture.id) ? styles.checkedArrowIcon : ''}`}
                        translate='no'
                        aria-hidden='true'
                      >
                        keyboard_arrow_right
                      </span>
                    }
                  />
                ))}
              </Box>
            )}
          {displayListPath.type &&
            (displayListPath.type ===
              ParticipateQualificationParticipateQualificationType.外郭団体 ||
              displayListPath.type ===
                ParticipateQualificationParticipateQualificationType.その他 ||
              (displayListPath.type ===
                ParticipateQualificationParticipateQualificationType.都道府県 &&
                displayListPath.prefecture)) && (
              <Box className={`${styles.listItemsBox} ${styles.qualificationListBox}`}>
                {filteredDisplayList.qualifications ? (
                  filteredDisplayList.qualifications.map((qualification) => (
                    <AppCheckbox
                      key={qualification.id}
                      label={displayQualificationName(qualification)}
                      parentBoxClassName={`${styles.listItemsParentBox} ${displayListPath.qualification === qualification.id ? styles.highlightedParentBox : ''}`}
                      checkboxClassName={styles.checkbox}
                      parentBoxCheckedClassName={styles.parentBoxChecked}
                      checkBoxCheckedClassName={styles.checkBoxChecked}
                      checkedTextClassName={styles.checkedText}
                      hideIndicator={!selectableMap.qualification}
                      checked={isQualificationChecked(qualification)}
                      disabled={
                        isQualificationChecked(qualification) &&
                        !selectedParams.participateQualificationIds?.includes(qualification.id)
                      }
                      onChange={() => {
                        const qualificationIds = [
                          ...(selectedParams.participateQualificationIds || []),
                        ];

                        if (qualificationIds.includes(qualification.id)) {
                          // 資格の選択を解除
                          qualificationIds.splice(qualificationIds.indexOf(qualification.id), 1);
                        } else {
                          // 資格を選択
                          qualificationIds.push(qualification.id);

                          // パスをセット
                          setDisplayListPath({
                            type: displayListPath.type,
                            region: displayListPath.region,
                            prefecture: displayListPath.prefecture,
                            qualification:
                              displayListPath.qualification === qualification.id
                                ? qualification.id
                                : null,
                          });
                        }

                        updateSelectedParams({
                          participateQualificationTypes:
                            selectedParams.participateQualificationTypes,
                          participateQualificationPrefectures:
                            selectedParams.participateQualificationPrefectures,
                          participateQualificationIds:
                            qualificationIds.length > 0 ? qualificationIds : undefined,
                          participateQualificationGradeIds:
                            selectedParams.participateQualificationGradeIds,
                          noQualification: undefined,
                        });
                      }}
                      separateTextAction={true}
                      onClickText={() => {
                        setDisplayListPath({
                          type: displayListPath.type,
                          region: displayListPath.region,
                          prefecture: displayListPath.prefecture,
                          qualification: qualification.id,
                        });
                      }}
                      rightComponent={
                        <span
                          className={`material-symbols-outlined ${styles.arrowIcon} ${isQualificationChecked(qualification) ? styles.checkedArrowIcon : ''}`}
                          translate='no'
                          aria-hidden='true'
                        >
                          keyboard_arrow_right
                        </span>
                      }
                    />
                  ))
                ) : (
                  <>
                    <Skeleton className={styles.skeleton} />
                    <Skeleton className={styles.skeleton} />
                    <Skeleton className={styles.skeleton} />
                  </>
                )}
              </Box>
            )}
          {displayListPath.type &&
            (displayListPath.type === ParticipateQualificationParticipateQualificationType.官公庁 ||
              displayListPath.qualification) && (
              <Box className={`${styles.listItemsBox} ${styles.gradeListBox}`}>
                {filteredDisplayList.grades ? (
                  filteredDisplayList.grades.map((grade) => (
                    <AppCheckbox
                      key={grade.gradeId}
                      label={grade.name || '等級なし'}
                      parentBoxClassName={styles.listItemsParentBox}
                      checkboxClassName={styles.checkbox}
                      parentBoxCheckedClassName={styles.parentBoxChecked}
                      checkBoxCheckedClassName={styles.checkBoxChecked}
                      checkedTextClassName={styles.checkedText}
                      hideIndicator={!selectableMap.grade}
                      checked={isGradeChecked(grade)}
                      disabled={
                        isGradeChecked(grade) &&
                        !!grade.gradeId &&
                        !selectedParams.participateQualificationGradeIds?.includes(grade.gradeId)
                      }
                      onChange={() => {
                        if (!grade.gradeId) return;

                        const gradeIds = [
                          ...(selectedParams.participateQualificationGradeIds || []),
                        ];

                        if (isGradeChecked(grade)) {
                          // 等級の選択を解除
                          gradeIds.splice(gradeIds.indexOf(grade.gradeId), 1);
                        } else {
                          // 等級を選択
                          gradeIds.push(grade.gradeId);
                        }

                        updateSelectedParams({
                          participateQualificationTypes:
                            selectedParams.participateQualificationTypes,
                          participateQualificationPrefectures:
                            selectedParams.participateQualificationPrefectures,
                          participateQualificationIds: selectedParams.participateQualificationIds,
                          participateQualificationGradeIds:
                            gradeIds.length > 0 ? gradeIds : undefined,
                          noQualification: undefined,
                        });
                      }}
                    />
                  ))
                ) : (
                  <>
                    <Skeleton className={styles.skeleton} />
                    <Skeleton className={styles.skeleton} />
                    <Skeleton className={styles.skeleton} />
                  </>
                )}
              </Box>
            )}
        </Box>
      </Box>
      <Box className={styles.buttonsBox}>
        <Button className={styles.cancelButton} onClick={() => onCancel()}>
          <Text>キャンセル</Text>
        </Button>
        <Button className={styles.addButton} onClick={() => onSelect(selectedParams)}>
          <Text>検索条件に追加する</Text>
        </Button>
      </Box>
    </Box>
  );
};
