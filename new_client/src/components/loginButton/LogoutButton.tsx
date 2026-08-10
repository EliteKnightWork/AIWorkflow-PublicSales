'use client';

import { Button } from '@radix-ui/themes';
import styles from './styles.module.css';

export function LogoutButton() {
  return (
    <Button
      variant='outline'
      className={styles.headerLoginButton}
      onClick={() => {
        const params = new URLSearchParams({
          returnTo: `${process.env.NEXT_PUBLIC_CLIENT_BASE_URL}/logout`,
        });
        window.location.href = `/auth/logout?${params.toString()}`;
      }}
    >
      ログアウト
    </Button>
  );
}
