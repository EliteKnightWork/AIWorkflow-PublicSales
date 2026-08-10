import { Box } from '@radix-ui/themes';
import type React from 'react';
import SideMenu from '@/app/(content)/_components/sideMenu/sideMenu';
import { CONTENT_PAGE_MAIN_CONTAINER } from '@/constants';
import styles from './styles.module.css';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{ display: 'flex' }}>
      <Box className={styles.outline}>
        <Box className={styles.sideMenu}>
          <SideMenu />
        </Box>
        <Box
          height={'100%'}
          overflowY={'auto'}
          style={{ flex: 1 }}
          id={CONTENT_PAGE_MAIN_CONTAINER}
        >
          {children}
        </Box>
      </Box>
    </div>
  );
};

export default Layout;
