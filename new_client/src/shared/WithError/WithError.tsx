import { Box } from '@radix-ui/themes';
import type { ComponentProps } from 'react';
import styles from './withError.module.css';

export type WithErrorProps = Omit<ComponentProps<typeof Box>, 'children' | 'className'> & {
  /** エラーメッセージ */
  error?: string;
  /** 子要素 */
  children: React.ReactNode;
  /** 追加クラス */
  className?: string;
};

export default function WithError({ error, children, className, ...props }: WithErrorProps) {
  return (
    <Box className={`${styles.container} ${className ?? ''}`} {...props}>
      {children}
      {error && <Box className={styles.errorText}>{error}</Box>}
    </Box>
  );
}
