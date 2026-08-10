import { TextField as RUTextField } from '@radix-ui/themes';
import type { ChangeEventHandler, ComponentProps, ReactNode } from 'react';
import styles from './textField.module.css';

export type TextFieldProps = Omit<
  ComponentProps<typeof RUTextField.Root>,
  'size' | 'variant' | 'placeholder' | 'defaultValue' | 'value' | 'onChange'
> & {
  /** プレースホルダー */
  placeholder?: string;
  /** デフォルト値 */
  defaultValue?: string;
  /** 値 */
  value?: string | number;
  /** onChange */
  onChange?: ChangeEventHandler<HTMLInputElement>;
  /** 左アイコン */
  leftIcon?: ReactNode;
  /** 右アイコン */
  rightIcon?: ReactNode;
};

export default function TextField({ className, leftIcon, rightIcon, ...props }: TextFieldProps) {
  return (
    <RUTextField.Root className={`${styles.textField} ${className ?? ''}`} {...props}>
      {leftIcon && <RUTextField.Slot side={'left'}>{leftIcon}</RUTextField.Slot>}
      {rightIcon && <RUTextField.Slot side={'right'}>{rightIcon}</RUTextField.Slot>}
    </RUTextField.Root>
  );
}
