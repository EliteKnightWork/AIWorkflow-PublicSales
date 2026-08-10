import * as Dialog from '@radix-ui/react-dialog';
import { Box, Flex, Select, Text } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { getV1ProposalTemplate, postProposalJob } from '@/api/generated/endpoints/default';
import type { Project, ProposalTemplate } from '@/api/generated/models';
import LoadingSpinner from '@/components/loadingSpinner/LoadingSpinner';
import { RoundButton } from '@/components/roundButton/RoundeButton';
import { useToast } from '@/context/ToastContext';
import styles from './styles.module.css';

const default_template_id = 'default';

export type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  project: Project;
};
export const ProposalCreateRequestDialog = ({ isOpen, onClose, project }: Props) => {
  const { enqueueToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);

  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getV1ProposalTemplate().then((res) => {
        setTemplates(res.templates);
      });
    }
  }, [isOpen]);

  const requestProposalCreate = () => {
    setIsLoading(true);

    if (templateId) {
      postProposalJob({
        project_uuid: project.uuid,
        ...(templateId !== default_template_id ? { template_id: Number.parseInt(templateId) } : {}),
      })
        .then(() => {
          enqueueToast(
            '叩き台作成のリクエストが完了しました。作成が完了したらメールでお知らせします。',
            'success'
          );
          onClose();
        })
        .catch((e) => {
          console.log(e);
          enqueueToast('叩き台作成のリクエストに失敗しました。', 'error');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={() => {}}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content asChild>
          <Box className={styles.modal}>
            <Box className={styles.modalTitleBox}>
              <Dialog.Title className={styles.headerTitle}>Labid AI叩き台作成（β版）</Dialog.Title>
            </Box>
            <Box>
              <Box className={styles.modalContent}>
                <Box>
                  <Text>仕様書と評価基準の内容をもとに提案書の叩き台を作成できます。</Text>
                </Box>

                <Flex align='center' direction='row' gap='2'>
                  <Text>テンプレート</Text>
                  <Select.Root value={templateId ?? ''} onValueChange={setTemplateId}>
                    <Select.Trigger className={styles.templateSelect} />
                    <Select.Content style={{ width: '100%', zIndex: 10000 }}>
                      <Select.Item key={default_template_id} value={default_template_id}>
                        デフォルトテンプレート
                      </Select.Item>

                      {templates.map((template) => (
                        <Select.Item key={template.id} value={template.id.toString()}>
                          {template.name}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Flex>

                <Flex justify={'center'} className={styles.buttonRow}>
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : (
                    <>
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
                        disabled={!templateId}
                        text='叩き台を作成する'
                        onClick={() => {
                          requestProposalCreate();
                        }}
                      />
                    </>
                  )}
                </Flex>
              </Box>
            </Box>
          </Box>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
