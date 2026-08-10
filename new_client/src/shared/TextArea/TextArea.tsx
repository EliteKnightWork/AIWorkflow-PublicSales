import { TextArea as RUTextArea } from '@radix-ui/themes';
import type { Responsive } from '@radix-ui/themes/dist/esm/props/prop-def.js';
import type { ChangeEventHandler, ComponentProps } from 'react';
import styles from './textArea.module.css';

export type TextAreaProps = Omit<
  ComponentProps<typeof RUTextArea>,
  'size' | 'variant' | 'placeholder' | 'resize' | 'defaultValue' | 'value' | 'onChange'
> & {
  /** プレースホルダー */
  placeholder?: string;
  /** リサイズ */
  resize?: Responsive<'none' | 'vertical' | 'horizontal' | 'both'>;
  /** デフォルト値 */
  defaultValue?: string;
  /** 値 */
  value?: string;
  /** onChange */
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
};

export default function TextArea({ resize = 'none', className, ...props }: TextAreaProps) {
  return (
    <RUTextArea resize={resize} className={`${styles.textArea} ${className ?? ''}`} {...props} />
  );
}
