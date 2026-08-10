'use client';
import { Box, Text } from '@radix-ui/themes';
import Image from 'next/image';
import { WideDownloadButton } from '@/components/downloadButton/WideDownloadButton';
import { WideTrialButton } from '@/components/trialButton/WideTrialButton';
import styles from './styles.module.css';

export function TopFooter() {
  return (
    <Box className={styles.footerOutline}>
      <Box className={styles.footerContainer}>
        <Box className={styles.footerContentBox}>
          <Text className={styles.title}>Labidで入札情報の収集をカンタンに</Text>
          <Box className={styles.body}>
            <Box className={styles.footerContent}>
              <Text className={styles.description}>実際の画面をご覧になりたい方</Text>
              <WideTrialButton />
            </Box>
            <Box className={styles.footerContent}>
              <Text className={styles.description}>もっと詳しく知りたい方</Text>
              <WideDownloadButton />
            </Box>
          </Box>
        </Box>
        <Box className={styles.image}>
          <Image src='/top/footer.png' alt='画面サンプル' fill objectFit='contain' />
        </Box>
      </Box>
    </Box>
  );
}
