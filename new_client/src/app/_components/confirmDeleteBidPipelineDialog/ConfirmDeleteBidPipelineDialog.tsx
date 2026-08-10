import * as Dialog from '@radix-ui/react-dialog';
import { Box, Button, Flex, IconButton, Text } from '@radix-ui/themes';
import { useBidPipeline } from '@/context/BidPipelineContext';
import styles from './styles.module.css';

export default function ConfirmDeleteBidPipelineDialog() {
  const {
    confirmDeleteBidPipelineInfo,
    closeConfirmDeleteBidPipelineDialog,
    handleRemoveBidPipeline,
  } = useBidPipeline();

  if (!confirmDeleteBidPipelineInfo) return null;

  if (!confirmDeleteBidPipelineInfo.pipelineId) {
    // 削除されるパイプラインがないので、ダイアログを表示せず削除実行
    handleRemoveBidPipeline(confirmDeleteBidPipelineInfo.pipelineId)
      .then(() => {
        confirmDeleteBidPipelineInfo.callback();
        closeConfirmDeleteBidPipelineDialog();
      })
      .catch(() => {
        confirmDeleteBidPipelineInfo.errorCallback();
      });
    return null;
  }

  return (
    <Dialog.Root open={!!confirmDeleteBidPipelineInfo} onOpenChange={() => {}}>
      {!!confirmDeleteBidPipelineInfo && (
        <Dialog.Portal forceMount>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content asChild>
            <Box className={styles.modal}>
              <Box className={styles.modalTitleBox}>
                <Dialog.Title>案件管理から解除しますか？</Dialog.Title>
                <IconButton
                  variant='outline'
                  size='2'
                  onClick={closeConfirmDeleteBidPipelineDialog}
                >
                  <span className={'material-icons'}>close</span>
                </IconButton>
              </Box>
              <Box className={styles.modalContentBox}>
                <Box className={styles.modalContent}>
                  <Text className={styles.contentText}>
                    案件管理から解除すると、案件に紐づけられているタスクも削除されます。
                  </Text>
                  <Box className={styles.buttonBox}>
                    <Button
                      className={styles.cancelButton}
                      onClick={() => {
                        closeConfirmDeleteBidPipelineDialog();
                      }}
                    >
                      <Text style={{ fontSize: '14px', margin: 0 }}>キャンセル</Text>
                    </Button>
                    <Button
                      className={styles.removeButton}
                      onClick={async () => {
                        handleRemoveBidPipeline(confirmDeleteBidPipelineInfo.pipelineId)
                          .then(() => {
                            confirmDeleteBidPipelineInfo.callback();
                            closeConfirmDeleteBidPipelineDialog();
                          })
                          .catch(() => {
                            confirmDeleteBidPipelineInfo.errorCallback();
                          });
                      }}
                    >
                      <Flex direction={'column'}>
                        <Text style={{ fontSize: '14px', margin: 0 }}>解除する</Text>
                      </Flex>
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Dialog.Content>
        </Dialog.Portal>
      )}
    </Dialog.Root>
  );
}
