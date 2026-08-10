import * as Dialog from '@radix-ui/react-dialog';
import { Box, IconButton, Link } from '@radix-ui/themes';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { WideDownloadButton } from '../downloadButton/WideDownloadButton';
import { WideTrialButton } from '../trialButton/WideTrialButton';
import styles from './styles.module.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  modalRef?: React.RefObject<HTMLDivElement>;
};

export default function MenuModal({ isOpen, onClose, modalRef }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      // モーダルが開かれた時にスクロール位置をリセット
      contentRef.current.scrollTop = 0;
    }
  }, [isOpen]);

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
                style={{ height: '100%' }}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                layout
                ref={modalRef}
              >
                <Box className={styles.modalOutline}>
                  <Box className={styles.header}>
                    <Image src='/labid_logo_orange.png' alt='Labid Logo' width={95} height={21} />
                    <IconButton variant='outline' size='2' onClick={onClose}>
                      <span className={'material-icons'} translate='no' aria-hidden='true'>
                        close
                      </span>
                    </IconButton>
                  </Box>
                  <Box className={styles.menu}>
                    <Link
                      className={styles.menuButton}
                      onClick={() => {
                        onClose();
                        const form = document.getElementById('service');
                        if (form) {
                          form.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    >
                      Labidとは
                    </Link>
                    <Link
                      className={styles.menuButton}
                      onClick={() => {
                        onClose();
                        const form = document.getElementById('problem');
                        if (form) {
                          form.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    >
                      お悩み
                    </Link>
                    <Link
                      className={styles.menuButton}
                      onClick={() => {
                        onClose();
                        const form = document.getElementById('solution');
                        if (form) {
                          form.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    >
                      ソリューション
                    </Link>
                    <Link
                      className={styles.menuButton}
                      onClick={() => {
                        onClose();
                        window.open('https://journal.labid.jp/', '_blank');
                      }}
                    >
                      Labid Journal
                    </Link>
                    <Link
                      className={styles.menuButton}
                      onClick={() => {
                        onClose();
                        window.open('https://nehan6.com/', '_blank');
                      }}
                    >
                      運営会社
                    </Link>
                  </Box>
                  <Box className={styles.menuButtons}>
                    <WideDownloadButton />
                    <WideTrialButton onClick={onClose} />
                  </Box>
                </Box>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
