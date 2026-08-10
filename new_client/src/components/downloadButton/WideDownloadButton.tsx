'use client';

import { Button } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import styles from './styles.module.css';

export function WideDownloadButton() {
  const router = useRouter();

  return (
    <Button
      variant='outline'
      className={styles.wideDownloadButton}
      onClick={() => {
        router.push('/download?utm_source=labid&utm_medium=referral&utm_campaign=header_button');
      }}
    >
      資料ダウンロード
    </Button>
  );
}
