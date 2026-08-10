import { Box, Text } from '@radix-ui/themes';
import Image from 'next/image';
import styles from './styles.module.css';

const AboutProblem = () => {
  return (
    <Box className={styles.aboutProblemContainer}>
      <Box className={styles.header}>
        <Image src='/top/topic.svg' alt='問題点について' width={14} height={14} />
        <Text>Problem</Text>
      </Box>
      <Text className={styles.problemTitle}>このような問題はありませんか？</Text>

      <Box className={styles.problemContentBox}>
        <Box className={styles.problemContent}>
          <Text className={styles.problemContentText}>入札案件の膨大な</Text>
          <Text className={styles.problemContentStrong}>書類の読み込みが大変</Text>
          <Image src='/top/problem_1.svg' alt='問題点について' width={230} height={199} />
        </Box>
        <Box className={styles.problemContent}>
          <Text className={styles.problemContentText}>自社にマッチする案件を</Text>
          <Text className={styles.problemContentStrong}>精査する工数が膨大</Text>
          <Image src='/top/problem_2.png' alt='問題点について' width={230} height={181} />
        </Box>
        <Box className={styles.problemContent}>
          <Text className={styles.problemContentText}>入札情報が散在していて</Text>
          <Text className={styles.problemContentStrong}>情報収集に時間がかかる</Text>
          <Image src='/top/problem_3.svg' alt='問題点について' width={230} height={199} />
        </Box>
      </Box>
    </Box>
  );
};

export default AboutProblem;
