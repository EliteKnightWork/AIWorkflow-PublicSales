import { Button, Text } from '@radix-ui/themes';
import styles from './styles.module.css';

type Props = {
  text: string;
  icon: string;
  onClick: () => void;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
};

export const ActionIconButton = ({
  icon,
  onClick,
  text,
  backgroundColor,
  textColor,
  borderColor,
}: Props) => {
  return (
    <Button
      className={styles.actionIconButton}
      onClick={onClick}
      style={{ backgroundColor, color: textColor, borderColor }}
    >
      <span className='material-icons' translate='no' aria-hidden='true'>
        {icon}
      </span>
      <Text>{text}</Text>
    </Button>
  );
};
