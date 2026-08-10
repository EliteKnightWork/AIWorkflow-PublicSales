'use client';
import { ja } from 'date-fns/locale';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Box } from '@radix-ui/themes';
import styles from './styles.module.css';

type Props = {
  placeholderText?: string;
  minDate?: Date;
  maxDate?: Date;
  value?: Date;
  onChange?: (date: Date | null) => void;
  inputClassName?: string;
};

export const AppDatePicker = ({
  placeholderText,
  minDate,
  maxDate,
  value,
  onChange,
  inputClassName,
}: Props) => {
  registerLocale('ja', ja as any);

  return (
    <Box className={styles.datepickerWrapper}>
      <DatePicker
        selected={value}
        minDate={minDate}
        maxDate={maxDate}
        onChange={(date) => onChange?.(date)}
        dateFormat='yyyy/MM/dd'
        placeholderText={placeholderText ?? '日付を選択'}
        locale='ja'
        customInput={<input className={`${styles.input} ${inputClassName}`} />}
      />
    </Box>
  );
};
