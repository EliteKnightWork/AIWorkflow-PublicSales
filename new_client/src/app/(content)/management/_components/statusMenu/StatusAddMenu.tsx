import * as Popover from '@radix-ui/react-popover';
import { Box, Button, Flex, Text, TextField } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import type { BidPipelineStatusStage } from '@/api/generated/models';
import styles from './styles.module.css';

type Props = {
  stage: BidPipelineStatusStage;
  onAddClick: (name: string, stage: BidPipelineStatusStage) => void;
};

export default function StatusAddMenu({ stage, onAddClick }: Props) {
  const [statusName, setStatusName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  const handleSubmit = () => {
    if (statusName.trim()) {
      onAddClick(statusName, stage);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isComposing) {
      handleSubmit();
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStatusName('');
    }
  }, [isOpen]);

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <Box className={styles.addButton}>
          <span className={'material-icons'} translate='no' aria-hidden='true'>
            add
          </span>
          <Text>案件ステータスを追加する</Text>
        </Box>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className={styles.popoverContent} sideOffset={5}>
          <Flex gap='16px' align='center' px='24px' py='16px'>
            <TextField.Root
              placeholder='ステータス名'
              value={statusName}
              onChange={(e) => setStatusName(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              className={styles.statusField}
            />
            <Flex justify='end'>
              <Button
                size='2'
                onClick={handleSubmit}
                disabled={!statusName.trim() || isComposing}
                className={styles.statusAddButton}
              >
                追加
              </Button>
            </Flex>
            <Popover.Close className={styles.popoverClose}>
              <span className={'material-icons'} translate='no' aria-hidden='true'>
                close
              </span>
            </Popover.Close>
          </Flex>
          <Popover.Arrow className={styles.popoverArrow} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
