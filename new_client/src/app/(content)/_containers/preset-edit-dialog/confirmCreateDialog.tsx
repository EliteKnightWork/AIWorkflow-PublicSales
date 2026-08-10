import * as Dialog from '@radix-ui/react-dialog';
import { Box, Flex } from '@radix-ui/themes';
import type { SearchFilterPreset } from '@/api/generated/models';
import { RoundButton } from '@/components/roundButton/RoundeButton';
import { PresetInfoCard } from '../../_components/presetInfoCard/PresetInfoCard';
import styles from './styles.module.css';

export type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  preset: SearchFilterPreset;
};

export const ConfirmCreateDialog = ({ isOpen, onConfirm, onClose, preset }: Props) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={() => {}}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content asChild>
          <Box className={styles.modal}>
            <Box className={styles.modalTitleBox}>
              <Dialog.Title className={styles.headerTitle}>
                同じタイトルの保存条件があります。新規追加しますか？
              </Dialog.Title>
            </Box>
            <Box>
              <Box className={styles.modalContent}>
                <Box className={styles.presetInfoBox}>
                  <PresetInfoCard targetPreset={preset} />
                </Box>

                <Flex justify={'center'} className={styles.buttonRow}>
                  <RoundButton
                    buttonClassName={styles.createButton}
                    hideIcon
                    text='キャンセル'
                    onClick={() => {
                      onClose();
                    }}
                  />
                  <RoundButton
                    buttonClassName={styles.editButton}
                    hideIcon
                    text='新規で保存条件に追加する'
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
