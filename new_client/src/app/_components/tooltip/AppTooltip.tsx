import * as Tooltip from '@radix-ui/react-tooltip';
import styles from './styles.module.css';

type Props = {
  triggerChildren: React.ReactNode;
  content: React.ReactNode;
};

export default function AppTooltip({ triggerChildren, content }: Props) {
  return (
    <Tooltip.Provider delayDuration={100}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{triggerChildren}</Tooltip.Trigger>
        <Tooltip.Content className={styles.tooltip} side='top' align='center'>
          {content}
          <Tooltip.Arrow className={styles.Arrow} />
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
