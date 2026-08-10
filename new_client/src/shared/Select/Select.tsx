import * as Select from '@radix-ui/react-select';
import type { ComponentProps, ReactNode } from 'react';
import styles from './select.module.css';

export type SelectProps = Omit<
  ComponentProps<typeof Select.Root>,
  'defaultValue' | 'value' | 'onValueChange' | 'children' | 'position'
> & {
  /** プレースホルダー */
  placeholder?: string;
  /** デフォルト値 */
  defaultValue?: string;
  /** 値 */
  value?: string;
  /** onChange */
  onChange?: (value: string) => void;
  /** ポジション */
  position?: 'item-aligned' | 'popper';
  /** オプション */
  children: ReactNode;
  /** トリガーのクラス名 */
  triggerClassName?: string;
  /** コンテンツのクラス名 */
  contentClassName?: string;
};

export default function SelectComponent({
  placeholder = '未選択',
  onChange,
  position = 'popper',
  children,
  triggerClassName,
  contentClassName,
  ...props
}: SelectProps) {
  return (
    <Select.Root {...props} onValueChange={onChange}>
      <Select.Trigger className={`${styles.selectTrigger} ${triggerClassName ?? ''}`}>
        <Select.Value placeholder={placeholder} />
        <Select.Icon className={styles.selectIcon}>
          <span className='material-icons' translate='no' aria-hidden='true'>
            keyboard_arrow_down
          </span>
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position={position}
          className={`${styles.selectContent} ${contentClassName ?? ''}`}
        >
          <Select.Viewport className={styles.selectViewport}>{children}</Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

// エクスポート用のヘルパーコンポーネント（デフォルトスタイルを適用）
const SelectItemComponent = ({ className, ...props }: ComponentProps<typeof Select.Item>) => (
  <Select.Item className={`${styles.selectItem} ${className ?? ''}`} {...props} />
);

const SelectLabelComponent = ({ className, ...props }: ComponentProps<typeof Select.Label>) => (
  <Select.Label className={`${styles.selectLabel} ${className ?? ''}`} {...props} />
);

const SelectSeparatorComponent = ({
  className,
  ...props
}: ComponentProps<typeof Select.Separator>) => (
  <Select.Separator className={`${styles.selectSeparator} ${className ?? ''}`} {...props} />
);

export const SelectItem = SelectItemComponent;
export const SelectItemText = Select.ItemText;
export const SelectItemIndicator = Select.ItemIndicator;
export const SelectGroup = Select.Group;
export const SelectLabel = SelectLabelComponent;
export const SelectSeparator = SelectSeparatorComponent;
