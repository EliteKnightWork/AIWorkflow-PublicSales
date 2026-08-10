import * as Dialog from '@radix-ui/react-dialog';
import { Box, IconButton } from '@radix-ui/themes';
import styles from './styles.module.css';

export type NotifyTitleRequiredDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  modalRef?: React.RefObject<HTMLDivElement>;
};

export const NotifyTitleRequiredDialog = ({
  isOpen,
  onClose,
  modalRef,
}: NotifyTitleRequiredDialogProps) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={() => {}}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content asChild>
          <Box className={styles.modal} ref={modalRef}>
            <Box className={styles.modalTitleBox}>
              <Dialog.Title className={styles.headerTitle}>保存できません</Dialog.Title>
              <IconButton radius='full' variant='soft' onClick={onClose}>
                <span className={'material-icons'}>close</span>
              </IconButton>
            </Box>
            <Box>
              <Box className={styles.modalContent}>
                <Dialog.Description>保存するには[タイトル]の入力が必要です。</Dialog.Description>
              </Box>
            </Box>
          </Box>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
