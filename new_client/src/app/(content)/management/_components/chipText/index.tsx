import { Box, Flex, Text } from '@radix-ui/themes';
import styles from './styles.module.css';

interface DateChipProps {
  date: string;
  iconName: string;
  color?: string;
  backgroundColor?: string;
}

const ChipText = ({ date, iconName, backgroundColor, color }: DateChipProps) => {
  return (
    <Box
      className={styles.dateChip}
      style={{
        backgroundColor: backgroundColor ?? 'var(--bg-color-modal)',
        color: color ?? 'var(--text-color-tertiary)',
      }}
    >
      <Flex align='center' gap='2'>
        <span
          className='material-icons'
          translate='no'
          aria-hidden='true'
          style={{ fontSize: '16px' }}
        >
          {iconName}
        </span>
        <Text className={styles.dateText}>{date}</Text>
      </Flex>
    </Box>
  );
};

export default ChipText;
