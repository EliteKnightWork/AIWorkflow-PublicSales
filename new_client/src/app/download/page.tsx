import { Box, Flex, Text } from '@radix-ui/themes';
import Image from 'next/image';
import { HUBSPOT_FORM_ID_DOWNLOAD } from '@/constants';
import { Footer } from '../_components/footer/Footer';
import { Header } from '../_components/header/Header';
import HubSpotForm from '../_components/hubspotsform/HubspotForm';
import styles from './styles.module.css';

export default function Download() {
  return (
    <Flex direction='column' style={{ backgroundColor: 'var(--bg-color-secondary)' }}>
      <div id='header'>
        <Header isLogin={false} />
      </div>
      <div className={styles.downloadContainer}>
        <div className={styles.contentWrapper}>
          <Box className={styles.textContainer}>
            <div className={styles.titleContainer}>
              <Text className={styles.title}>Labid資料ダウンロード</Text>
            </div>
            <div className={styles.imageContainer}>
              <Image
                src='/images/download_service_img.png'
                alt='Labidサービス資料'
                width={500}
                height={350}
                className={styles.serviceImage}
              />
            </div>
            <Text className={styles.description}>
              Labidの機能や料金をまとめた「Labidご紹介資料」です。下記フォームをご記入のうえ、ご送信ください。フォーム送信完了後、ダウンロードのご案内メールを担当者よりお送りいたします。
            </Text>
          </Box>

          <Box className={styles.formContainer}>
            <HubSpotForm divId='hubspot_download_form' formId={HUBSPOT_FORM_ID_DOWNLOAD} />
          </Box>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--bg-color-quaternary)' }}>
        <Footer />
      </div>
    </Flex>
  );
}
