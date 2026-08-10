'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { Box, Button, Flex, IconButton, Text, TextArea } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import type { SearchFilterPreset } from '@/api/generated/models';
import { FormatDescriptionSelect } from '@/app/(content)/_components/formatDescriptionSelect/FormatDescriptionSelect';
import styles from './styles.module.css';

type Props = {
  preset: SearchFilterPreset;
  onNext: (preset: SearchFilterPreset) => void;
  onBack: () => void;
  onClose: () => void;
};

export default function BusinessDescriptionDialog({ preset, onNext, onBack, onClose }: Props) {
  const [targetPreset, setTargetPreset] = useState<SearchFilterPreset>({} as SearchFilterPreset);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (preset) {
      setTargetPreset(preset);
    }
  }, [preset]);

  return (
    targetPreset && (
      <Dialog.Root open={true} onOpenChange={() => {}}>
        {
          <Dialog.Portal forceMount>
            <Dialog.Overlay className={styles.overlay} />
            <Dialog.Content asChild>
              <Box className={styles.modal}>
                <Box className={styles.modalTitleBox}>
                  <IconButton
                    variant='outline'
                    size='2'
                    onClick={onClose}
                    className={styles.closeButton}
                  >
                    <span className={'material-icons'}>close</span>
                  </IconButton>
                </Box>
                <Dialog.Title className={styles.title}>
                  事業内容を入力しましょう！
                  <br />
                  あなたにピッタリな案件をおすすめします&#x1F4A1;
                </Dialog.Title>

                <Box className={styles.formBox}>
                  <Flex align='center' justify='between'>
                    <Text className={styles.formTitle}>事業内容</Text>
                    <FormatDescriptionSelect
                      onSelectDescription={(description) => {
                        setTargetPreset({
                          ...targetPreset,
                          businessDescription: description,
                        });
                      }}
                    />
                  </Flex>
                  <TextArea
                    variant='classic'
                    className={styles.textArea}
                    placeholder={
                      '例：SNS、特にInstagramを活用した観光地や産品のプロモーション業務\nポイント：1事業ごとにより業務内容を具体的に記載することで精度高く情報をイチオシできる可能性が高まります'
                    }
                    value={targetPreset.businessDescription ?? ''}
                    onChange={(e) => {
                      setTargetPreset({
                        ...targetPreset,
                        businessDescription: e.target.value,
                      });
                    }}
                  />

                  <Box className={styles.buttonBox}>
                    <Button className={styles.backButton} onClick={onBack}>
                      戻る
                    </Button>
                    <Button
                      className={styles.nextButton}
                      disabled={isLoading}
                      onClick={() => {
                        setIsLoading(true);
                        try {
                          const preset = {
                            ...targetPreset,
                            filter: {
                              ...targetPreset.filter,
                            },
                          };
                          onNext(preset);
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                    >
                      次へ
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Dialog.Content>
          </Dialog.Portal>
        }
      </Dialog.Root>
    )
  );
}
