'use client';
import * as Tabs from '@radix-ui/react-tabs';
import { Box, Flex, Text } from '@radix-ui/themes';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useLayoutEffect, useState, useTransition } from 'react';
import { useToast } from '@/context/ToastContext';
import { TabType } from '../../types';
import { PipelineManagementPresentational } from '../pipelineManagement/presentational';
import { TaskManagementPresentational } from '../taskManagement/presentational';
import styles from './styles.module.css';

type Props = {
  type?: TabType;
};

export default function ManagementScreen({ type }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { enqueueToast } = useToast();
  const [_isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabType>(type ?? TabType.PIPELINE);

  useEffect(() => {
    setActiveTab(type ?? TabType.PIPELINE);
  }, [type]);

  useLayoutEffect(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('authentication_error');
    const newUrl = newParams.toString() ? `/management?${newParams.toString()}` : '/management';

    window.history.replaceState(null, '', newUrl);
  });

  useEffect(() => {
    const authenticationError = searchParams.get('authentication_error');
    const authenticationStarted = localStorage.getItem('authentication_started');

    if (authenticationError && authenticationStarted) {
      let errorMessage = '';
      switch (authenticationError) {
        case 'email_mismatch':
          errorMessage =
            'アカウント連携に失敗しました。labidに登録しているメールアドレスで連携を行なってください';
          break;
        case 'save_failed':
          errorMessage = 'アカウント連携に失敗しました。しばらく時間をおいてから再度お試しください';
          break;
        default:
          errorMessage = 'アカウント連携に失敗しました';
      }

      enqueueToast(errorMessage, 'error');
      localStorage.removeItem('authentication_started');
    }
  }, [searchParams, enqueueToast]);

  const handleTabChange = (value: TabType) => {
    // 即座にタブを切り替え
    setActiveTab(value);

    // バックグラウンドでURL更新
    startTransition(() => {
      const params = new URLSearchParams();
      params.set('type', value === TabType.PIPELINE ? TabType.PIPELINE : TabType.TASKS);
      router.push(`/management?${params.toString()}`);
    });
  };

  return (
    <Box className={styles.container}>
      <Tabs.Root
        className={styles.tabsRoot}
        value={activeTab}
        onValueChange={(value) => handleTabChange(value as TabType)}
      >
        <Tabs.List className={styles.tabsList}>
          <Tabs.Trigger className={styles.tabsTrigger} value={TabType.PIPELINE}>
            <Flex align='center' gap='2'>
              <span
                className='material-icons'
                translate='no'
                aria-hidden='true'
                style={{ color: 'var(--icon-color-open)' }}
              >
                work
              </span>
              <Text>案件リスト</Text>
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger className={styles.tabsTrigger} value={TabType.TASKS}>
            <Flex align='center' gap='2'>
              <span
                className='material-icons'
                translate='no'
                aria-hidden='true'
                style={{ color: 'var(--border-color-blue)' }}
              >
                task
              </span>
              <Text>タスクリスト</Text>
            </Flex>
          </Tabs.Trigger>
        </Tabs.List>

        <Box className={styles.tabsContentContainer}>
          <Tabs.Content className={styles.tabsContent} value={TabType.PIPELINE}>
            <PipelineManagementPresentational />
          </Tabs.Content>

          <Tabs.Content className={styles.tabsContent} value={TabType.TASKS}>
            <TaskManagementPresentational />
          </Tabs.Content>
        </Box>
      </Tabs.Root>
    </Box>
  );
}
