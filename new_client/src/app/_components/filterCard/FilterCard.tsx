'use client';
import { Box, Text } from '@radix-ui/themes';
import styles from './styles.module.css';

type Props = {
  title: string;
  children: React.ReactNode;
};

export const FilterCard = ({ title, children }: Props) => {
  return (
    <Box>
      <Box className={styles.colorBox}>
        <Text className={styles.cardTitle}>{title}</Text>
      </Box>
      <Box className={styles.whiteBox}>{children}</Box>
    </Box>
  );
};
