import { Box, Flex } from '@radix-ui/themes';

import SideMenuItem from './sideMenuItem';
import SideMenuItemLink from './sideMenuItemLink';
import styles from './styles.module.css';
import type { ItemType } from './types';

type Props = {
  title?: string;
  isExpand?: boolean;
  items: ItemType[];
  isLogin?: boolean;
};

const SideMenuItemGroup = (props: Props) => {
  const isDisplayed = () => {
    if (props.isLogin) {
      return true;
    }
    return props.items.filter((i) => i.showForUnauthenticated).length > 0;
  };

  return (
    <>
      {isDisplayed() && (
        <Box className={styles.sideMenuItemGroup}>
          {props.title && props.isExpand && (
            <Box className={styles.sideMenuItemTitle}>{props.title}</Box>
          )}
          <Flex direction={'column'}>
            {props.items
              .filter((item) => props.isLogin || item.showForUnauthenticated)
              .map((item) =>
                item.onClick ? (
                  <SideMenuItem key={item.id} item={item} />
                ) : (
                  <SideMenuItemLink key={item.id} item={item} />
                )
              )}
          </Flex>
        </Box>
      )}
    </>
  );
};

export default SideMenuItemGroup;
