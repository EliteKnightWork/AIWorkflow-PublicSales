import { Box, Flex, Text } from '@radix-ui/themes';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { ContentHeader } from '@/app/_components/contentHeader/ContentHeader';
import LoadingSpinner from '@/components/loadingSpinner/LoadingSpinner';
import { getCachedSession } from '@/lib/auth0';
import { getIsServerSideMobile } from '@/utils/deviceUtils';
import LikedProjectList from './_containers/liked-project-list';
import FilteredProjectList from './_containers/filtered-project-list';
import PipelineManagementList from './_containers/pipeline-management-list';
import TaskManagementList from './_containers/task-management-list';
import styles from './styles.module.css';

type SectionFallbackProps = {
  title: string;
};

function SectionFallback({ title }: SectionFallbackProps) {
  return (
    <Flex
      direction={'column'}
      gap={'4'}
      className={styles.mypageContentBoard}
      style={{ paddingBottom: '8px' }}
    >
      <Flex justify={'between'} align={'center'} className={styles.mypageContentHeader}>
        <Text className={styles.mypageContentBoxTitle}>{title}</Text>
      </Flex>
      <Box className={styles.messageBox}>
        <Flex justify='center' align='center'>
          <LoadingSpinner />
        </Flex>
      </Box>
    </Flex>
  );
}

export default async function Mypage() {
  // モバイル端末の場合は案件一覧ページにリダイレクト
  const isMobile = await getIsServerSideMobile();
  if (isMobile) {
    redirect('/projects');
  }

  // 未ログインの場合はログインへリダイレクト
  const session = await getCachedSession();
  if (!session) {
    redirect('/login?redirect_to=/mypage');
  }

  return (
    <Flex direction={'column'}>
      <ContentHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'マイページ', as: 'h1' },
        ]}
      />
      <Flex direction={'column'} gap={'4'} p={'4'} className={styles.mypageContentBox}>
        <Suspense fallback={<SectionFallback title='新着案件' />}>
          <FilteredProjectList />
        </Suspense>
        <Suspense fallback={<SectionFallback title='お気に入り' />}>
          <LikedProjectList />
        </Suspense>
        <Suspense fallback={<SectionFallback title='案件管理' />}>
          <PipelineManagementList />
        </Suspense>
        <Suspense fallback={<SectionFallback title='タスク管理' />}>
          <TaskManagementList />
        </Suspense>
      </Flex>
    </Flex>
  );
}
