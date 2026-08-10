import { Box, Flex, Text } from '@radix-ui/themes';
import { AppRadio } from '@/components/radiobutton/AppRadio';
import styles from './styles.module.css';

type Props = {
  value?: number;
  onChange: (value?: number) => void;
};

export const DeadlineDaysSelect = ({ value, onChange }: Props) => {
  const deadlineOptions = [
    { value: 7, label: '1週間以上' },
    { value: 14, label: '2週間以上' },
    { value: 21, label: '3週間以上' },
  ];

  return (
    <Box className={styles.formBox}>
      <Text className={styles.formTitle}>締切日</Text>
      <Flex direction={'column'} gap={'0px'}>
        <Flex direction={'row'} justify={'start'} align={'center'}>
          <input
            className={styles.input}
            type='number'
            placeholder='日数を入力'
            min='0'
            value={value !== undefined ? value.toString() : ''}
            onChange={(e) => {
              const inputValue = Number(e.target.value);
              onChange(inputValue > 0 ? inputValue : undefined);
            }}
            style={{ width: '120px' }}
          />
          <Text style={{ marginLeft: '16px' }}>日以上</Text>
        </Flex>
        <Flex direction={'row'} gap={'12px'} wrap={'wrap'} style={{ marginBlock: '24px' }}>
          {deadlineOptions.map((option) => (
            <AppRadio
              key={option.value}
              name='deadlineDays'
              value={option.value.toString()}
              label={option.label}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              inputClassName={styles.input}
            />
          ))}
        </Flex>
      </Flex>
    </Box>
  );
};
