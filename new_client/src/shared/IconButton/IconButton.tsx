'use client';

import { IconButton as RUIconButton } from '@radix-ui/themes';
import type { ComponentProps, ReactNode } from 'react';
import styles from './iconButton.module.css';

/** 強弱 */
export type Variant = 'primary' | 'secondary' | 'tertiary' | 'default';
/** サイズ */
export type Size = 'xl' | 'large' | 'medium' | 'small' | 'xs';
/** 形状 */
export type Shape = 'round' | 'square';

export type IconButtonProps = Omit<
  ComponentProps<typeof RUIconButton>,
  'variant' | 'size' | 'disabled' | 'children' | 'radius'
> & {
  /** 強弱 */
  variant?: Variant;
  /** サイズ */
  size?: Size;
  /** 形状 */
  shape?: Shape;
  /** 無効化 */
  disabled?: boolean;
  /** アイコン */
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
    case 'xs':
      return styles.xs;
  }
};

const shapeClass = (shape?: Shape) => {
  switch (shape) {
    case 'round':
      return styles.round;
    case 'square':
      return styles.square;
  }
};

/**
 * アイコンボタンコンポーネント
 */
export default function IconButton({
  variant = 'default',
  size = 'medium',
  shape = 'round',
  className,
  ...props
}: IconButtonProps) {
  return (
    <RUIconButton
      className={[
        styles.iconButton,
        variantClass(variant),
        sizeClass(size),
        shapeClass(shape),
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}
