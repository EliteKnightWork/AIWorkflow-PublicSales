import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Box, Button, Text } from '@radix-ui/themes';
import { useState } from 'react';
import type { User } from '@/api/generated/models';
import styles from './styles.module.css';

type Props = {
  members: User[];
  selectedIds: string[];
  onSelect?: (selectedIds: string[]) => void;
};

export const CompanyMemberSelect = ({ members, onSelect, selectedIds }: Props) => {
  const [targetSelectedIds, setTargetSelectedIds] = useState(selectedIds);
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (id: string) => {
    const newSelectedIds = targetSelectedIds.includes(id)
      ? targetSelectedIds.filter((selectedId) => selectedId !== id)
      : [...targetSelectedIds, id];

    setTargetSelectedIds(newSelectedIds);
  };

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const allIds = members.map((member) => member.id?.toString() || '');
    setTargetSelectedIds(allIds);
  };

  const handleUnselectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetSelectedIds([]);
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);

    if (onSelect) {
      onSelect(targetSelectedIds);
    }
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
            onSelect(targetSelectedIds);
          }
        }
      }}
    >
      <DropdownMenu.Trigger asChild>
        <Button variant='outline' className={'roundButton'} onClick={handleTriggerClick}>
          <Box className={'roundButtonBox'}>
            <Text>
              {targetSelectedIds.length > 0 && targetSelectedIds.length !== members.length
                ? `メンバー: ${targetSelectedIds.length}名を選択中`
                : 'メンバー: 全員'}
            </Text>
            <span className={'material-icons roundButtonIcon'}>filter_alt</span>
          </Box>
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className={styles.dropdownContent} sideOffset={5}>
          <div className={styles.dropdownHeader}>
            {targetSelectedIds.length > 0 && targetSelectedIds.length === members.length ? (
              <Button
                variant='ghost'
                size='1'
                onClick={handleUnselectAll}
                className={styles.selectAllButton}
              >
                全て解除
              </Button>
            ) : (
              <Button
                variant='ghost'
                size='1'
                onClick={handleSelectAll}
                className={styles.selectAllButton}
              >
                全て選択
              </Button>
            )}
          </div>
          {members.map((member) => (
            <DropdownMenu.CheckboxItem
              key={member.id}
              className={styles.checkboxItem}
              checked={targetSelectedIds.includes(member.id?.toString() || '')}
              onCheckedChange={() => handleSelect(member.id?.toString() || '')}
              onClick={(e: React.MouseEvent) => {
                preventPropagation(e);
                handleSelect(member.id?.toString() || '');
              }}
            >
              <Box style={{ display: 'flex', alignItems: 'center', width: '16px' }}>
                <DropdownMenu.ItemIndicator className={styles.itemIndicator}>
                  ✓
                </DropdownMenu.ItemIndicator>
              </Box>
              {!!member.name && member.name.length > 0 ? member.name : member.email}
            </DropdownMenu.CheckboxItem>
          ))}
          <div className={styles.dropdownFooter}>
            <Button variant='solid' size='1' onClick={handleClose} className={styles.closeButton}>
              完了
            </Button>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
