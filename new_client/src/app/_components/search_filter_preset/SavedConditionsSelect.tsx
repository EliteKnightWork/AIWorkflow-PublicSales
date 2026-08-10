'use client';
import { Box, Button, Text } from '@radix-ui/themes';
import styles from './styles.module.css';

type Props = {
  value: string | undefined;
  onOpenPresetList: () => void;
  hasPresets: boolean;
};

export const SavedConditionsSelect = ({ value, onOpenPresetList, hasPresets }: Props) => {
  return (
    <Box>
      {hasPresets ? (
        <Button
          variant='outline'
          className={styles.select}
          onClick={onOpenPresetList}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ textAlign: 'left' }}>
            {value ? `選択中の保存条件: ${value}` : '選択してください'}
          </span>
          <span
            className='material-icons'
            style={{ fontSize: '20px', color: 'var(--text-color-secondary)' }}
          >
            keyboard_arrow_right
          </span>
        </Button>
      ) : (
        <Box className={styles.noPresetBox}>
          <Text>おや？保存条件が存在しないようです🤔</Text>
          <Text>条件を保存すると選択できるようになります</Text>
        </Box>
      )}
    </Box>
  );
};
