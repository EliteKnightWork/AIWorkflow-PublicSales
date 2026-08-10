import { Text } from '@radix-ui/themes';
import styles from './styles.module.css';

// ラジオボタン1つ分のProps
export type AppSwitchProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  name: string;
  value: string;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  inputClassName?: string;
};

export const AppSwitch = ({
  label,
  checked,
  onChange,
  name,
  value,
  disabled,
  className,
  onClick,
  inputClassName,
}: AppSwitchProps) => {
  return (
    <label
      className={[styles.radioLabel, className, disabled ? styles.disabled : '']
        .filter(Boolean)
        .join(' ')}
    >
      <input
        type='checkbox'
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(!checked)}
        onClick={onClick}
        disabled={disabled}
        className={`${styles.radioInput} ${inputClassName}`}
      />
      <Text size='3'>{label}</Text>
    </label>
  );
};
