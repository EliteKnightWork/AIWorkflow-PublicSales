'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { useState } from 'react';
import LoadingSpinner from '@/components/loadingSpinner/LoadingSpinner';
import styles from '../styles.module.css';

type Props = {
  onSubmit: () => Promise<void>;
};

export default function CompleteDialog({ onSubmit }: Props) {
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  return (
    <Dialog.Root open={true} onOpenChange={() => {}}>
      {
        <Dialog.Portal forceMount>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content asChild>
            <Box className={`${styles.modal} ${styles.complete}`}>
              <Dialog.Title className={styles.title}>おつかれさまでした&#x1F389;</Dialog.Title>
              <Box className={styles.content}>
                <Box className={styles.description}>
                  案件をさがす準備が整いました！
                  <br />
                  <br />
                  それでは、落札に向けてがんばりましょう！
                </Box>
                <Box className={styles.buttonBox}>
                  {isSubmitted ? (
                    <Flex justify={'center'} align={'center'} width={'100%'}>
                      <LoadingSpinner />
                    </Flex>
                  ) : (
                    <Button
                      className={styles.trailButton}
                      disabled={isSubmitted}
                      onClick={async () => {
                        setIsSubmitted(true);
                        await onSubmit();
                      }}
                    >
                      <Flex direction={'column'}>
                        <Text style={{ fontSize: '16px', margin: 0 }}>Labidの利用を開始する</Text>
                      </Flex>
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          </Dialog.Content>
        </Dialog.Portal>
      }
    </Dialog.Root>
  );
}
