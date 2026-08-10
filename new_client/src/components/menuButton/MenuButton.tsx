'use client';

import { Button } from '@radix-ui/themes';
import styles from './styles.module.css';

type Props = {
  onClick: () => void;
};

export function MenuButton({ onClick }: Props) {
  return (
    <Button variant='outline' className={styles.menuButton} onClick={onClick}>
      <span className='material-symbols-outlined' translate='no' aria-hidden='true'>
        menu
      </span>
    </Button>
  );
}
