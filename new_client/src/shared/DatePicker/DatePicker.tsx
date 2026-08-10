'use client';

import { ja } from 'date-fns/locale';
import DatePicker, { registerLocale } from 'react-datepicker';
import styles from './datePicker.module.css';
import 'react-datepicker/dist/react-datepicker.css';
import { Box } from '@radix-ui/themes';
import type { Ref } from 'react';

registerLocale('ja', ja as any);

export type DatePickerProps = {
  /** 選択された日付 */
  selected?: Date | null;
  /** 日付変更時のコールバック */
  onChange?: (date: Date | null) => void;
  /** プレースホルダー */
  placeholder?: string;
  /** 無効化 */
  disabled?: boolean;
  /** 最小日付 */
  minDate?: Date;
  /** 最大日付 */
  maxDate?: Date;
  /** 日付フォーマット */
  dateFormat?: string;
  /** ref */
  ref?: Ref<HTMLInputElement>;
  /** カスタムクラス名 */
  className?: string;
};

/**
 * 日付選択コンポーネント
 */
export default function DatePickerComponent({
  selected,
  onChange,
  placeholder = '選択してください',
  disabled = false,
  minDate,
  maxDate,
  dateFormat = 'yyyy/MM/dd',
  ref,
  className,
}: DatePickerProps) {
  return (
    <Box className={`${styles.datePicker} ${className ?? ''}`}>
      <Box className={styles.datePickerWrapper} ref={ref}>
        <DatePicker
          selected={selected}
          onChange={onChange}
          minDate={minDate}
          maxDate={maxDate}
          disabled={disabled}
          placeholderText={placeholder}
          dateFormat={dateFormat}
          locale='ja'
          className={styles.datePickerInput}
        />
        <span className={`material-icons ${styles.calendarIcon}`} translate='no' aria-hidden='true'>
          calendar_today
        </span>
      </Box>
    </Box>
  );
}
