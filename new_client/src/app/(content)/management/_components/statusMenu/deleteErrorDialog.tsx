import * as Dialog from '@radix-ui/react-dialog';
import { Box, Button, Flex, IconButton } from '@radix-ui/themes';
import styles from './styles.module.css';

export type Props = {
  isOpen: boolean;
  onClose: () => void;
  modalRef?: React.RefObject<HTMLDivElement>;
};

export const DeleteErrorDialog = ({ isOpen, onClose, modalRef }: Props) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={() => {}}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content asChild>
          <Box className={styles.modal} ref={modalRef}>
            <Box className={styles.modalTitleBox}>
              <Dialog.Title className={styles.headerTitle}>
                こちらのステータスに紐づいている案件が存在するため、削除できません
              </Dialog.Title>
              <IconButton
                radius='full'
                variant='soft'
                onClick={onClose}
                style={{ cursor: 'pointer' }}
              >
                <span className={'material-icons'}>close</span>
              </IconButton>
            </Box>
            <Box>
              <Box className={styles.modalContent}>
                <Dialog.Description>
                  削除するには、こちらのステータスが紐づいている案件のステータスを変更してください
                </Dialog.Description>
              </Box>
              <Flex justify='center'>
                <Button onClick={onClose} style={{ fontWeight: 'bold', cursor: 'pointer' }}>
                  OK
                </Button>
              </Flex>
            </Box>
          </Box>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
