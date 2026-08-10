import * as Dialog from '@radix-ui/react-dialog';
import { Box } from '@radix-ui/themes';
import SettingModalContainer from './container';
import styles from './styles.module.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const SettingModal = ({ isOpen, onClose }: Props) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content asChild className={styles.modal}>
          <Box className={styles.modalContentBox}>
            <SettingModalContainer />
          </Box>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
