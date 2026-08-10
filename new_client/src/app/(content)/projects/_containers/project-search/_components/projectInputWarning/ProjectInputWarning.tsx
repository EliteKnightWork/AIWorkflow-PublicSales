import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { ProjectStatusTab } from '@/api/generated/models';
import { useProjectList } from '@/app/(content)/projects/_context/projectListContext';
import { useProjectSearch } from '@/app/(content)/projects/_context/projectSearchContext';
import { OnlyAwardedProjectItems, OnlyProjectItems } from '@/app/(content)/projects/constants';
import { useParticipateQualifications } from '@/hooks/useParticipateQualifications';
import { convertToSearchInputChip, type SearchInputChip } from '../../model';
import styles from './styles.module.css';

export default function ProjectInputWarning() {
  const { loading } = useProjectList();
  const { projectSearchParams } = useProjectSearch();
  const [selectedTab, setSelectedTab] = useState<ProjectStatusTab | undefined>(undefined);

  // 参加資格データを取得
  const { data: qualifications } = useParticipateQualifications({
    ids: projectSearchParams.participateQualificationIds,
    gradeIds: projectSearchParams.participateQualificationGradeIds,
  });

  useEffect(() => {
    if (!loading) {
      setSelectedTab(projectSearchParams.tab);
    }
  }, [projectSearchParams, loading]);

  const [chips, setChips] = useState<SearchInputChip[]>([]);
  useEffect(() => {
    setChips(convertToSearchInputChip(projectSearchParams, qualifications || []));
  }, [projectSearchParams, qualifications]);

  const warnChips = chips.filter((chip) => {
    if (selectedTab === ProjectStatusTab.awarded) {
      return OnlyProjectItems.includes(chip.type);
    }
    if (selectedTab === ProjectStatusTab.open || selectedTab === ProjectStatusTab.closed) {
      return OnlyAwardedProjectItems.includes(chip.type);
    }
    return false;
  });

  if (!selectedTab || warnChips.length === 0) {
    return null;
  }

  return (
    <Flex className={styles.projectInputWarning} align={'center'} gap={'4'}>
      <span className={`material-icons ${styles.errorIcon}`}>error</span>
      <Flex direction={'column'} gap={'2'} className={styles.warningTextBox}>
        <Text className={styles.warningText}>
          {selectedTab === ProjectStatusTab.awarded
            ? '下記の条件は[落札案件]では適用できません。[受付中]、[受付終了]にのみご利用いただけます。'
            : '下記の条件は[受付中]、[受付終了]では適用できません。[落札案件]にのみご利用いただけます。'}
        </Text>
        <Flex>
          {warnChips.map((chip) => {
            return (
              <Box key={chip.value} className={styles.chip}>
                <Text>
                  {chip.keyName}：{chip.displayValue}
                </Text>
              </Box>
            );
          })}
        </Flex>
      </Flex>
      <Button
        className={styles.closeBtn}
        variant='ghost'
        onClick={() => {
          setSelectedTab(undefined);
        }}
      >
        閉じる
      </Button>
    </Flex>
  );
}
