import { Box, Flex, Text } from '@radix-ui/themes';
import styles from './styles.module.css';

export type ButtonType = 'round' | 'square';

type Props = {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  hideIcon?: boolean;
  buttonType?: ButtonType;
  inputClassName?: string;
  error?: string;
  containerClassName?: string;
};

export default function AppInput({
  placeholder,
  value,
  onChange,
  onBlur,
  disabled,
  hideIcon,
  buttonType = 'round',
  inputClassName,
  error,
  containerClassName,
}: Props) {
  return (
    <Flex direction='column'>
      <Box
        className={`${styles.AppInputBox} ${buttonType === 'round' ? styles.roundInputBox : styles.squareInputBox} ${containerClassName ?? ''}`}
      >
        <Flex className={styles.inputWrapper}>
          {!hideIcon && (
            <span className='material-icons-outlined' translate='no' aria-hidden='true'>
              search
            </span>
          )}
          <input
            type='text'
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onBlur={() => onBlur?.()}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key !== 'Enter' || e.nativeEvent.isComposing) {
                return;
              }
              (e.target as HTMLInputElement).blur();
            }}
            className={`${styles.AppInput} ${inputClassName}`}
            disabled={disabled}
          />
        </Flex>
      </Box>
      {error && <Text color='red'>{error}</Text>}
    </Flex>
  );
}
