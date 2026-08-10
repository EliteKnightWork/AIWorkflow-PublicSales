import { Badge, Flex, IconButton } from '@radix-ui/themes';
import type { SearchInputChip } from '../../model';
import styles from './styles.module.css';

type Props = {
  inputChips: SearchInputChip[];
  children: React.ReactNode;
  onClickClose: (chip: SearchInputChip) => void;
};

export const SuggestionChipList = ({ inputChips, children, onClickClose }: Props) => {
  return (
    <Flex direction='row' align='center' className={styles.suggestionList}>
      {inputChips.map((chip) => (
        <Badge key={chip.value} className={styles.suggestionChip}>
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
};
