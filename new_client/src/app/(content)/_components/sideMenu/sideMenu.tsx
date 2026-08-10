import { Box } from '@radix-ui/themes';
import { CONTENT_SIDEMENU_PREFIX } from '@/constants';
import { getCachedSession } from '@/lib/auth0';
import { getIsServerSideMobile } from '@/utils/deviceUtils';
import SideMenuPresentation from './presentation';
import SideMenuPresentationSp from './sp/presentationSp';
import styles from './styles.module.css';

const SideMenu = async () => {
  const session = await getCachedSession();
  const isLogin = !!session;
  const isMobile = await getIsServerSideMobile();

  return (
    <>
      {isMobile ? (
        <Box className={styles.sp} id={`${CONTENT_SIDEMENU_PREFIX}-sp`}>
          <SideMenuPresentationSp isLogin={isLogin} />
        </Box>
      ) : (
        <Box className={styles.pc} id={CONTENT_SIDEMENU_PREFIX}>
          <SideMenuPresentation isLogin={isLogin} />
        </Box>
      )}
    </>
  );
};

export default SideMenu;
