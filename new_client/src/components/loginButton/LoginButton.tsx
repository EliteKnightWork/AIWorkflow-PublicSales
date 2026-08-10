'use client';

import { Button } from '@radix-ui/themes';
import styles from './styles.module.css';

export function LoginButton() {
  function handleLogin() {
    window.location.href = '/login';
  }

  return (
    <Button variant='outline' className={styles.headerLoginButton} onClick={handleLogin}>
      ログイン
    </Button>
  );
}
