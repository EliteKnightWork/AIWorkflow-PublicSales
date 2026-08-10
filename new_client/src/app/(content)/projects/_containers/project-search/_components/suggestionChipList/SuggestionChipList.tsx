import { Badge, Flex, IconButton } from '@radix-ui/themes';
import AppTooltip from '@/app/_components/tooltip/AppTooltip';
import type { SearchInputChip } from '../../model';
import styles from './styles.module.css';

type Props = {
  showSuggestions: boolean;
  inputChips: SearchInputChip[];
  children: React.ReactNode;
  onClickClose: (chip: SearchInputChip) => void;
  onClickValues: () => void;
};

export const SuggestionChipList = ({
  showSuggestions,
  inputChips,
  children,
  onClickClose,
  onClickValues,
}: Props) => {
  if (showSuggestions) {
    return (
      <Flex direction='row' align='center' className={styles.suggestionList}>
        {inputChips.map((chip) => (
          <Badge key={chip.keyName + chip.value} className={styles.suggestionChip}>
            {chip.keyName}: {chip.displayValue}
            <IconButton
              onClick={() => {
                onClickClose(chip);
              }}
              className={styles.iconButton}
            >
              <span className='material-icons' translate='no' aria-hidden='true'>
                close
              </span>
            </IconButton>
          </Badge>
        ))}

        {children}
      </Flex>
    );
  }
  // keyNameごとにグループ化
  const grouped = inputChips.reduce<Record<string, SearchInputChip[]>>((acc, chip) => {
    if (!acc[chip.keyName]) acc[chip.keyName] = [];
    acc[chip.keyName].push(chip);
    return acc;
  }, {});
  return (
    <Flex direction='row' align='center' className={styles.suggestionList}>
      {Object.entries(grouped).map(([keyName, chips]) => {
        const values = chips.map((c) => c.displayValue);
        let displayValues = values.slice(0, 3).join(' ');
        if (values.length > 3) {
          displayValues += ` +${values.length - 3}`;
        }
        return (
          <AppTooltip
            key={keyName}
            triggerChildren={
              <Badge className={styles.suggestionChip} onClick={onClickValues}>
                {keyName}: {displayValues}
              </Badge>
            }
            content={<span>{values.join(' ')}</span>}
          />
        );
      })}

      {children}
    </Flex>
  );
};
