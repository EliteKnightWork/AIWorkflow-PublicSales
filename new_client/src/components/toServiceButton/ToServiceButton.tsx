'use client';

import { Button } from '@radix-ui/themes';
import styles from './styles.module.css';

export function ToServiceButton() {
  return (
    <Button
      variant='ghost'
      className={styles.mypageButton}
      onClick={() => {
        window.location.href = '/mypage';
      }}
    >
      マイページへ
    </Button>
  );
}
