'use client';
import * as Select from '@radix-ui/react-select';
import { Box } from '@radix-ui/themes';
import styles from './styles.module.css';

type selectItem = {
  id: string;
  value: string;
};

type Props = {
  triggerNode: React.ReactNode;
  items: selectItem[];
  selectedItem: selectItem | null;
  onSelect: (item: selectItem) => void;
  onBlur?: () => void;
  selectRef?: React.RefObject<HTMLDivElement>;
  disabled?: boolean;
  className?: string;
};

export const TaskFormSelect = ({
  triggerNode,
  items,
  selectedItem,
  onSelect,
  selectRef,
  disabled,
  className,
}: Props) => {
  return (
    <Select.Root
      value={selectedItem?.id}
      onValueChange={(value) => {
        const item = items.find((item) => item.id === value);
        if (item) onSelect(item);
      }}
      disabled={disabled}
    >
      <Select.Trigger
        className={`${styles.roundSelectTriggerButton} not-draggable ${className || ''}`}
      >
        {triggerNode}
        {!disabled && (
          <Select.Icon>
            <span
              className={`material-icons ${styles.triggerIcon}`}
              translate='no'
              aria-hidden='true'
            >
              keyboard_arrow_down
            </span>
          </Select.Icon>
        )}
      </Select.Trigger>

      <Select.Content
        className={`${styles.dropdownContent} not-draggable`}
        position='popper'
        sideOffset={5}
        ref={selectRef}
      >
        <Select.Viewport>
          {items.map((item) => {
            const hasSelected = items.some((i) => i.id === selectedItem?.id);
            const isSelected = item.id === selectedItem?.id;

            return (
              <Select.Item
                key={item.id}
                value={item.id}
                className={`${styles.checkboxItem} not-draggable`}
              >
                <Select.ItemIndicator>
                  <span
                    className='material-icons'
                    translate='no'
                    aria-hidden='true'
                    style={{ fontSize: '18px', width: '26px' }}
                  >
                    check
                  </span>
                </Select.ItemIndicator>
                <Box style={{ marginLeft: isSelected || !hasSelected ? '0' : '26px' }}>
                  <Select.ItemText>{item.value}</Select.ItemText>
                </Box>
              </Select.Item>
            );
          })}
        </Select.Viewport>
      </Select.Content>
    </Select.Root>
  );
};
