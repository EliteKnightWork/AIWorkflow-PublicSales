import { Flex, Select } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import styles from './styles.module.css';

type RoundSelectProps = {
  value: string;
  label: string;
  options: {
    value: string;
    label: string;
  }[];
  onSelect: (value: string) => void;
  icon?: string;
  disabled?: boolean;
};

export const RoundSelect = ({
  value,
  label,
  options,
  onSelect,
  icon,
  disabled,
}: RoundSelectProps) => {
  const [displayTitle, setDisplayTitle] = useState('');

  useEffect(() => {
    setDisplayTitle(options.find((option) => option.value === value)?.label || '');
  }, [value, options]);

  return (
    <Select.Root value={value} onValueChange={onSelect} disabled={disabled}>
      <Select.Trigger className={styles.roundSelectTrigger} disabled={disabled}>
        <Flex direction={'row'} align={'center'}>
          {displayTitle}
          <span
            className={`material-symbols-outlined ${styles.buttonIcon}`}
            translate='no'
            aria-hidden='true'
          >
            {icon ?? 'expand_more'}
          </span>
        </Flex>
      </Select.Trigger>

      <Select.Content>
        <Select.Group>
          <Select.Label>{label}</Select.Label>
          {options.map((option) => (
            <Select.Item value={option.value} key={option.value}>
              {option.label}
            </Select.Item>
          ))}
        </Select.Group>
      </Select.Content>
    </Select.Root>
  );
};
