import { Grid, Link, Text } from '@radix-ui/themes';
import { usePathname } from 'next/navigation';
import HelpTooltip from './helpTooltip';
import styles from './styles.module.css';
import type { ItemType } from './types';

type Props = {
  item: ItemType;
};

const SideMenuItemLink = (props: Props) => {
  const pathName = usePathname();
  const isSelected = props.item.isSelected || pathName === props.item.link;

  return (
    <Link
      target={props.item.target}
      href={props.item.link || ''}
      className={`${props.item.isExpand ? styles.sideMenuItem : styles.sideMenuItemNotExpand} ${isSelected ? styles.sideMenuItemSelected : styles.sideMenuItemUnselected}`}
    >
      {props.item.isExpand ? (
        <Grid
          columns={'3'}
          gap={'1'}
          rows={'1'}
          align={'center'}
          style={{
            gridTemplateColumns: props.item.helpMessage ? '2fr 7fr 1fr' : '2fr 8fr',
            alignItems: 'center',
          }}
        >
          {props.item.icon}
          <Text wrap={'nowrap'}>
            {props.item.label}
            {props.item.helpMessageTitle}
          </Text>
          {props.item.helpMessage && (
            <HelpTooltip title={props.item.helpMessageTitle} message={props.item.helpMessage} />
          )}
        </Grid>
      ) : (
        <Grid columns={'1'} align={'center'}>
          {props.item.icon}
        </Grid>
      )}
    </Link>
  );
};

export default SideMenuItemLink;
