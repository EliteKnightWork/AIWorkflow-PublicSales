'use client';

import { Box, Button, Flex, Link, Text } from '@radix-ui/themes';
import { Footer } from './_components/footer/Footer';
import { Header } from './_components/header/Header';
import styles from './error.module.css';

export default function ErrorPage() {
  return (
    <Flex direction='column' style={{ backgroundColor: 'var(--bg-color-secondary)' }}>
      <div id='header'>
        <Header isLogin={false} />
      </div>
      <Flex
        direction={'column'}
        justify={'center'}
        align={'center'}
        gap={'8'}
        className={styles.errorContainer}
      >
        <Text className={styles.title}>エラーが発生しました</Text>

        <Box className={styles.description}>
          <Text>申し訳ございません。予期しないエラーが発生しました。</Text>
          <br />
          <Text>しばらく時間をおいてから再度お試しください。</Text>
        </Box>

        <Link href='/' style={{ textDecoration: 'none' }}>
          <Button size='3' className={styles.homeButton}>
            トップページへ戻る
          </Button>
        </Link>
      </Flex>

      <div style={{ backgroundColor: 'var(--bg-color-quaternary)' }}>
        <Footer />
      </div>
    </Flex>
  );
}
