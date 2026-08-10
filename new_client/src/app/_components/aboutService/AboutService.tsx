import { Box, Strong, Text } from '@radix-ui/themes';
import Image from 'next/image';
import styles from './styles.module.css';

const AboutService = () => {
  return (
    <Box className={styles.aboutService}>
      <Box className={styles.aboutServiceContent}>
        <Box className={styles.header}>
          <Image src='/top/topic.svg' alt='サービスについて' width={14} height={14} />
          <Text>About</Text>
        </Box>
        <Box className={styles.body}>
          <Text className={styles.title}>
            自社に合う案件をピンポイントで
            <br />
            提供し情報収集工数を削減
            <br />
            <Strong>売上向上に必要な業務時間を創出</Strong>
          </Text>
          <Text className={styles.description}>
            Labid（ラビッド）はAIの活用で入札情報収集業務を大幅に効率化。事業内容と合致した案件をおすすめしたり、案件の書類をAIがサマリして要件理解時間を短縮することでビジネスを支援します。
          </Text>
        </Box>
      </Box>

      <Box className={styles.image}>
        <Image src='/top/about.svg' alt='About' fill objectFit='contain' />
      </Box>
    </Box>
  );
};

export default AboutService;
