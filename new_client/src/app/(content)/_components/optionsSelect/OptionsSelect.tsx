import { Button, DropdownMenu } from '@radix-ui/themes';
import styles from './styles.module.css';

type Props = {
  buttonClassName?: string;
  buttonIconString?: string;
  contentClassName?: string;
  contentAlign?: 'start' | 'center' | 'end';
  itemsClassName?: string;
  items: Array<{
    label: string;
    onClick: () => void;
    className?: string;
  }>;
};

export const OptionsSelect = ({
  buttonClassName = '',
  buttonIconString = 'more_horiz',
  contentClassName = '',
  contentAlign = 'start',
  itemsClassName = '',
  items = [],
}: Props) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant='ghost' className={buttonClassName}>
          <span className='material-icons' translate='no' aria-hidden='true'>
            {buttonIconString}
          </span>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        align={contentAlign}
        color='gray'
        variant='soft'
        className={`${styles.content} ${contentClassName}`}
      >
        {items.map((item) => (
          <DropdownMenu.Item
            key={item.label}
            className={`${styles.optionItem} ${itemsClassName} ${item.className}`}
            onSelect={(e) => {
              e.preventDefault();
              item.onClick();
            }}
          >
            {item.label}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
