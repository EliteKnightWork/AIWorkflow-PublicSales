import { Box, Flex, Strong, Text } from '@radix-ui/themes';
import Image from 'next/image';
import { HUBSPOT_FORM_ID_FOOTER } from '@/constants';
import HubSpotForm from '../hubspotsform/HubspotForm';
import styles from './styles.module.css';

const FooterTrialForm = () => {
  return (
    <Flex direction='column' className={styles.trialFormContainer}>
      <Box className={styles.header}>
        <Image src='/top/topic.svg' alt='ソリューション' width={14} height={14} />
        <Text>Application</Text>
      </Box>
      <Text className={styles.title}>
        <Strong>無料デモ体験</Strong>
        <br />
        実際の画面をご覧いただけます
      </Text>

      <Box className={styles.content}>
        <HubSpotForm divId='hubs_footer_form' formId={HUBSPOT_FORM_ID_FOOTER} />
      </Box>
      <Text className={styles.warning}>※弊社サービスは建設・工事案件には対応しておりません</Text>
    </Flex>
  );
};

export default FooterTrialForm;
