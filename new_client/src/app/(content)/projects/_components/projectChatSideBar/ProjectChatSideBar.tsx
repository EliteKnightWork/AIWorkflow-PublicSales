import { Box, Button, Flex, Text } from '@radix-ui/themes';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ChatRole, type ProjectChat } from '@/api/generated/models';
import { ChatInput } from '@/app/_components/_molecules/chatInput/ChatInput';
import DotBounce from '@/app/(content)/projects/_components/projectChatSideBar/loading/dotbounce';
import { useToast } from '@/context/ToastContext';
import { BreathingAnimation } from './animation/breathingAnimation/BreathingAnimation';
import { ProjectChatMessageArea } from './ProjectChatMessageArea';
import styles from './styles.module.css';

type Props = {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  isAbbreviated?: boolean;
};

type LinkParseStage = 'idle' | 'linkText' | 'awaitingUrlStart' | 'linkUrl';
type LinkParseState = {
  stage: LinkParseStage;
  linkStartIndex: number | null;
};

export const ProjectChatSideBar = ({ projectId, isOpen, onClose, isAbbreviated }: Props) => {
  const { enqueueToast } = useToast();
  const chatAreaRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ProjectChat[]>([]);

  // チャット履歴が更新されたときに一番下にスクロール
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      getChatHistory();
    }
  }, [isOpen]);

  // メッセージ履歴を取得
  const getChatHistory = () => {
    setLoading(true);
    fetch(`/api/chat?projectId=${projectId}`, {
      method: 'GET',
    })
      .then(async (res) => {
        const response = await res.json();
        const chat_history = response.data.chat_history as ProjectChat[];
        setMessages(
          chat_history.sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        );
      })
      .finally(() => setLoading(false));
  };

  const sendMessage = async () => {
    const message = inputMessage;
    setInputMessage('');
    const provisionalIdForUser = messages.length + 1;
    const provisionalId = messages.length + 2;
    setMessages((prev) => [
      ...prev,
      {
        id: provisionalIdForUser,
        created_at: new Date().toISOString(),
        role: ChatRole.user,
        value: message,
      },
      {
        id: provisionalId,
        created_at: new Date().toISOString(),
        role: ChatRole.system,
        value: '',
      },
    ]);

    try {
      const stream = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ projectId, message: message }),
      });

      if (!stream || !stream.body) {
        enqueueToast('エラーが発生しました。(No response)');
        return;
      }

      let messageText = '';
      let lastEmittedValue = '';
      const linkState: LinkParseState = { stage: 'idle', linkStartIndex: null };

      const isEscaped = (text: string, index: number) => {
        let slashCount = 0;
        for (let i = index - 1; i >= 0 && text[i] === '\\'; i -= 1) {
          slashCount += 1;
        }
        return slashCount % 2 === 1;
      };

      const updateLinkState = (char: string) => {
        const currentIndex = messageText.length - 1;
        const escaped = isEscaped(messageText, currentIndex);

        switch (linkState.stage) {
          case 'idle':
            if (!escaped && char === '[') {
              linkState.stage = 'linkText';
              linkState.linkStartIndex = currentIndex;
            }
            break;
          case 'linkText':
            if (!escaped && char === '[') {
              linkState.linkStartIndex = currentIndex;
            }
            if (!escaped && char === ']') {
              linkState.stage = 'awaitingUrlStart';
            }
            break;
          case 'awaitingUrlStart':
            if (!escaped && char === '(') {
              linkState.stage = 'linkUrl';
            } else if (!/\s/.test(char)) {
              linkState.stage = 'idle';
              linkState.linkStartIndex = null;
            }
            break;
          case 'linkUrl':
            if (!escaped && char === ')') {
              linkState.stage = 'idle';
              linkState.linkStartIndex = null;
            }
            break;
          default:
            break;
        }
      };

      // ストリームからチャンクごとにテキストを受信して処理する
      const reader = stream.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !doneReading });

          for (const char of chunk) {
            messageText += char;
            updateLinkState(char);
          }

          const safeText =
            linkState.linkStartIndex !== null
              ? messageText.slice(0, linkState.linkStartIndex)
              : messageText;

          if (safeText !== lastEmittedValue) {
            lastEmittedValue = safeText;
            setMessages((prev) =>
              prev.map((chat) => (chat.id === provisionalId ? { ...chat, value: safeText } : chat))
            );
          }
        }
      }

      if (messageText !== lastEmittedValue) {
        setMessages((prev) =>
          prev.map((chat) => (chat.id === provisionalId ? { ...chat, value: messageText } : chat))
        );
      }
    } catch (error) {
      console.error('チャット送信エラー:', error);
      enqueueToast('エラーが発生しました。(Unexpected Error)');
    } finally {
      // setIsLoading(false);
      console.log('pass');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Box>
      {
        // fixedの際に親要素と並べるための仮のBox
        !isAbbreviated && <Box className={styles.ProjectChatSideBar} />
      }
      <Box
        className={`${styles.ProjectChatSideBar} ${isAbbreviated ? '' : styles.ProjectChatSideBarFixed}`}
      >
        {/* Breathingアニメーションを背景として追加 */}
        <Box className={styles.absoluteBreathingBackgroundBox}>
          <BreathingAnimation />
        </Box>
        <Flex direction='column' gap='4' className={styles.sidebarColumn}>
          <Flex className={styles.chatHeader} justify='between' align='center'>
            <Flex align='center'>
              <Image
                src='/LabidIcon.svg'
                alt='Labidロゴ'
                width={32}
                height={32}
                style={{ marginRight: '8px' }}
              />
              <Text>Labid Assistant</Text>
            </Flex>
            <Button variant='ghost' onClick={onClose} className={styles.CloseButton}>
              <span
                className='material-icons'
                translate='no'
                aria-hidden='true'
                style={{ fontSize: '32px' }}
              >
                close
              </span>
            </Button>
          </Flex>

          {messages.length > 0 ? (
            <>
              <Box className={`${styles.chatBody} ${styles.chatBodyFullHeight}`} ref={chatAreaRef}>
                <ProjectChatMessageArea messages={messages} />
              </Box>
              <Box
                className={`${styles.chatInput} ${messages.length > 0 ? styles.chatInputFixed : ''}`}
              >
                <ChatInput
                  message={inputMessage}
                  setMessage={setInputMessage}
                  onSend={sendMessage}
                />
              </Box>
            </>
          ) : (
            <Flex
              direction={'column'}
              style={{ marginBlock: 'auto', gap: '40px', overflowY: 'auto' }}
            >
              <Box className={`${styles.chatBody}`}>
                {loading ? (
                  <Flex style={{ margin: '16px' }} justify={'center'}>
                    <DotBounce />
                  </Flex>
                ) : (
                  <Text>Labidが書類の読み取りをサポート</Text>
                )}
              </Box>
              <Box
                className={`${styles.chatInput} ${messages.length > 0 ? styles.chatInputFixed : ''}`}
              >
                <ChatInput
                  message={inputMessage}
                  setMessage={setInputMessage}
                  onSend={sendMessage}
                />
              </Box>
              {!loading && (
                <>
                  <Box style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                    例えば・・・
                  </Box>
                  <Flex direction={'column'} justify={'center'} align={'center'} gap={'4'}>
                    <Button
                      className={styles.messageExampleButton}
                      onClick={() => {
                        setInputMessage('具体的な業務内容は？');
                      }}
                    >
                      具体的な業務内容は？
                    </Button>
                    <Button
                      className={styles.messageExampleButton}
                      onClick={() => {
                        setInputMessage('契約期間は？');
                      }}
                    >
                      契約期間は？
                    </Button>
                    <Button
                      className={styles.messageExampleButton}
                      onClick={() => {
                        setInputMessage('参加に必要な書類とタスクをまとめて教えて');
                      }}
                    >
                      参加に必要な書類とタスクを
                      <br />
                      まとめて教えて
                    </Button>
                  </Flex>
                </>
              )}
            </Flex>
          )}
        </Flex>
      </Box>
    </Box>
  );
};
