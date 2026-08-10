import { Box, Flex } from '@radix-ui/themes';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getProject } from '@/api/generated/endpoints/projects';
import type { Project } from '@/api/generated/models';
import { ContentHeader } from '@/app/_components/contentHeader/ContentHeader';
import type { Breadcrumb } from '@/app/_components/contentHeader/models';
import { getCachedSession } from '@/lib/auth0';
import { getServerAccessToken } from '@/lib/getServerAccessToken';
import { getForwardedFor } from '@/lib/getServerForwardedFor';
import { getIsServerSideMobile } from '@/utils/deviceUtils';
import { getPrefectureCode } from '@/utils/regionUtils';
import styles from './styles.module.css';
import { ProjectDetailPresentational } from './presentational';

type Props = {
  params: Promise<{ project_id: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const accessToken = await getServerAccessToken(true);
  const forwardedFor = await getForwardedFor();
  const project = await getProject(params.project_id, {
    headers: {
      ...accessToken,
      'X-Forwarded-For': forwardedFor,
    },
  }).catch(() => null);

  if (!project) {
    return {
      title: 'AI入札プラットフォームLabid（入札情報サービス）',
      description:
        'AI入札情報サービスLabidが提供する入札情報（入札案件、調達情報）です。Labidは入札情報（入札案件、調達情報）や落札情報（落札結果、入札結果）の検索が可能です。全国の自治体・官公庁の情報を検索することが可能で、AIを活用したレコメンドやサマリにより情報収集や精査の工数を大幅に効率化します。',
    };
  }

  const isAwardedProject = !!project.awardedProject;
  const projectType = isAwardedProject
    ? '落札情報（落札結果、入札結果）'
    : '入札情報（入札案件、調達情報）';

  return {
    title: `${project.title} | AI入札プラットフォームLabid（入札情報サービス）`,
    // 入札情報かつsummaryがない場合はno indexの設定を入れる
    robots: !isAwardedProject && !project.summary ? 'noindex, nofollow' : 'index, follow',
    description: `AI入札情報サービスLabidが提供する${project.organizationName}から公示されている${project.procedureTypeGroup}の${project.title}についての${projectType}です。Labidは入札情報（入札案件、調達情報）や落札情報（落札結果、入札結果）の検索が可能です。全国の自治体・官公庁の情報を検索することが可能で、AIを活用したレコメンドやサマリにより情報収集や精査の工数を大幅に効率化します。`,
  };
}

export default async function ProjectDetail(props: { params: Promise<{ project_id: string }> }) {
  const params = await props.params;
  const session = await getCachedSession();
  const accessToken = await getServerAccessToken(true);
  const isMobile = await getIsServerSideMobile();
  const forwardedFor = await getForwardedFor();

  const project: Project | undefined = await getProject(params.project_id, {
    headers: {
      ...accessToken,
      'X-Forwarded-For': forwardedFor,
    },
  })
    .then((res) => {
      return {
        ...res,
        type: res.awardedProject ? 'awarded_project' : 'project',
      } as Project;
    })
    .catch((error) => {
      if (error.response?.status === 303) {
        // 303の場合はリダイレクト
        const locationHeader = error.response.headers.location;
        redirect(locationHeader);
      }
      // 401の場合は、ログイン画面にリダイレクト
      if (error.response?.status === 401) {
        redirect(`/login?redirect_to=/projects/${params.project_id}`);
      }
      if (error.response?.status === 404) {
        redirect(session ? '/projects' : '/login');
      }
      return undefined;
    });

  // FIXME
  if (!project) {
    return null;
  }

  // ログインしていない場合、添付資料とスクリーンショットを空にする
  if (!session) {
    project.attachments =
      project.attachments?.map((attachment) => ({ name: attachment.name })) ?? [];
    if (project.screenshots) {
      project.screenshots = [];
    }
  }

  // create breadcrumbs
  const breadcrumbs: Breadcrumb[] = [
    { label: 'Home', href: '/' },
    { label: '案件一覧', href: session ? '/projects' : undefined },
  ];

  if (project.prefectures) {
    project.prefectures.forEach((prefName, _index) => {
      const prefectureCode = getPrefectureCode(prefName);
      breadcrumbs.push({
        label: prefName,
        href: `/projects?prefectures=${prefectureCode}`,
        group: 'prefectures',
      });
    });

    breadcrumbs.push({
      label: project.title,
      as: 'h1',
    });
  }

  return (
    <Flex direction='column' className={styles.container} style={{ width: '100%' }}>
      <Box className={styles.contentHeaderWrapper}>
        <ContentHeader breadcrumbs={breadcrumbs} />
      </Box>
      {project && (
        <Box className={styles.projectDetailContainer}>
          <ProjectDetailPresentational
            project={project}
            isLogin={!!session}
            position='detail'
            isMobile={isMobile}
            projectTitleContainerClassName={
              isMobile ? styles.projectTitleContainerMobile : styles.projectTitleContainerPc
            }
          />
        </Box>
      )}
    </Flex>
  );
}
