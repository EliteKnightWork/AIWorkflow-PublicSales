import { Button } from '@radix-ui/themes';
import styles from './styles.module.css';

type Props = {
  onClick: () => void;
  disabled?: boolean;
};

export const SendButton = ({ onClick, disabled = false }: Props) => {
  return (
    <Button variant='ghost' onClick={onClick} className={styles.sendButton} disabled={disabled}>
      <span className='material-icons' translate='no' aria-hidden='true'>
        send
      </span>
    </Button>
  );
};
