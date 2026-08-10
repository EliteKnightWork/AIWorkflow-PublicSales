'use client';
import { Box, Button, Dialog, Flex, Text } from '@radix-ui/themes';
import styles from './styles.module.css';

export const WebhookHelpButton = () => {
  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <span className={`material-icons ${styles.helpIcon}`} translate='no' aria-hidden='true'>
          help_outline
        </span>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>Slack Webhook URLの登録方法</Dialog.Title>
        <Box className={styles.webhookHelpModal}>
          <Box mt='2'>
            <Text>1. 以下の手順に沿って、Webhook URLを取得してください</Text>
            <Text className={styles.webhookHelpLink}>
              <a
                href='https://nehan6.notion.site/slack-8d108a27839e4e79b3387514795e2702'
                target='_blank'
                rel='noopener noreferrer'
              >
                https://nehan6.notion.site/slack-8d108a27839e4e79b3387514795e2702
              </a>
            </Text>
          </Box>
          <Box mt='2'>
            <Text>2. 取得したWebhook URLを入力してください</Text>
          </Box>
        </Box>
        <Flex justify='end' mt='4'>
          <Dialog.Close>
            <Button variant='solid' size='3' className={styles.closeButton}>
              閉じる
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
