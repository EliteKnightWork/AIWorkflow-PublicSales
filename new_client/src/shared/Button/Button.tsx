'use client';

import { Button as RUButton } from '@radix-ui/themes';
import type { ComponentProps, ReactNode } from 'react';
import styles from './button.module.css';

/** 強弱 */
export type Variant = 'primary' | 'secondary' | 'tertiary' | 'default';
/** サイズ */
export type Size = 'xl' | 'large' | 'medium' | 'small';

export type ButtonProps = Omit<
  ComponentProps<typeof RUButton>,
  'variant' | 'size' | 'disabled' | 'loading' | 'children'
> & {
  /** 強弱 */
  variant?: Variant;
  /** サイズ */
  size?: Size;
  /** 無効化 */
  disabled?: boolean;
  /** ローディング */
  loading?: boolean;
  /** コンテンツ */
  children?: ReactNode;
};

const variantClass = (variant?: Variant) => {
  switch (variant) {
    case 'primary':
      return styles.primary;
    case 'secondary':
      return styles.secondary;
    case 'tertiary':
      return styles.tertiary;
    case 'default':
      return styles.default;
  }
};

const sizeClass = (size?: Size) => {
  switch (size) {
    case 'xl':
      return styles.xl;
    case 'large':
      return styles.large;
    case 'medium':
      return styles.medium;
    case 'small':
      return styles.small;
  }
};

/**
 * メインのボタンコンポーネント
 */
export default function Button({
  variant = 'default',
  size = 'medium',
  className,
  ...props
}: ButtonProps) {
  return (
    <RUButton
      className={[styles.button, variantClass(variant), sizeClass(size), className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}
