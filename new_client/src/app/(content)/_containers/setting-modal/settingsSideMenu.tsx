'use client';
import { Box, Button, Dialog, Flex } from '@radix-ui/themes';
import { useGetMyCompany } from '@/api/generated/endpoints/companies';
import { FeatureKey } from '@/api/generated/models';
import SideMenuItemGroup from '../../_components/sideMenu/sideMenuItemGroup';
import type { ItemType } from '../../_components/sideMenu/types';
import styles from './styles.module.css';
import { SettingsTabType } from './types';

type Props = {
  type: SettingsTabType;
  onChangeMenu: (type: SettingsTabType) => void;
};

export default function SettingsSideMenu({ type, onChangeMenu }: Props) {
  const { data: myCompany } = useGetMyCompany();

  const mainItemList: ItemType[] = [
    {
      id: SettingsTabType.MYINFO,
      label: '会員情報',
      onClick: () => {
        onChangeMenu(SettingsTabType.MYINFO);
      },
      icon: (
        <span className={`material-icons ${styles.sideMenuIcon}`} translate='no' aria-hidden='true'>
          account_circle
        </span>
      ),
      isSelected: type === SettingsTabType.MYINFO,
      showForUnauthenticated: false,
      isExpand: true,
    },
    {
      id: SettingsTabType.RECOMMEND,
      label: 'イチオシ案件',
      onClick: () => {
        onChangeMenu(SettingsTabType.RECOMMEND);
      },
      helpMessageTitle: 'イチオシ案件とは',
      helpMessage: '事業内容をもとに、あなたにイチオシしたい案件をAIがおすすめします',
      isSelected: type === SettingsTabType.RECOMMEND,
      icon: (
        <span className={`material-icons ${styles.sideMenuIcon}`} translate='no' aria-hidden='true'>
          auto_awesome
        </span>
      ),
      showForUnauthenticated: false,
      isExpand: true,
    },
    {
      id: SettingsTabType.CUSTOM_OBJECT,
      label: 'カスタム項目',
      onClick: () => {
        onChangeMenu(SettingsTabType.CUSTOM_OBJECT);
      },
      isSelected: type === SettingsTabType.CUSTOM_OBJECT,
      icon: (
        <span className={`material-icons ${styles.sideMenuIcon}`} translate='no' aria-hidden='true'>
          contact_page
        </span>
      ),
      showForUnauthenticated: false,
      isExpand: true,
    },
    {
      id: SettingsTabType.NOTIFICATION,
      label: '新着案件通知',
      onClick: () => {
        onChangeMenu(SettingsTabType.NOTIFICATION);
      },
      isSelected: type === SettingsTabType.NOTIFICATION,
      icon: (
        <span className={`material-icons ${styles.sideMenuIcon}`} translate='no' aria-hidden='true'>
          email
        </span>
      ),
      showForUnauthenticated: false,
      isExpand: true,
    },
    {
      id: SettingsTabType.TASK_NOTIFICATION,
      label: 'タスク通知',
      onClick: () => {
        onChangeMenu(SettingsTabType.TASK_NOTIFICATION);
      },
      isSelected: type === SettingsTabType.TASK_NOTIFICATION,
      icon: (
        <span className={`material-icons ${styles.sideMenuIcon}`} translate='no' aria-hidden='true'>
          notifications
        </span>
      ),
      showForUnauthenticated: false,
      isExpand: true,
    },
    {
      id: SettingsTabType.MEMBER,
      label: 'メンバー',
      onClick: () => {
        onChangeMenu(SettingsTabType.MEMBER);
      },
      isSelected: type === SettingsTabType.MEMBER,
      icon: (
        <span className={`material-icons ${styles.sideMenuIcon}`} translate='no' aria-hidden='true'>
          people
        </span>
      ),
      showForUnauthenticated: false,
      isExpand: true,
    },
    {
      id: SettingsTabType.TEMPLATE,
      label: '提案書テンプレート',
      onClick: () => {
        onChangeMenu(SettingsTabType.TEMPLATE);
      },
      isSelected: type === SettingsTabType.TEMPLATE,
      icon: (
        <span className={`material-icons ${styles.sideMenuIcon}`} translate='no' aria-hidden='true'>
          folder_open
        </span>
      ),
      showForUnauthenticated: false,
      isExpand: true,
      hidden: !myCompany?.features?.some((f) => f.key === FeatureKey.proposal_document_create),
    },
  ];

  return (
    <Flex className={styles.sideMenu} px={'5'} py={'4'} direction={'column'} display={'flex'}>
      <Flex direction={'row'} align={'center'} pb={'7'} className={styles.sideMenuTitle}>
        <span
          className={`material-icons ${styles.sideMenuTitleIcon}`}
          translate='no'
          aria-hidden='true'
        >
          settings
        </span>
        <Dialog.Title>設定</Dialog.Title>
      </Flex>
      <Flex direction={'column'} gap={'1'}>
        <SideMenuItemGroup
          isExpand={true}
          isLogin={true}
          items={mainItemList.filter((i) => !i.hidden)}
        />
      </Flex>
      <Box className={styles.sideMenuFooter}>
        <Button
          variant='ghost'
          className={styles.sideMenuFooterButton}
          onClick={() => {
            const params = new URLSearchParams({
              returnTo: `${process.env.NEXT_PUBLIC_CLIENT_BASE_URL}/logout`,
            });
            window.location.href = `/auth/logout?${params.toString()}`;
          }}
        >
          ログアウト
        </Button>
      </Box>
    </Flex>
  );
}
