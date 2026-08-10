'use client';
import { Box, Button, Flex, Link, Text } from '@radix-ui/themes';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { SettingModal } from '@/app/(content)/_containers/setting-modal';
import { useCta } from '@/context/CtaContext';
import SideMenuItemGroup from './sideMenuItemGroup';
import styles from './styles.module.css';
import type { ItemType } from './types';

export type Props = {
  isLogin: boolean;
};

export default function SideMenuPresentation(props: Props) {
  const router = useRouter();
  const { openCta } = useCta();
  const pathName = usePathname();
  const [isExpand, setIsExpand] = useState(true);
  const [isOpenSettingModal, setIsOpenSettingModal] = useState(false);

  const mainItemList: ItemType[] = [
    {
      id: 'mypage',
      label: 'マイページ',
      link: '/mypage',
      icon: (
        <span className={`material-icons ${styles.sideMenuIcon}`} translate='no' aria-hidden='true'>
          contact_page
        </span>
      ),
      showForUnauthenticated: false,
      isExpand: isExpand,
    },
  ];

  const managementItemList: ItemType[] = [
    {
      id: 'management',
      label: '案件管理',
      link: '/management',
      icon: (
        <span className={`material-icons ${styles.sideMenuIcon}`} translate='no' aria-hidden='true'>
          description
        </span>
      ),
      showForUnauthenticated: false,
      isExpand: isExpand,
    },
  ];

  const searchItemList: ItemType[] = [
    {
      id: 'projects',
      label: '案件',
      link: '/projects',
      icon: (
        <span className={`material-icons ${styles.sideMenuIcon}`} translate='no' aria-hidden='true'>
          work
        </span>
      ),
      showForUnauthenticated: true,
      isExpand: isExpand,
    },
    {
      id: 'bidCompanies',
      label: '参加企業',
      link: props.isLogin ? '/bidCompanies' : undefined,
      onClick: !props.isLogin && !pathName.includes('/limited') ? () => openCta() : undefined,
      icon: (
        <span className={`material-icons ${styles.sideMenuIcon}`} translate='no' aria-hidden='true'>
          apartment
        </span>
      ),
      showForUnauthenticated: true,
      isExpand: isExpand,
    },
    {
      id: 'organizations',
      label: '発注機関',
      link: props.isLogin ? '/organizations' : undefined,
      onClick: !props.isLogin && !pathName.includes('/limited') ? () => openCta() : undefined,
      icon: (
        <span className={`material-icons ${styles.sideMenuIcon}`} translate='no' aria-hidden='true'>
          account_balance
        </span>
      ),
      showForUnauthenticated: true,
      isExpand: isExpand,
    },
  ];

  const dataLibraryItemList: ItemType[] = [
    {
      id: 'companyInformation',
      label: '基本情報',
      link: '/companyInformation',
      icon: (
        <span
          className={`material-symbols-outlined ${styles.sideMenuIcon}`}
          translate='no'
          aria-hidden='true'
          style={{ fontVariationSettings: '"FILL" 1' }}
        >
          lab_profile
        </span>
      ),
      showForUnauthenticated: false,
      isExpand: isExpand,
    },
  ];

  const otherItemList: ItemType[] = [
    {
      id: 'settings',
      label: '設定',
      icon: (
        <span className={`material-icons ${styles.sideMenuIcon}`} translate='no' aria-hidden='true'>
          settings
        </span>
      ),
      onClick: () => {
        if (!props.isLogin) {
          if (pathName.includes('/limited')) {
            return;
          }
          openCta();
          return;
        }
        setIsOpenSettingModal(true);
      },
      showForUnauthenticated: true,
      isExpand: isExpand,
    },
    {
      id: 'inquiry',
      label: 'お問い合わせ',
      link: 'https://nehan6.com/inquiry',
      target: '_blank',
      icon: (
        <span className={`material-icons ${styles.sideMenuIcon}`} translate='no' aria-hidden='true'>
          mail
        </span>
      ),
      showForUnauthenticated: true,
      isExpand: isExpand,
    },
    {
      id: 'guide',
      label: 'Labidご利用ガイド',
      link: 'https://nehan6.notion.site/Labid-a6eaff1dc6a449c9ad47872b1ec5113e',
      target: '_blank',
      icon: (
        <span className={`material-icons ${styles.sideMenuIcon}`} translate='no' aria-hidden='true'>
          info
        </span>
      ),
      showForUnauthenticated: false,
      isExpand: isExpand,
    },
    // {
    //   id: 'specification',
    //   label: '仕様書を取得する',
    //   // FIXME: Replace google form link
    //   link: '',
    //   target: '_blank',
    //   icon: <span className={`material-symbols-outlined ${styles.sideMenuIcon}`} translate="no" aria-hidden="true">open_in_new</span>,
    //   showForUnauthenticated: true,
    //   isExpand: isExpand,
    // },
  ];

  return (
    <Flex
      className={isExpand ? styles.sideMenu : styles.sideMenuNotExpand}
      px={'5'}
      py={'4'}
      direction={'column'}
      display={'flex'}
    >
      <SettingModal
        isOpen={isOpenSettingModal}
        onClose={() => {
          setIsOpenSettingModal(false);
        }}
      />
      <Flex direction={'row'} gap={'1'} align={'center'} pb={'5'} justify={'between'}>
        {isExpand && (
          <Link href={props.isLogin ? '/mypage' : '/'}>
            <Image src='/labid_logo_orange.png' alt='Labid' width={64} height={14} />
          </Link>
        )}
        {props.isLogin && (
          <Button
            className={styles.sideMenuButton}
            onClick={() => setIsExpand(!isExpand)}
            style={{ border: 0 }}
          >
            <span
              className={`material-symbols-outlined ${styles.sideMenuIcon}`}
              translate='no'
              aria-hidden='true'
            >
              {isExpand ? 'keyboard_arrow_left' : 'keyboard_arrow_right'}
            </span>
          </Button>
        )}
      </Flex>

      <Flex direction='column' gap='5'>
        <SideMenuItemGroup isExpand={isExpand} isLogin={props.isLogin} items={mainItemList} />
        <SideMenuItemGroup
          title='管理'
          isExpand={isExpand}
          isLogin={props.isLogin}
          items={managementItemList}
        />
        <SideMenuItemGroup
          title='さがす'
          isExpand={isExpand}
          isLogin={props.isLogin}
          items={searchItemList}
        />
        <SideMenuItemGroup
          title='データライブラリ'
          isExpand={isExpand}
          isLogin={props.isLogin}
          items={dataLibraryItemList}
        />
        <SideMenuItemGroup
          title='その他'
          isExpand={isExpand}
          isLogin={props.isLogin}
          items={otherItemList}
        />
        {!props.isLogin && (
          <Flex direction='column' gap='4'>
            <Button
              className={styles.sideLoginButton}
              onClick={() => {
                // 現在のパスを取得してURLエンコード
                const currentPath = encodeURIComponent(
                  window.location.pathname + window.location.search
                );
                router.push(`/login?redirect_to=${currentPath}`);
              }}
            >
              <Flex direction='row' gap='1' align='center'>
                <Text>ログイン</Text>
                <span
                  className={`material-symbols-outlined ${styles.sideLoginIcon}`}
                  translate='no'
                  aria-hidden='true'
                >
                  login
                </span>
              </Flex>
            </Button>
          </Flex>
        )}
      </Flex>
      {isExpand && (
        <Box pt={'8'} style={{ marginTop: 'auto' }}>
          <Flex direction={'column'} gap={'1'} align={'center'} className={styles.sideMenuFooter}>
            <Flex gap={'1'}>
              <Link size='1' target='_blank' href='https://nehan6.com/privacy'>
                プライバシーポリシー
              </Link>
              <Link size='1' target='_blank' href='https://journal.labid.jp/termsofuse'>
                利用規約
              </Link>
            </Flex>
            <Flex gap={'1'}>
              <Link size='1' target='_blank' href='https://nehan6.com/'>
                運営会社
              </Link>
              <Link size='1' target='_blank' href='https://nehan6.com/tokushoho'>
                特定商取引法に基づく表記
              </Link>
            </Flex>
            <Text size='1' style={{ paddingTop: 10 }}>
              © Nehan Inc. All right reserved.
            </Text>
          </Flex>
        </Box>
      )}
    </Flex>
  );
}
