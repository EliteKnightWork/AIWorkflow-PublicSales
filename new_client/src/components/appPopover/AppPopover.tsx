'use client';
import * as Popover from '@radix-ui/react-popover';
import { Button, Text } from '@radix-ui/themes';
import type { ReactNode } from 'react';
import styles from './styles.module.css';

type Props = {
  children: ReactNode; // trigger element
  title?: string;
  content: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  alignOffset?: number;
  className?: string;
  showArrow?: boolean;
  showCloseButton?: boolean;
  onClose?: () => void;
};

export const AppPopover = ({
  children,
  title,
  content,
  open,
  onOpenChange,
  side = 'bottom',
  align = 'center',
  sideOffset = 8,
  alignOffset = 0,
  className = '',
  showArrow = false,
  showCloseButton = true,
  onClose,
}: Props) => {
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className={`${styles.popoverContent} ${className}`}
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
        >
          {(title || showCloseButton) && (
            <div className={styles.popoverHeader}>
              {title && <Text className={styles.popoverTitle}>{title}</Text>}
              {showCloseButton && (
                <Popover.Close asChild>
                  <Button className={styles.popoverCloseButton} onClick={handleClose}>
                    <span className='material-icons'>close</span>
                  </Button>
                </Popover.Close>
              )}
            </div>
          )}
          <div className={styles.popoverContentBody}>{content}</div>
          {showArrow && <Popover.Arrow className={styles.popoverArrow} />}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
