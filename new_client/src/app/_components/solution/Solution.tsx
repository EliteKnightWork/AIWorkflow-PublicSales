import { Box, Strong, Text } from '@radix-ui/themes';
import Image from 'next/image';
import styles from './styles.module.css';

const Solution = () => {
  return (
    <Box className={styles.solutionContainer}>
      <Box className={styles.header}>
        <Image src='/top/topic.svg' alt='ソリューション' width={14} height={14} />
        <Text>Solution</Text>
      </Box>
      <Text className={styles.title}>カンタンにスピーディに自社に合う入札情報が見つかります</Text>

      <Box className={styles.solutionContent}>
        <Box className={styles.solutionPointContainer}>
          <Box className={styles.solutionPoint}>
            <Image src='/top/point_1.svg' alt='ポイント1' width={83} height={20} />
            <Text className={styles.solutionPointTitle}>
              全ての書類を読まなくても
              <br />
              入札案件の概要を把握可能
              <br />
              <Strong>案件精査の時間を1/10に削減</Strong>
            </Text>
            <Text className={styles.solutionPointDescription}>
              案件概要・業務内容・応募資格など
              <br />
              入札参加の一次判断に必要な情報をAIがサマリ。
              <br />
              要約時間の削減や要約内容の標準化といった
              <br />
              情報共有の効率化に繋がります。
            </Text>
          </Box>
          <Box className={styles.solutionImage} style={{ aspectRatio: '100/71' }}>
            <Image src='/top/solution_1.png' alt='ソリューション1' fill objectFit='contain' />
          </Box>
        </Box>

        <Box className={styles.solutionPointContainerReverse}>
          <Box className={styles.solutionImage} style={{ aspectRatio: '125/82' }}>
            <Image src='/top/solution_2.png' alt='ソリューション2' fill objectFit='contain' />
          </Box>
          <Box className={styles.solutionPoint}>
            <Image src='/top/point_2.svg' alt='ポイント2' width={83} height={20} />
            <Text className={styles.solutionPointTitle}>
              案件名だけではなく自社事業と
              <br />
              業務内容のマッチ度で案件を検索
              <br />
              <Strong>より自社に合致した情報収集を実現</Strong>
            </Text>
            <Text className={styles.solutionPointDescription}>
              貴社の事業内容・対象キーワードを事前登録すると、
              <br />
              案件の業務内容とのマッチ度を判断しておすすめ。
              <br />
              <br />
              従来のように大量の案件の中から自社と合致する案件を精査する時間を大幅に削減。無駄な案件情報を見る時間が減り、営業活動に割ける時間を増やします。
            </Text>
          </Box>
        </Box>

        <Box className={styles.solutionPointContainer}>
          <Box className={styles.solutionPoint}>
            <Image src='/top/point_3.svg' alt='ポイント3' width={83} height={20} />
            <Text className={styles.solutionPointTitle}>
              1つのプラットフォームで
              <br />
              <Strong>入札情報収集が完結</Strong>
            </Text>
            <Text className={styles.solutionPointDescription}>
              一つのプラットフォームで全国、
              <br />
              各行政機関の入札情報を一括で収集可能に。
              <br />
              ※工事案件には対応しておりません
            </Text>
          </Box>
          <Box className={styles.solutionImage} style={{ aspectRatio: '250/167' }}>
            <Image src='/top/solution_3.png' alt='ソリューション3' fill objectFit='contain' />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Solution;
