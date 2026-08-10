import * as Checkbox from '@radix-ui/react-checkbox';
import { Box, Flex, Text } from '@radix-ui/themes';
import styles from './styles.module.css';

type Props = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  preventLabelToggle?: boolean;
  onClickText?: () => void;
  separateTextAction?: boolean;
  checkboxClassName?: string;
  labelClassName?: string;
  rightComponent?: React.ReactNode;
  disabled?: boolean;
  parentBoxClassName?: string;
  parentBoxCheckedClassName?: string;
  checkBoxCheckedClassName?: string;
  checkedTextClassName?: string;
  hideIndicator?: boolean;
};

export const AppCheckbox = ({
  label,
  checked,
  onChange,
  preventLabelToggle,
  onClickText,
  separateTextAction,
  checkboxClassName,
  labelClassName,
  rightComponent,
  disabled,
  parentBoxClassName,
  parentBoxCheckedClassName,
  checkBoxCheckedClassName,
  checkedTextClassName,
  hideIndicator,
}: Props) => {
  return (
    <Flex
      align={'center'}
      className={`${styles.parentBox} ${parentBoxClassName} ${checked && (parentBoxCheckedClassName ?? styles.checked)}`}
      onClick={() => {
        !(preventLabelToggle || separateTextAction) && onChange(!checked);
        onClickText?.();
      }}
    >
      {!hideIndicator && (
        <Box className={styles.CheckboxLabel}>
          <Checkbox.Root
            className={`${styles.CheckboxRoot} ${checkboxClassName} ${disabled ? styles.disabledCheckBox : ''} ${checked ? (checkBoxCheckedClassName ?? styles.checked) : ''}`}
            checked={checked}
            onCheckedChange={(checked) =>
              (preventLabelToggle || separateTextAction) && onChange(checked === true)
            }
            onClick={(e) => (separateTextAction ? e.stopPropagation() : undefined)}
            disabled={disabled}
          >
            <Checkbox.Indicator className={styles.CheckboxIndicator}>
              <span
                className={`material-icons ${styles.checkIcon}`}
                translate='no'
                aria-hidden='true'
              >
                done
              </span>
            </Checkbox.Indicator>
          </Checkbox.Root>
        </Box>
      )}
      <Text
        className={`${styles.Label} ${labelClassName} ${disabled ? styles.disabledText : ''} ${checked && (checkedTextClassName ?? styles.checked)}`}
      >
        {label}
      </Text>
      {rightComponent}
    </Flex>
  );
};
