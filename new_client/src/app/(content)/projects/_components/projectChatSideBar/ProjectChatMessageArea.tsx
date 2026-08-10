import { Box, Flex } from '@radix-ui/themes';
import ReactMarkdown from 'react-markdown';
import type { ProjectChat } from '@/api/generated/models';
import DotBounce from '@/app/(content)/projects/_components/projectChatSideBar/loading/dotbounce';
import { useToast } from '@/context/ToastContext';
import Button from '@/shared/Button/Button';
import styles from './messageStyles.module.css';

type Props = {
  messages?: ProjectChat[];
};

export const ProjectChatMessageArea = ({ messages }: Props) => {
  const { enqueueToast } = useToast();
  return (
    <Flex direction={'column'} gap='4' className={styles.messageArea}>
      {messages?.map((message) =>
        message.role === 'system' ? (
          <Flex direction={'row'} key={message.id}>
            <Box className={styles.systemMessage}>
              {message.value.length > 0 ? (
                <ReactMarkdown
                  components={{
                    a: ({ node, ...props }) => (
                      <a
                        {...props}
                        style={{ color: 'white', textDecoration: 'underline' }}
                        target='_blank'
                        rel='noopener noreferrer'
                      />
                    ),
                  }}
                >
                  {message.value}
                </ReactMarkdown>
              ) : (
                <DotBounce />
              )}
            </Box>
            <Box className={styles.copyButtonArea}>
              <Button
                variant='default'
                className={styles.copyButton}
                color='iris'
                radius='none'
                size='small'
                onClick={() => {
                  navigator.clipboard.writeText(message.value);
                  enqueueToast('コピーしました');
                }}
              >
                <span className='material-icons' translate='no' aria-hidden='true'>
                  content_copy
                </span>
              </Button>
            </Box>
          </Flex>
        ) : (
          <Box key={message.id} className={styles.userMessage}>
            {message.value}
          </Box>
        )
      )}
    </Flex>
  );
};
