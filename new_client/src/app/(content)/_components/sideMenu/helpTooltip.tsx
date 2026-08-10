import * as Tooltip from '@radix-ui/react-tooltip';
import { Strong } from '@radix-ui/themes';
import styles from './styles.module.css';

type Props = {
  title?: string;
  message: string;
};

const HelpTooltip = (props: Props) => {
  return (
    <Tooltip.Provider delayDuration={100}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span className={`material-symbols-outlined ${styles.sideMenuIconHelp}`}>help</span>
        </Tooltip.Trigger>
        <Tooltip.Content className={styles.tooltip} side='top' align='center'>
          {props.title && (
            <>
              <Strong>{props.title}</Strong>
              <br />
            </>
          )}
          {props.message}
          <Tooltip.Arrow className={styles.tooltipArrow} />
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

export default HelpTooltip;
