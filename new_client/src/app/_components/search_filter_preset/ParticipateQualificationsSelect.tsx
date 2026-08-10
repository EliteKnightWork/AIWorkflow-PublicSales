'use client';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { ChipList } from '@/app/(content)/management/_components/chipList/ChipList';
import type { ParticipateQualificationSearchParams } from '@/app/(content)/mypage/types';
import { convertParamsToChips } from '@/app/(content)/mypage/utils';
import { useParticipateQualifications } from '@/hooks/useParticipateQualifications';
import styles from './styles.module.css';

type props = {
  types: string[];
  prefectures: string[] | undefined;
  qualificationIds: number[] | undefined;
  gradeIds: number[] | undefined;
  noQualification: boolean | undefined;
  onOpenQualificationsList: () => void;
};

export function ParticipateQualificationsSelect({
  types,
  prefectures,
  qualificationIds,
  gradeIds,
  noQualification,
  onOpenQualificationsList,
}: props) {
  const [chipStrings, setChipStrings] = useState<string[]>([]);

  // 選択済み資格と等級に関連するデータを取得
  const { data: qualifications } = useParticipateQualifications({
    ids: qualificationIds,
    gradeIds: gradeIds,
  });

  useEffect(() => {
    const params: ParticipateQualificationSearchParams = {
      participateQualificationTypes: types,
      participateQualificationPrefectures: prefectures,
      participateQualificationIds: qualificationIds,
      participateQualificationGradeIds: gradeIds,
      noQualification: noQualification,
    };
    const chipStrings = convertParamsToChips(params, qualifications || []);
    setChipStrings(chipStrings);
  }, [qualifications, types, prefectures, qualificationIds, gradeIds, noQualification]);

  return (
    <Box className={styles.formBox}>
      <Text className={styles.formTitle}>入札参加資格</Text>
      <Flex direction='column'>
        <Button
          className={styles.whiteSelect}
          onClick={onOpenQualificationsList}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {chipStrings.length > 0 ? (
            <ChipList inputChips={chipStrings} />
          ) : (
            <span style={{ fontSize: '14px' }}>入力してください</span>
          )}

          <span
            className='material-icons'
            style={{ fontSize: '20px', color: 'var(--text-color-secondary)' }}
          >
            keyboard_arrow_right
          </span>
        </Button>
        <Box className={styles.information}>
          <Text>※2025年8月以降の案件が対象です</Text>
        </Box>
      </Flex>
    </Box>
  );
}
