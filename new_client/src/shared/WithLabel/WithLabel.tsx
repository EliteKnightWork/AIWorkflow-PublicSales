import { Box } from '@radix-ui/themes';
import type { ComponentProps } from 'react';
import styles from './withLabel.module.css';

export type WithLabelProps = Omit<ComponentProps<typeof Box>, 'children' | 'className'> & {
  /** ラベルテキスト */
  label?: string;
  /** アクション */
  actions?: React.ReactNode | React.ReactNode[];
  /** 子要素 */
  children: React.ReactNode;
  /** 追加クラス */
  className?: string;
};

export default function WithLabel({
  label,
  actions,
  children,
  className,
  ...props
}: WithLabelProps) {
  return (
    <Box {...props} className={`${styles.container} ${className ?? ''}`}>
      <Box className={styles.labelContainer}>
        <Box className={styles.labelText}>{label}</Box>
        <Box className={styles.actionsContainer}>{actions}</Box>
      </Box>
      {children}
    </Box>
  );
}
