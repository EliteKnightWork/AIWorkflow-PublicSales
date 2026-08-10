'use client';
import { useUser } from '@auth0/nextjs-auth0';
import { Box, Button, Flex, Heading, Text } from '@radix-ui/themes';
import { AnimatePresence, motion } from 'framer-motion';
import JSZip from 'jszip';
import { useEffect, useState } from 'react';
import type { Attachment, Project } from '@/api/generated/models';
import AppTooltip from '@/app/_components/tooltip/AppTooltip';
import { useCta } from '@/context/CtaContext';
import { getExtensionFromContentType } from '@/lib/getExtension';
import parentStyles from '../styles.module.css';
import styles from './styles.module.css';

type Props = {
  project: Project;
  attachments?: Attachment[];
  similarProjectsLink?: string;
  noAttachmentsMessage?: string;
};

export default function AttachmentCard(props: Props) {
  const [isExpand, setIsExpand] = useState(true);
  const [isFirstRender, setIsFirstRender] = useState(true);
  const { user } = useUser();
  const { openCta } = useCta();
  const hasAttachments = !!(props.attachments && props.attachments.length > 0);

  useEffect(() => {
    setIsFirstRender(false);
  }, []);

  const onClickDownLoad = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!user) {
      openCta();
      return;
    }

    if (!props.attachments) {
      return;
    }

    const zip = new JSZip();

    for (const attachment of props.attachments) {
      if (attachment.url && attachment.name) {
        const res = await fetch(attachment.url, {
          mode: 'cors',
          redirect: 'follow',
        });
        if (!res.ok) {
          console.error(`Failed to fetch ${attachment.url}`);
          continue;
        }
        const blob = await res.blob();

        const hasExtension = /\.([a-zA-Z]+)$/.test(attachment.name);
        if (!hasExtension) {
          const contentType = res.headers.get('content-type');
          if (contentType) {
            const ext = getExtensionFromContentType(contentType);
            if (ext) {
              zip.file(`${attachment.name}${ext}`, blob);
            }
          }
        } else {
          zip.file(attachment.name, blob);
        }
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    const url = window.URL.createObjectURL(content);
    a.href = url;
    a.download = `${props.project.title}_attachments.zip`;
    a.style.display = 'none';
    document.body.appendChild(a);

    a.click();

    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <Flex direction='column'>
      <Flex
        direction='row'
        justify='between'
        align='center'
        className={`${parentStyles.title} ${!isExpand && parentStyles.titleNotExpand}`}
        onClick={() => setIsExpand(!isExpand)}
      >
        <Flex direction='row' justify='center' align='center' gap='2'>
          <span
            className='material-icons'
            translate='no'
            aria-hidden='true'
            style={{ color: 'var(--app-orange-main)' }}
          >
            description
          </span>
          <Heading as='h2' size='4' weight='bold'>
            資料
          </Heading>
        </Flex>
        <Flex direction='row' justify='between' align='center' gap='4'>
          <Button className={styles.download} onClick={onClickDownLoad} disabled={!hasAttachments}>
            <Box className={styles.downLoadText}>
              <Text size='1' weight='bold'>
                一括ダウンロード
              </Text>
            </Box>
            <span className={`material-symbols-outlined ${styles.downloadIcon}`}>download</span>
          </Button>
          <Box className={parentStyles.expandIcon}>
            <span className='material-symbols-outlined'>
              {isExpand ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
            </span>
          </Box>
        </Flex>
      </Flex>
      <AnimatePresence>
        {isExpand && (
          <motion.div
            initial={isFirstRender ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <Flex direction='column' className={styles.body}>
              {!hasAttachments && (
                <Flex
                  className={`${hasAttachments ? styles.hasAttachmentsBox : styles.messageBox} messageBox`}
                  direction='row'
                  justify='center'
                  align='center'
                >
                  <Text
                    weight='bold'
                    style={{ textAlign: 'center' }} // テキスト自体も中央揃え
                  >
                    すみません...資料がみつかりませんでした😞
                    <br />
                    {props.noAttachmentsMessage ? (
                      props.noAttachmentsMessage
                    ) : (
                      <>
                        <a
                          href={props.similarProjectsLink ?? '#'}
                          style={{
                            color: 'var(--app-orange-main)',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            fontWeight: 700,
                          }}
                          className={styles.similarProjectsLink}
                        >
                          「類似の入札案件」
                        </a>
                        に資料があるかもしれません！
                      </>
                    )}
                  </Text>
                </Flex>
              )}
              <Box className={styles.attachmentsBox}>
                {props.attachments?.map((a) => (
                  <AppTooltip
                    // Avoid using the index of an array as key
                    key={crypto.randomUUID()}
                    triggerChildren={
                      user ? (
                        <a
                          href={a.url}
                          target='_blank'
                          rel='noreferrer nofollow'
                          className={styles.attachment}
                        >
                          <Flex direction='row' justify='between' align='center'>
                            <Text truncate>{a.name}</Text>
                            <span className='material-symbols-outlined'>open_in_new</span>
                          </Flex>
                        </a>
                      ) : (
                        <Box
                          className={styles.attachment}
                          onClick={(e) => {
                            e.stopPropagation();
                            openCta();
                          }}
                        >
                          <Flex direction='row' justify='between' align='center'>
                            <Heading truncate as='h3' size={'3'} style={{ fontWeight: 'normal' }}>
                              {a.name}
                            </Heading>
                            <span className='material-symbols-outlined'>open_in_new</span>
                          </Flex>
                        </Box>
                      )
                    }
                    content={<Text className={styles.tooltipText}>{a.name}</Text>}
                  />
                ))}
              </Box>
            </Flex>
          </motion.div>
        )}
      </AnimatePresence>
    </Flex>
  );
}
