import { Badge, Flex, IconButton } from '@radix-ui/themes';
import styles from './styles.module.css';

type Props = {
  inputChips: string[];
  children?: React.ReactNode;
  onClickClose?: (id: number) => void;
};

export const ChipList = ({ inputChips, children, onClickClose }: Props) => {
  return (
    <Flex direction='row' align='center' className={styles.list}>
      {inputChips.map((chip, index) => (
        <Badge key={chip} className={styles.chip}>
          {chip}
          {onClickClose && (
            <IconButton
              onClick={() => {
                onClickClose(index);
              }}
              className={styles.iconButton}
            >
              <span className='material-icons' translate='no' aria-hidden='true'>
                close
              </span>
            </IconButton>
          )}
        </Badge>
      ))}

      {children}
    </Flex>
  );
};
