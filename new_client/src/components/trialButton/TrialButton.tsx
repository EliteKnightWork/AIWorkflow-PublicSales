'use client';

import { Button } from '@radix-ui/themes';
import styles from './styles.module.css';

type Props = {
  width?: string;
  height?: string;
};

export function TrialButton({ width, height }: Props) {
  return (
    <Button
      variant='outline'
      className={styles.trialButton}
      style={{ ...(width ? { width: width } : {}), ...(height ? { height: height } : {}) }}
      onClick={() => {
        const footerForm = document.getElementById('footer_form');
        if (footerForm) {
          footerForm.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.open('https://labid.jp/#footer_form');
        }
      }}
    >
      無料デモ体験
    </Button>
  );
}
