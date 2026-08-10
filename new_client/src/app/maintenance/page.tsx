import { Box, Flex, Text } from '@radix-ui/themes';
import { Header } from '../_components/header/Header';
import styles from './styles.module.css';

export default function MaintenancePage() {
  return (
    <Flex direction='column' style={{ backgroundColor: 'var(--bg-color-secondary)' }}>
      <div id='header'>
        <Header isLogin={false} isMaintenance={true} />
      </div>

      <Box className={styles.container}>
        <Box className={styles.messageBox}>
          <Text className={styles.title}>メンテナンス中</Text>
          <Text className={styles.description}>
            現在、システムメンテナンスを実施しております。
            <br />
            ご不便をおかけいたしますが、しばらくお待ちください。
          </Text>
        </Box>
      </Box>
    </Flex>
  );
}
