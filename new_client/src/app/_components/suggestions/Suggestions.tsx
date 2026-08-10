import { Box } from '@radix-ui/themes';
import type { JSX } from 'react';
import styles from './styles.module.css';

type Props = {
  element: JSX.Element;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
};

export default function Suggestions({ element, onKeyDown }: Props) {
  return (
    <Box
      className={styles.suggestions}
      tabIndex={0}
      onKeyDown={(e) => {
        onKeyDown?.(e);
      }}
    >
      {element}
    </Box>
  );
}
