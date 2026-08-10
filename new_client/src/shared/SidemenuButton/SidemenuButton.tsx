import { Box, Button as RUButton } from '@radix-ui/themes';
import type { ComponentProps, MouseEventHandler, ReactNode } from 'react';
import styles from './sidemenuButton.module.css';

/** 状態 */
export type Variant = 'default' | 'secondary';

export type SidemenuButtonProps = Omit<
  ComponentProps<typeof RUButton>,
  'variant' | 'children' | 'onClick'
> & {
  /** 状態 */
  variant?: Variant;
  /** 左アイコン */
  leftIcon?: ReactNode;
  /** 右アイコン */
  rightIcon?: ReactNode;
  /** クリックイベント */
  onClick?: MouseEventHandler<HTMLButtonElement>;
  /** コンテンツ */
  children?: ReactNode;
};

const variantClass = (variant?: Variant) => {
  switch (variant) {
    case 'default':
      return styles.default;
    case 'secondary':
      return styles.secondary;
  }
};

/**
 * サイドメニュー用のボタンコンポーネント
 */
export default function SidemenuButton({
  variant = 'default',
  leftIcon,
  rightIcon,
  children,
  className,
  ...props
}: SidemenuButtonProps) {
  return (
    <RUButton
      className={[styles.sidemenuButton, variantClass(variant), className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <Box className={styles.container}>
        {leftIcon && <Box className={styles.leftIcon}>{leftIcon}</Box>}
        <Box className={styles.text}>{children}</Box>
      </Box>
      {rightIcon && <Box className={styles.rightIcon}>{rightIcon}</Box>}
    </RUButton>
  );
}
