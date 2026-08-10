import * as Dialog from '@radix-ui/react-dialog';
import { Box, Button } from '@radix-ui/themes';
import styles from './styles.module.css';

type Props = {
  onSubmit: () => void;
  onCancel: () => void;
  title: string;
  description: string;
};

export default function ConfirmDialog({ onSubmit, onCancel, title, description }: Props) {
  return (
    <Dialog.Root open={true}>
      <Dialog.Portal forceMount>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content asChild>
          <Box className={styles.modal}>
            <Dialog.Title className={styles.title}>{title}</Dialog.Title>
            <Box className={styles.content}>
              <Box className={styles.description}>{description}</Box>
              <Box className={styles.buttonBox}>
                <Button className={styles.cancelButton} onClick={onCancel}>
                  戻る
                </Button>
                <Button className={styles.submitButton} onClick={onSubmit}>
                  中断する
                </Button>
              </Box>
            </Box>
          </Box>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
