'use client';
import { Box } from '@radix-ui/themes';
import { FreeDemoCta } from '@/components/freeDemoCta/FreeDemoCta';
import styles from './styles.module.css';

type Props = {
  backgroundImage?: string;
  onClose?: () => void;
  isDialog?: boolean;
};

export default function LimitedPage({ backgroundImage, onClose, isDialog }: Props) {
  return (
    <Box
      className={isDialog ? styles.limitedDialogContainer : styles.limitedContainer}
      style={{ backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none' }}
    >
      <FreeDemoCta isDialog={isDialog} onClose={onClose} />
    </Box>
  );
}
