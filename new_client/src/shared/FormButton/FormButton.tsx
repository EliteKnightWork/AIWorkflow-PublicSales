'use client';

import { Button as RUButton } from '@radix-ui/themes';
import type { ComponentProps, ReactNode } from 'react';
import styles from './formButton.module.css';

/** サイズ */
export type Size = 'medium' | 'small';

export type FormButtonProps = Omit<
  ComponentProps<typeof RUButton>,
  'variant' | 'size' | 'children'
> & {
  /** サイズ */
  size?: Size;
  /** 枠線 */
  border?: boolean;
  /** コンテンツ */
  children?: ReactNode;
};

const sizeClass = (size?: Size) => {
  switch (size) {
    case 'medium':
      return styles.medium;
    case 'small':
      return styles.small;
  }
};

const borderClass = (border?: boolean) => {
  if (border) {
    return styles.border;
  }
};

/**
 * メインのボタンコンポーネント
 */
export default function FormButton({
  size = 'small',
  border = false,
  className,
  ...props
}: FormButtonProps) {
  return (
    <RUButton
      className={[styles.formButton, sizeClass(size), borderClass(border), className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}
