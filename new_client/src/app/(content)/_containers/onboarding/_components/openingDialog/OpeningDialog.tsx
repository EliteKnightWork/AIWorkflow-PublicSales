'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { useState } from 'react';
import styles from '../styles.module.css';

type Props = {
  onSubmit: () => void;
  onSkip: (isNotShownNext: boolean) => void;
};

export default function OpeningDialog({ onSubmit, onSkip }: Props) {
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isDisabled, setIsDisabled] = useState<boolean>(false);

  return (
    <Dialog.Root open={true} onOpenChange={() => {}}>
      {
        <Dialog.Portal forceMount>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content asChild>
            <Box className={styles.modal}>
              <Dialog.Title className={styles.title}>はじめましてLabidです！</Dialog.Title>
              <Box className={styles.content}>
                <Box className={styles.description}>
                  よりカンタンで、よりスマートな
                  <br />
                  入札業務であなたを落札に導きます&#x2728;
                  <br />
                  <br />
                  まずはあなたに適した案件をお伝えするために、ご希望の案件に関する情報を教えてください&#x1F4DD;
                </Box>
                <Box className={styles.buttonBox}>
                  <Button
                    className={styles.backButton}
                    onClick={() => {
                      setIsDisabled(true);
                      onSkip(isChecked);
                      setIsDisabled(false);
                    }}
                  >
                    スキップする
                  </Button>
                  <Button
                    className={styles.trailButton}
                    onClick={() => {
                      setIsDisabled(true);
                      onSubmit();
                      setIsDisabled(false);
                    }}
                  >
                    <Flex direction={'column'}>
                      <Text style={{ fontSize: '16px', margin: 0 }}>回答する</Text>
                    </Flex>
                  </Button>
                </Box>
                <Box className={styles.checkboxBox}>
                  <input
                    type='checkbox'
                    checked={isChecked}
                    onChange={(e) => {
                      setIsChecked(e.target.checked);
                    }}
                    disabled={isDisabled}
                  />
                  <Text
                    onClick={() => {
                      setIsChecked(!isChecked);
                    }}
                    className={styles.checkboxText}
                  >
                    今後表示しない
                  </Text>
                </Box>
              </Box>
            </Box>
          </Dialog.Content>
        </Dialog.Portal>
      }
    </Dialog.Root>
  );
}
