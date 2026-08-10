import { Box, Flex, Text } from '@radix-ui/themes';
import type { SearchFilterPreset } from '@/api/generated/models';
import { useParticipateQualifications } from '@/hooks/useParticipateQualifications';
import { getPrefectureNames } from '@/utils/regionUtils';
import type { ParticipateQualificationSearchParams } from '../../mypage/types';
import { convertParamsToChips } from '../../mypage/utils';
import styles from './styles.module.css';

type Props = {
  targetPreset: SearchFilterPreset;
};

export const PresetInfoCard = ({ targetPreset }: Props) => {
  // 参加資格用データ取得
  const { data: selectedQualifications } = useParticipateQualifications({
    ids: targetPreset.filter?.participateQualificationIds,
    gradeIds: targetPreset.filter?.participateQualificationGradeIds,
  });

  // 参加資格用パラメータ作成
  const qualificationParams: ParticipateQualificationSearchParams = {
    participateQualificationTypes: targetPreset.filter?.participateQualificationTypes,
    participateQualificationPrefectures: targetPreset.filter?.participateQualificationPrefectures,
    participateQualificationIds: targetPreset.filter?.participateQualificationIds,
    participateQualificationGradeIds: targetPreset.filter?.participateQualificationGradeIds,
    noQualification: targetPreset.filter?.noQualification,
  };

  // 参加資格用チップ作成
  const qualificationChips = convertParamsToChips(
    qualificationParams,
    selectedQualifications || []
  );

  return (
    <Flex direction={'column'} style={{ gap: 12 }}>
      <Text className={styles.presetTitle}>{targetPreset.title}</Text>

      <Flex direction={'row'} wrap={'wrap'} className={styles.presetTagListBox}>
        {/* キーワード */}
        {targetPreset.filter?.keywords && targetPreset.filter.keywords.length > 0 && (
          <Box className={styles.presetTag}>
            ANDワード:
            <Text className={styles.presetTagText}>{targetPreset.filter.keywords.join(', ')}</Text>
          </Box>
        )}

        {/* orキーワード */}
        {targetPreset.filter?.orKeywords && targetPreset.filter.orKeywords.length > 0 && (
          <Box className={styles.presetTag}>
            ORワード:
            <Text className={styles.presetTagText}>
              {targetPreset.filter.orKeywords.join(', ')}
            </Text>
          </Box>
        )}

        {/* 除外キーワード */}
        {targetPreset.filter?.notKeywords && targetPreset.filter.notKeywords.length > 0 && (
          <Box className={styles.presetTag}>
            NOTワード:
            <Text className={styles.presetTagText}>
              {targetPreset.filter.notKeywords.join(', ')}
            </Text>
          </Box>
        )}

        {/* 類義語検索 */}
        {targetPreset.filter?.useSynonymSearch && (
          <Box className={styles.presetTag}>
            類義語検索:
            <Text className={styles.presetTagText}>あり</Text>
          </Box>
        )}

        {/* 発注機関名 */}
        {targetPreset.filter?.organizations && targetPreset.filter.organizations.length > 0 && (
          <Box className={styles.presetTag}>
            発注機関名:
            <Text className={styles.presetTagText}>
              {targetPreset.filter.organizations.join(', ')}
            </Text>
          </Box>
        )}

        {/* 都道府県 */}
        {targetPreset.filter?.prefectures && targetPreset.filter.prefectures.length > 0 && (
          <Box className={styles.presetTag}>
            都道府県:
            <Text className={styles.presetTagText}>
              {getPrefectureNames(targetPreset.filter.prefectures).join(', ')}
            </Text>
          </Box>
        )}

        {/* 入札方式グループ */}
        {targetPreset.filter?.procedureTypeGroups &&
          targetPreset.filter.procedureTypeGroups.length > 0 && (
            <Box className={styles.presetTag}>
              入札方式グループ:
              <Text className={styles.presetTagText}>
                {targetPreset.filter.procedureTypeGroups.join(', ')}
              </Text>
            </Box>
          )}

        {/* 入札形式 */}
        {targetPreset.filter?.procedureTypes && targetPreset.filter.procedureTypes.length > 0 && (
          <Box className={styles.presetTag}>
            入札方式:
            <Text className={styles.presetTagText}>
              {targetPreset.filter.procedureTypes.join(', ')}
            </Text>
          </Box>
        )}

        {/* 検索範囲日付 */}
        {(targetPreset.filter?.publicationDateFrom || targetPreset.filter?.publicationDateTo) && (
          <Box className={styles.presetTag}>
            公告日範囲:
            <Text className={styles.presetTagText}>
              {targetPreset.filter.publicationDateFrom || ''}
              {targetPreset.filter.publicationDateFrom && targetPreset.filter.publicationDateTo
                ? ' 〜 '
                : ''}
              {targetPreset.filter.publicationDateTo || ''}
            </Text>
          </Box>
        )}

        {/* 予定価格 */}
        {targetPreset.filter?.plannedPriceFrom && (
          <Box className={styles.presetTag}>
            予定価格:
            <Text className={styles.presetTagText}>
              {targetPreset.filter.plannedPriceFrom.toLocaleString('ja-JP')}円~
            </Text>
          </Box>
        )}

        {targetPreset.filter?.plannedPriceTo && (
          <Box className={styles.presetTag}>
            予定価格:
            <Text className={styles.presetTagText}>
              ~{targetPreset.filter.plannedPriceTo.toLocaleString('ja-JP')}円
            </Text>
          </Box>
        )}

        {targetPreset.filter?.isExperienceRequired !== undefined &&
          targetPreset.filter?.isExperienceRequired !== null && (
            <Box className={styles.presetTag}>
              実績有無:
              <Text className={styles.presetTagText}>
                {targetPreset.filter.isExperienceRequired ? '有' : '無'}
              </Text>
            </Box>
          )}

        {targetPreset.filter?.isOfficeRequired !== undefined &&
          targetPreset.filter?.isOfficeRequired !== null && (
            <Box className={styles.presetTag}>
              事業所要件の有無:
              <Text className={styles.presetTagText}>
                {targetPreset.filter.isOfficeRequired ? '有' : '無'}
              </Text>
            </Box>
          )}

        {targetPreset.filter?.projectSecurityQualifications &&
          targetPreset.filter?.projectSecurityQualifications.length > 0 && (
            <Box className={styles.presetTag}>
              情報セキュリティ:
              <Text className={styles.presetTagText}>
                {targetPreset.filter.projectSecurityQualifications.join(', ')}
              </Text>
            </Box>
          )}

        {/* 締切日 */}
        {targetPreset.filter?.deadlineDaysRemaining && (
          <Box className={styles.presetTag}>
            締切日:
            <Text className={styles.presetTagText}>
              {targetPreset.filter.deadlineDaysRemaining}日以上先
            </Text>
          </Box>
        )}

        {/* 落札日範囲日付 */}
        {(targetPreset.filter?.tenderOpeningDateFrom ||
          targetPreset.filter?.tenderOpeningDateTo) && (
          <Box className={styles.presetTag}>
            落札日範囲:
            <Text className={styles.presetTagText}>
              {targetPreset.filter.tenderOpeningDateFrom || ''}
              {targetPreset.filter.tenderOpeningDateFrom && targetPreset.filter.tenderOpeningDateTo
                ? ' 〜 '
                : ''}
              {targetPreset.filter.tenderOpeningDateTo || ''}
            </Text>
          </Box>
        )}

        {/* 参加資格 */}
        {qualificationChips.length > 0 && (
          <Box className={styles.presetTag}>
            入札参加資格:
            <Text className={styles.presetTagText}>{qualificationChips.join(', ')}</Text>
          </Box>
        )}
      </Flex>
    </Flex>
  );
};
