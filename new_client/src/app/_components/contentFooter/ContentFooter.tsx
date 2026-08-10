'use client';
import { useUser } from '@auth0/nextjs-auth0';
import { Box, Button } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import styles from './styles.module.css';

export const ContentFooter = () => {
  const router = useRouter();
  const { user } = useUser();

  const onClickLogin = () => {
    router.push('/login');
  };

  const onClickTrial = () => {
    window.open('https://labid.jp/#footer_form', '_blank');
  };

  return (
    !user && (
      <Box className={styles.footer}>
        <Button className={styles.loginButton} onClick={onClickLogin}>
          ログイン
        </Button>
        <Button className={styles.trialButton} onClick={onClickTrial}>
          無料デモ体験
        </Button>
      </Box>
    )
  );
};
