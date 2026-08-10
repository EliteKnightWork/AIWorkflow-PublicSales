import { Box, Flex, Link, Text } from '@radix-ui/themes';
import { getCachedSession } from '@/lib/auth0';
import { Footer } from '../_components/footer/Footer';
import { Header } from '../_components/header/Header';
import styles from './styles.module.css';

export default async function Thanks() {
  const session = await getCachedSession();
  return (
    <Flex direction='column' style={{ backgroundColor: 'var(--bg-color-secondary)' }}>
      <div id='header'>
        <Header isLogin={!!session} />
      </div>
      <Flex
        direction={'column'}
        justify={'center'}
        align={'center'}
        gap={'8'}
        className={styles.thanksContainer}
      >
        <Text className={styles.title}>デモをお申し込みいただき、ありがとうございます</Text>

        <Box className={styles.description}>
          <Text>
            このたびは、Labid（ラビッド）のデモにお申し込みいただき、ありがとうございます。
          </Text>
          <br />
          <Text>内容を確認のうえ、担当者よりご連絡いたします。</Text>
        </Box>

        <Flex direction={'column'} className={styles.supportBox}>
          <Text className={styles.supportTitle}>何かお困りの方へ</Text>
          <Text className={styles.supportText}>下記メールアドレス宛にお気軽にご相談ください</Text>
          <Link href='mailto:sales@nehan6.com' className={styles.supportLink}>
            sales@nehan6.com
          </Link>
        </Flex>
      </Flex>

      <div style={{ backgroundColor: 'var(--bg-color-quaternary)' }}>
        <Footer />
      </div>
    </Flex>
  );
}
