import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Box, Button, Text } from '@radix-ui/themes';
import { useState } from 'react';
import type { SearchFilterPreset } from '@/api/generated/models';
import styles from './styles.module.css';

type Props = {
  currentPreset?: SearchFilterPreset | undefined;
  presets: SearchFilterPreset[];
  onSelect?: (selectedPreset: SearchFilterPreset | undefined) => void;
  buttonClassName?: string;
  disabled?: boolean;
};

export const FilterPresetSelect = ({
  currentPreset,
  presets,
  onSelect,
  buttonClassName,
  disabled = false,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (preset: SearchFilterPreset | undefined) => {
    setIsOpen(false);

    if (onSelect) {
      onSelect(preset);
    }
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const preventPropagation = (e: Event | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <DropdownMenu.Root
      modal={false}
      open={isOpen}
      onOpenChange={(isOpen) => {
        setIsOpen(isOpen);
        if (!isOpen) {
          if (onSelect) {
            onSelect(currentPreset);
          }
        }
      }}
    >
      <DropdownMenu.Trigger asChild>
        <Button
          variant='outline'
          disabled={disabled}
          className={`roundButton ${buttonClassName}`}
          onClick={handleTriggerClick}
        >
          <Box className={'roundButtonBox'}>
            <Text>
              {currentPreset ? `保存条件: ${currentPreset.title}` : '保存条件を選択してください'}
            </Text>
            <span className={'material-icons roundButtonIcon'}>filter_alt</span>
          </Box>
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className={styles.dropdownContent} sideOffset={5}>
          {presets.length === 0 ? (
            <DropdownMenu.Item className={styles.noPresetsMessage}>
              イチオシ案件に登録している保存条件がありません。
            </DropdownMenu.Item>
          ) : (
            presets.map((preset) => (
              <DropdownMenu.CheckboxItem
                key={preset.id}
                className={styles.checkboxItem}
                checked={currentPreset?.id === preset.id}
                onCheckedChange={() => handleSelect(preset)}
                onClick={(e: React.MouseEvent) => {
                  preventPropagation(e);
                  handleSelect(preset);
                }}
              >
                <Box style={{ display: 'flex', alignItems: 'center', width: '16px' }}>
                  <DropdownMenu.ItemIndicator className={styles.itemIndicator}>
                    ✓
                  </DropdownMenu.ItemIndicator>
                </Box>
                {preset.title}
              </DropdownMenu.CheckboxItem>
            ))
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
