import * as Dialog from '@radix-ui/react-dialog';
import { Box, Flex, Text } from '@radix-ui/themes';
import type { BidPipelineTask } from '@/api/generated/models';
import { RoundButton } from '@/components/roundButton/RoundeButton';
import styles from './styles.module.css';

export type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  task: BidPipelineTask;
  modalRef?: React.RefObject<HTMLDivElement>;
};

export const TaskDeleteDialog = ({ isOpen, onClose, onConfirm, task, modalRef }: Props) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={() => {}}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content asChild>
          <Box className={styles.modal} ref={modalRef} onClick={(e) => e.stopPropagation()}>
            <Box className={styles.modalTitleBox}>
              <Dialog.Title className={styles.headerTitle}>タスクを削除しますか？</Dialog.Title>
            </Box>
            <Box>
              <Box className={styles.modalContent}>
                <Text size='2' color='gray'>
                  この操作は取り消せません。
                </Text>
                <Text size='3' weight='bold'>
                  タスク名: {task.title}
                </Text>

                <Flex justify={'center'} className={`${styles.buttonRow} not-draggable`}>
                  <RoundButton
                    buttonClassName={styles.cancelButton}
                    hideIcon
                    text='キャンセル'
                    onClick={() => {
                      onClose();
                    }}
                  />
                  <RoundButton
                    buttonClassName={styles.deleteButton}
                    hideIcon
                    text='削除する'
                    onClick={() => {
                      onConfirm();
                    }}
                  />
                </Flex>
              </Box>
            </Box>
          </Box>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
