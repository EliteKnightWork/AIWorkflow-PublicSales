'use client';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Box, Flex, Text } from '@radix-ui/themes';
import styles from './styles.module.css';

type SelectItem = {
  id: string;
  value: string;
};

type Props = {
  triggerNode: React.ReactNode;
  items: SelectItem[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onBlur?: () => void;
  selectRef?: React.RefObject<HTMLDivElement>;
  disabled?: boolean;
  className?: string;
  maxSelection?: number;
};

export const TaskFormMultiSelect = ({
  triggerNode,
  items,
  selectedIds,
  onSelectionChange,
  selectRef,
  disabled,
  className,
  maxSelection,
}: Props) => {
  const handleItemClick = (itemId: string) => {
    if (selectedIds.includes(itemId)) {
      // 既に選択されている場合は削除
      onSelectionChange(selectedIds.filter((id) => id !== itemId));
    } else {
      // 新規選択（最大選択数チェック）
      if (!maxSelection || selectedIds.length < maxSelection) {
        onSelectionChange([...selectedIds, itemId]);
      }
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild disabled={disabled}>
        <Box className={`${styles.roundSelectTriggerButton} not-draggable ${className || ''}`}>
          {triggerNode}
          {!disabled && (
            <span
              className={`material-icons ${styles.triggerIcon}`}
              translate='no'
              aria-hidden='true'
            >
              keyboard_arrow_down
            </span>
          )}
        </Box>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={`${styles.dropdownContent} not-draggable`}
          align='start'
          sideOffset={5}
          ref={selectRef}
        >
          <Box className={styles.itemsContainer}>
            {items.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const isDisabled = !isSelected && maxSelection && selectedIds.length >= maxSelection;

              return (
                <DropdownMenu.Item
                  key={item.id}
                  className={`${styles.checkboxItem} not-draggable ${isDisabled ? styles.disabled : ''}`}
                  onSelect={(e) => {
                    e.preventDefault();
                    if (!isDisabled) {
                      handleItemClick(item.id);
                    }
                  }}
                >
                  <Flex align='center' gap='2' style={{ width: '100%' }}>
                    {isSelected && (
                      <span
                        className='material-icons'
                        translate='no'
                        aria-hidden='true'
                        style={{ fontSize: '18px', width: '26px' }}
                      >
                        check
                      </span>
                    )}
                    <Text
                      style={{ marginLeft: selectedIds.length === 0 || isSelected ? 0 : '26px' }}
                    >
                      {item.value}
                    </Text>
                  </Flex>
                </DropdownMenu.Item>
              );
            })}
          </Box>
          {maxSelection && (
            <Box className={styles.selectionInfo}>最大{maxSelection}人まで選択可能</Box>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
