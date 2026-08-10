'use client';
import { Box, Button, Flex, Link, Text } from '@radix-ui/themes';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SettingModal } from '@/app/(content)/_containers/setting-modal';
import { MenuButton } from '@/components/menuButton/MenuButton';
import { TrialButton } from '@/components/trialButton/TrialButton';
import SideMenuItemGroup from '../sideMenuItemGroup';
import type { ItemType } from '../types';
import styles from './styles.module.css';

export type Props = {
  isLogin: boolean;
};

export default function SideMenuPresentationSp(props: Props) {
  const router = useRouter();
  const [isExpand, setIsExpand] = useState(false);
  const [isOpenSettingModal, setIsOpenSettingModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // メニューの外をクリックしたら閉じる処理
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsExpand(false);
      }
    }

    if (isExpand) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpand]);

  // TODO: Temporary hidden for development
  // const mainItemList: ItemType[] = [
  //   {
  //     id: 'mypage',
  //     label: 'マイページ',
  //     link: '/mypage',
  //     icon: <span className={`material-icons ${styles.sideMenuIcon}`} translate="no" aria-hidden="true">contact_page</span>,
  //     showForUnauthenticated: false,
  //     isExpand: true,
  //   },
  // ];

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
      isExpand: true,
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
      isExpand: true,
    },
  ];
  const otherItemList: ItemType[] = [
    // {
    //   id: 'settings',
    //   label: '設定',
    //   icon: (
    //     <span className={`material-icons ${styles.sideMenuIcon}`} translate='no' aria-hidden='true'>
    //       settings
    //     </span>
    //   ),
    //   onClick: () => {
    //     if (!props.isLogin) {
    //       openCta();
    //       return;
    //     }
    //     setIsOpenSettingModal(true);
    //   },
    //   showForUnauthenticated: true,
    //   isExpand: true,
    // },
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
      isExpand: true,
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
      showForUnauthenticated: true,
      isExpand: true,
    },
  ];

  return (
    <>
      <SettingModal
        isOpen={isOpenSettingModal}
        onClose={() => {
          setIsOpenSettingModal(false);
        }}
      />
      <Box className={styles.header}>
        <Link href={props.isLogin ? '/projects' : '/'}>
          <Image src='/labid_logo_orange.png' alt='Labid' width={142} height={32} />
        </Link>
        <Box className={styles.headerMenu}>
          <MenuButton onClick={() => setIsExpand(true)} />
        </Box>
      </Box>
      {isExpand && (
        <Box className={styles.sideMenu} ref={menuRef}>
          {/* <SideMenuItemGroup isExpand={true} isLogin={props.isLogin} items={mainItemList} /> */}
          <SideMenuItemGroup
            title='管理'
            isExpand={true}
            isLogin={props.isLogin}
            items={managementItemList}
          />
          <SideMenuItemGroup
            title='さがす'
            isExpand={true}
            isLogin={props.isLogin}
            items={searchItemList}
          />
          <SideMenuItemGroup
            title='その他'
            isExpand={true}
            isLogin={props.isLogin}
            items={otherItemList}
          />

          {!props.isLogin && (
            <Flex direction='column' align='center' gap='4' pt='6'>
              <TrialButton width='80%' height='48px' />
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
                <Text>ログイン</Text>
                <span
                  className={`material-symbols-outlined ${styles.sideLoginIcon}`}
                  translate='no'
                  aria-hidden='true'
                >
                  login
                </span>
              </Button>
            </Flex>
          )}

          <Box pt={'8'}>
            <Flex direction={'column'} gap={'1'} className={styles.sideMenuFooter}>
              <Flex gap={'1'}>
                <Link size='1' target='_blank' href='https://nehan6.com/privacy'>
                  プライバシーポリシー
                </Link>
                <Link size='1' target='_blank' href='https://journal.labid.jp/termsofuse'>
                  利用規約
                </Link>
                <Link size='1' target='_blank' href='https://nehan6.com/'>
                  運営会社
                </Link>
              </Flex>
              <Flex gap={'1'}>
                <Link size='1' target='_blank' href='https://nehan6.com/tokushoho'>
                  特定商取引法に基づく表記
                </Link>
              </Flex>
              <Text size='1' style={{ paddingTop: 10 }}>
                © Nehan Inc. All right reserved.
              </Text>
            </Flex>
          </Box>
        </Box>
      )}
    </>
  );
}
