import { Text } from '@radix-ui/themes';
import styles from './styles.module.css';

// ラジオボタン1つ分のProps
export type AppRadioProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  name: string;
  value: string;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  inputClassName?: string;
  parentClassName?: string;
};

export const AppRadio = ({
  label,
  checked,
  onChange,
  name,
  value,
  disabled,
  className,
  onClick,
  inputClassName,
  parentClassName,
}: AppRadioProps) => {
  return (
    <label
      className={[styles.radioLabel, className, disabled ? styles.disabled : '', parentClassName]
        .filter(Boolean)
        .join(' ')}
    >
      <input
        type='radio'
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(true)}
        onClick={onClick}
        disabled={disabled}
        className={`${styles.radioInput} ${inputClassName}`}
      />
      <Text size='3'>{label}</Text>
    </label>
  );
};
