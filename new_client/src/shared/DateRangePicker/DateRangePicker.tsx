'use client';

import { ja } from 'date-fns/locale';
import DatePicker, { registerLocale } from 'react-datepicker';
import styles from './dateRangePicker.module.css';
import 'react-datepicker/dist/react-datepicker.css';
import { Box } from '@radix-ui/themes';

registerLocale('ja', ja as any);

export type DateRangePickerProps = {
  /** 開始日 */
  startDate?: Date | null;
  /** 終了日 */
  endDate?: Date | null;
  /** 開始日変更時のコールバック */
  onStartDateChange?: (date: Date | null) => void;
  /** 終了日変更時のコールバック */
  onEndDateChange?: (date: Date | null) => void;
  /** 日付範囲変更時のコールバック */
  onChange?: (startDate: Date | null, endDate: Date | null) => void;
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
  /** カスタムクラス名 */
  className?: string;
};

/**
 * 日付範囲選択コンポーネント
 */
export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onChange,
  placeholder = '選択してください',
  disabled = false,
  minDate,
  maxDate,
  dateFormat = 'yyyy/MM/dd',
  className,
}: DateRangePickerProps) {
  const handleStartDateChange = (date: Date | null) => {
    onStartDateChange?.(date);
    onChange?.(date, endDate ?? null);
  };

  const handleEndDateChange = (date: Date | null) => {
    onEndDateChange?.(date);
    onChange?.(startDate ?? null, date);
  };

  return (
    <Box className={`${styles.dateRangePicker} ${className ?? ''}`}>
      <Box className={styles.datePickerWrapper}>
        <DatePicker
          selected={startDate}
          onChange={handleStartDateChange}
          selectsStart
          startDate={startDate ?? undefined}
          endDate={endDate ?? undefined}
          minDate={minDate}
          maxDate={endDate ?? maxDate}
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
      <span className={styles.separator}>〜</span>
      <Box className={styles.datePickerWrapper}>
        <DatePicker
          selected={endDate}
          onChange={handleEndDateChange}
          selectsEnd
          startDate={startDate ?? undefined}
          endDate={endDate ?? undefined}
          minDate={startDate ?? minDate}
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
