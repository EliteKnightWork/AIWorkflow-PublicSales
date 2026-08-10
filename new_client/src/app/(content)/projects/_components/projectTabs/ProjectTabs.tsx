import * as Tabs from '@radix-ui/react-tabs';
import type React from 'react';
import { type Aggregation, type Pagination, ProjectStatusTab } from '@/api/generated/models';
import { BidIcon } from '@/components/projectIcon/BidIcon';
import { CloseIcon } from '@/components/projectIcon/CloseIcon';
import { OpenIcon } from '@/components/projectIcon/OpenIcon';
import { useCta } from '@/context/CtaContext';
import styles from './styles.module.css';

interface ProjectTabsProps {
  nodes: {
    tab1: React.ReactNode;
    tab2: React.ReactNode;
    tab3: React.ReactNode;
    tab4: React.ReactNode;
  };
  pagination: Pagination;
  aggregate: Aggregation | null;
  onChangeTab?: (tab: ProjectStatusTab) => void;
  tab: ProjectStatusTab;
  isSp?: boolean;
  isLogin: boolean;
  disableTabs?: boolean;
}

const ProjectTabs: React.FC<ProjectTabsProps> = ({
  nodes,
  aggregate,
  pagination,
  onChangeTab,
  tab,
  isSp,
  isLogin,
  disableTabs,
}) => {
  const { openCta } = useCta();

  return (
    <Tabs.Root className={styles.TabsRoot} value={tab}>
      <Tabs.List className={styles.TabsList} aria-label='Manage your account'>
        <Tabs.Trigger
          className={styles.TabsTrigger}
          value={ProjectStatusTab.all}
          disabled={disableTabs}
          onClick={() => {
            if (!isLogin) {
              openCta();
              return;
            }

            onChangeTab?.(ProjectStatusTab.all);
          }}
        >
          すべて
          {!isSp && `(${aggregate?.all ?? '-'})`}
        </Tabs.Trigger>
        <Tabs.Trigger
          className={styles.TabsTrigger}
          value={ProjectStatusTab.open}
          disabled={disableTabs}
          onClick={() => {
            if (!isLogin) {
              openCta();
              return;
            }

            onChangeTab?.(ProjectStatusTab.open);
          }}
        >
          <OpenIcon />
          受付中
          {!isSp && `(${aggregate?.open ?? '-'})`}
        </Tabs.Trigger>
        <Tabs.Trigger
          className={styles.TabsTrigger}
          value={ProjectStatusTab.closed}
          disabled={disableTabs}
          onClick={() => {
            if (!isLogin) {
              openCta();
              return;
            }
            onChangeTab?.(ProjectStatusTab.closed);
          }}
        >
          <CloseIcon />
          受付終了
          {!isSp && `(${aggregate?.closed ?? '-'})`}
        </Tabs.Trigger>
        <Tabs.Trigger
          className={styles.TabsTrigger}
          value={ProjectStatusTab.awarded}
          disabled={disableTabs}
          onClick={() => {
            if (!isLogin) {
              openCta();
              return;
            }
            onChangeTab?.(ProjectStatusTab.awarded);
          }}
        >
          <BidIcon />
          落札案件
          {!isSp &&
            `(${
              aggregate?.awarded === 0
                ? 0
                : (aggregate?.awarded ??
                  (tab === ProjectStatusTab.awarded ? (pagination?.count ?? 0) : '-'))
            }
          )`}
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content className={styles.TabsContent} value={ProjectStatusTab.all}>
        {nodes.tab1}
      </Tabs.Content>
      <Tabs.Content className={styles.TabsContent} value={ProjectStatusTab.open}>
        {nodes.tab2}
      </Tabs.Content>
      <Tabs.Content className={styles.TabsContent} value={ProjectStatusTab.closed}>
        {nodes.tab3}
      </Tabs.Content>
      <Tabs.Content className={styles.TabsContent} value={ProjectStatusTab.awarded}>
        {nodes.tab4}
      </Tabs.Content>
    </Tabs.Root>
  );
};

export default ProjectTabs;
