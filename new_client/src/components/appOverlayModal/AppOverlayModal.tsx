import * as Dialog from '@radix-ui/react-dialog';
import { Box, IconButton } from '@radix-ui/themes';
import type { Responsive } from '@radix-ui/themes/dist/esm/props/prop-def.js';
import { AnimatePresence, motion } from 'framer-motion';
import { type JSX, useRef } from 'react';
import styles from './styles.module.css';

type Props = {
  title: string;
  contentComponent: JSX.Element | null;
  isOpen: boolean;
  onClose: () => void;
  modalHeight?: string;
  modalRef?: React.RefObject<HTMLDivElement | null>;
  footerComponent?: JSX.Element;
  modalWidth?: Responsive<string>;
};

export default function AppOverlayModal({
  title,
  contentComponent,
  isOpen,
  onClose,
  modalHeight,
  modalRef,
  footerComponent,
  modalWidth = '50vw',
}: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <AnimatePresence mode='wait'>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className={styles.overlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className={styles.modal}
                style={{ height: modalHeight ?? '90%' }}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                layout
                ref={modalRef}
              >
                <Box className={styles.modalTitleBox} width={modalWidth}>
                  <Dialog.Title>{title}</Dialog.Title>
                  <IconButton
                    variant='outline'
                    size='2'
                    onClick={onClose}
                    className={styles.closeButton}
                  >
                    <span className={'material-icons'} translate='no' aria-hidden='true'>
                      close
                    </span>
                  </IconButton>
                </Box>
                <Box className={styles.modalContentBox} ref={contentRef}>
                  <Box className={styles.modalContent} maxWidth={modalWidth}>
                    {contentComponent}
                  </Box>
                </Box>
                {footerComponent && <Box className={styles.modalFooter}>{footerComponent}</Box>}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
