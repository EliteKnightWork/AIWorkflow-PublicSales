'use client';

import * as Checkbox from '@radix-ui/react-checkbox';
import { Box } from '@radix-ui/themes';
import type { ComponentProps, ReactNode } from 'react';
import { useId } from 'react';
import styles from './checkbox.module.css';

export type CheckBoxProps = Omit<ComponentProps<typeof Checkbox.Root>, 'children'> & {
  /** ラベルテキスト */
  label?: ReactNode;
  /** デフォルト値 */
  defaultChecked?: boolean;
  /** 値 */
  checked?: boolean;
  /** onCheckedChange */
  onCheckedChange?: (checked: boolean) => void;
  /** 追加クラス */
  className?: string;
};

/**
 * チェックボックスコンポーネント
 */
export default function CheckBox({ label, className, ...props }: CheckBoxProps) {
  const id = useId();
  return (
    <Box className={styles.checkboxWrapper}>
      <Checkbox.Root
        id={id}
        className={[styles.checkboxRoot, className].filter(Boolean).join(' ')}
        {...props}
      >
        <Checkbox.Indicator className={styles.checkboxIndicator}>
          <span className={'material-icons'} translate='no' aria-hidden='true'>
            check_box
          </span>
        </Checkbox.Indicator>
        <span
          className={`material-icons ${styles.checkboxOutline}`}
          translate='no'
          aria-hidden='true'
        >
          check_box_outline_blank
        </span>
      </Checkbox.Root>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
    </Box>
  );
}
