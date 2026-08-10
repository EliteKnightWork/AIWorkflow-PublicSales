import { Box, Flex, TextArea } from '@radix-ui/themes';
import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from 'react';
import { SendButton } from '../../_atoms/sendButton/SendButton';
import styles from './styles.module.css';

type Props = {
  message: string;
  setMessage: Dispatch<SetStateAction<string>>;
  onSend: () => void;
};

const INPUT_MAXIMUM_LENGTH = 1000;

export const ChatInput = ({ message, setMessage, onSend }: Props) => {
  const [isComposing, setIsComposing] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textAreaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [message]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (isComposing) return; // avoid sending while IME composing
      e.preventDefault();
      void sendMessage();
    }
  };

  const sendMessage = () => {
    if (message.trim() === '') return;
    onSend();
  };

  return (
    <Box>
      <Flex direction={'row'} align='center' gap='2' className={styles.chatInput}>
        <TextArea
          size='3'
          className={styles.chatInputTextarea}
          ref={textAreaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          style={{
            resize: 'none',
            overflow: 'hidden',
            minHeight: 44,
            background: 'transparent',
          }}
          rows={1}
          color='red'
          maxLength={INPUT_MAXIMUM_LENGTH}
          aria-label='メッセージ入力'
          placeholder='知りたいことはありますか？'
          id='ChatInputTextArea'
        />
        <SendButton
          onClick={() => {
            sendMessage();
          }}
          disabled={message.trim() === ''}
        />
      </Flex>
      <Box className={styles.characterCount}>
        {message.length} / {INPUT_MAXIMUM_LENGTH}
      </Box>
    </Box>
  );
};
