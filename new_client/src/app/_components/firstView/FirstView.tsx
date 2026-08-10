import { Box, Heading, Text } from '@radix-ui/themes';
import Image from 'next/image';
import { HUBSPOT_FORM_ID_FIRST_VIEW } from '@/constants';
import HubSpotForm from '../hubspotsform/HubspotForm';
import styles from './styles.module.css';

export function FirstView() {
  return (
    <Box className={styles.firstViewOutline}>
      <Box className={styles.firstView}>
        <Box className={styles.firstViewContent}>
          <Heading weight={'bold'} as='h1' className={styles.firstViewContentCatch}>
            どこよりもカンタンに、どこよりもスピーディに
            <br />
            入札情報サービス
          </Heading>

          <Box className={styles.headerLogo}>
            <Image src='/top/Labid.svg' alt='Labid Logo' fill objectFit='contain' />
          </Box>

          <Box className={styles.firstViewContentText}>
            <Text>
              Labid（ラビッド）はAIを活用して時間のかかっていた入札情報収集を効率化。
              <br />
              成果を出すための営業活動に取り組めるようになる入札情報サービスです。
            </Text>
          </Box>

          <Box className={styles.firstViewContentPC}>
            <Image src='/top/PC.png' alt='PC' fill objectFit='contain' />
          </Box>
        </Box>
        <Box className={styles.headerForm}>
          <HubSpotForm divId='header_form' formId={HUBSPOT_FORM_ID_FIRST_VIEW} />
        </Box>
      </Box>
    </Box>
  );
}
