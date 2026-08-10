import { Box, Button, Flex, IconButton, Text } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import {
  deleteV1ProposalTemplateId,
  getV1ProposalTemplate,
  postV1ProposalTemplate,
} from '@/api/generated/endpoints/default';
import type { ProposalTemplate as Template } from '@/api/generated/models/proposalTemplate';
import { useToast } from '@/context/ToastContext';
import styles from './styles.module.css';

export default function ProposalTemplate() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const { enqueueToast } = useToast();

  useEffect(() => {
    getV1ProposalTemplate()
      .then((res) => {
        setTemplates(res.templates);
      })
      .catch(() => {
        enqueueToast('提案書テンプレートの取得に失敗しました。');
      });
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);

      if (files.length > 0) {
        const file = files[0];

        // パワーポイントファイルのみ許可
        if (
          file.type !==
            'application/vnd.openxmlformats-officedocument.presentationml.presentation' &&
          file.type !== 'application/vnd.ms-powerpoint'
        ) {
          enqueueToast('ファイル形式が不正です。パワーポイントファイルのみアップロード可能です');
          return;
        }

        // ファイルのサイズが1GBを超えていないか確認
        if (file.size > 1024 * 1024 * 1024) {
          enqueueToast('ファイルサイズが1GBを超えています');
          return;
        }

        postV1ProposalTemplate({
          file: file,
        })
          .then((res) => {
            setTemplates([res, ...templates]);
            enqueueToast('提案書テンプレートの登録が完了しました');
          })
          .catch(() => {
            enqueueToast('提案書テンプレートの登録に失敗しました');
          })
          .finally(() => {
            e.target.value = '';
          });
      }
    }
  };

  return (
    <Box className={styles.proposalTemplateArea}>
      <Box className={styles.messageArea}>
        <Text>
          入札案件の提案書作成機能で使用するためのテンプレートファイルを登録してください。
        </Text>
        <br />
        <Text>・.pptxファイルあるいは.pptファイルのみアップロード可能</Text>
        <br />
        <Text>・ファイルサイズは1GBまで</Text>
      </Box>

      <Button
        onClick={() => document.getElementById('fileInput')?.click()}
        className={styles.addTemplateButton}
      >
        <span className='material-icons' translate='no' aria-hidden='true'>
          add
        </span>
        テンプレートを追加
      </Button>
      <input id='fileInput' type='file' hidden onChange={handleFileSelect} />

      <Box className={styles.templateListArea}>
        {templates.map((template) => {
          return (
            <Flex
              key={template.id}
              className={styles.templateItem}
              justify='between'
              align='center'
            >
              <Button
                variant='ghost'
                className={styles.templateFileNameButton}
                onClick={() => {
                  window.open(template.url, '_blank');
                }}
              >
                <span className='material-icons' translate='no' aria-hidden='true'>
                  file_download
                </span>
                <Text as='p'>{template.name}</Text>
              </Button>

              <IconButton
                variant='ghost'
                onClick={() => {
                  deleteV1ProposalTemplateId(template.id.toString())
                    .then(() => {
                      enqueueToast('提案書テンプレートの削除が完了しました');
                      setTemplates(templates.filter((t) => t.id !== template.id));
                    })
                    .catch(() => {
                      enqueueToast('提案書テンプレートの削除に失敗しました');
                    });
                }}
                className={styles.closeButton}
              >
                <span className='material-icons' translate='no' aria-hidden='true'>
                  close
                </span>
              </IconButton>
            </Flex>
          );
        })}
      </Box>
    </Box>
  );
}
