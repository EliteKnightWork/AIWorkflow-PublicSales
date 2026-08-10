import { Box, Button, Text } from '@radix-ui/themes';
import { useEffect, useRef, useState } from 'react';
import styles from './SaveConditionTitleDialog.module.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string) => void;
};

export default function SaveConditionTitleDialog({ isOpen, onClose, onSave }: Props) {
  const [title, setTitle] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSave = () => {
    if (title.trim()) {
      onSave(title);
      setTitle('');
    }
  };

  const handleClose = () => {
    setTitle('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Box className={styles.dialogOverlay}>
      <Box ref={dialogRef} className={styles.dialog}>
        <div className={styles.dialogHeader}>
          <Text className={styles.dialogTitle}>保存条件のタイトルを入力してください</Text>
          <Button className={styles.closeButton} onClick={handleClose} aria-label='閉じる'>
            <span className='material-icons'>close</span>
          </Button>
        </div>
        <Box className={styles.dialogContent}>
          <input
            type='text'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='タイトルを入力'
            className={styles.input}
          />
          <Button
            size='3'
            className={styles.saveButton}
            onClick={handleSave}
            disabled={!title.trim()}
          >
            保存する
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
