'use client';

import { Button, Flex, Text } from '@radix-ui/themes';
import Link from 'next/link';
import styles from './error.module.css';

export default function ProjectsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Flex direction='column' style={{ width: '100%' }}>
      <Flex direction='column' align='center' justify='center' className={styles.errorContainer}>
        <Flex direction='column' align='center' gap='6' className={styles.errorContent}>
          <Text className={styles.errorTitle}>エラーが発生しました</Text>

          <Flex direction='column' align='center' gap='2'>
            <Text className={styles.errorDescription}>
              申し訳ございません。案件情報の取得中にエラーが発生しました。
            </Text>
            <Text className={styles.errorDescription}>
              しばらく時間をおいてから再度お試しください。
            </Text>
          </Flex>

          <Flex gap='3' justify='center' wrap='wrap'>
            <Link href='/mypage' style={{ textDecoration: 'none' }}>
              <Button size='3' className={styles.mypageButton}>
                マイページへ
              </Button>
            </Link>
            <Button size='3' variant='outline' onClick={reset} className={styles.retryButton}>
              もう一度試す
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}
