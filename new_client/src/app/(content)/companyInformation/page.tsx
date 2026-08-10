import { Box, Flex } from '@radix-ui/themes';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getCompanyInformation } from '@/api/generated/endpoints/company-information';
import { ContentHeader } from '@/app/_components/contentHeader/ContentHeader';
import CompanyInformationListTable from '@/features/CompanyInformationListTable/CompanyInformationListTable';
import { getCachedSession } from '@/lib/auth0';
import { getServerAccessToken } from '@/lib/getServerAccessToken';
import { getForwardedFor } from '@/lib/getServerForwardedFor';
import CompanyInformation from '@/widgets/CompanyInformation';
import styles from './styles.module.css';

/**
 * 会社情報取得コンポーネント（Suspense 内で使用）
 */
async function CompanyInformationContent() {
  const [session, accessToken, forwardedFor] = await Promise.all([
    getCachedSession(),
    getServerAccessToken(true),
    getForwardedFor(),
  ]);

  // 非ログイン時はログインページにリダイレクト
  if (!session) {
    redirect('/login?redirect_to=/companyInformation');
  }

  // アクセストークンが取得できない場合はログインページにリダイレクト
  if (!accessToken) {
    redirect('/login?redirect_to=/companyInformation');
  }

  const data = await getCompanyInformation({
    headers: {
      ...accessToken,
      'X-Forwarded-For': forwardedFor,
    },
  }).catch((error) => {
    // 401の場合はログイン画面にリダイレクト
    if (error.response?.status === 401) {
      redirect('/login?redirect_to=/companyInformation');
    }
    // その他のエラーは throw
    throw error;
  });

  return <CompanyInformation data={data} />;
}

export default async function CompanyInformationPage() {
  return (
    <Flex direction='column' className={styles.root}>
      <ContentHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: '基本情報', as: 'h1' },
        ]}
      />
      <Box className={styles.container}>
        <Suspense fallback={<CompanyInformationListTable isLoading />}>
          <CompanyInformationContent />
        </Suspense>
      </Box>
    </Flex>
  );
}
