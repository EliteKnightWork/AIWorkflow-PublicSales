import { Box, Flex } from '@radix-ui/themes';
import styles from './styles.module.css';

type Props = {
  title: string;
  content: React.ReactNode;
};

export default function SearchItemCard({ title, content }: Props) {
  return (
    <Flex direction={'column'} className={styles.searchItemCard}>
      <Box className={styles.searchItemHeader}>{title}</Box>
      <Box className={styles.searchItemContent}>{content}</Box>
    </Flex>
  );
}
