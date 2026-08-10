import { Flex } from '@radix-ui/themes';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { searchProjects } from '@/api/generated/endpoints/projects';
import {
  ProjectStatusTab,
  type SearchProjects200,
  type SearchProjectsParams,
} from '@/api/generated/models';
import { ContentHeader } from '@/app/_components/contentHeader/ContentHeader';
import { getCachedSession } from '@/lib/auth0';
import { getSearchProjectsQueryParams } from '@/lib/getSearchProjectsQueryParams';
import { getServerAccessToken } from '@/lib/getServerAccessToken';
import { getForwardedFor } from '@/lib/getServerForwardedFor';
import { getIsServerSideMobile } from '@/utils/deviceUtils';
import { getPrefectureNames } from '@/utils/regionUtils';
import ProjectList from './_containers/project-list';
import ProjectSearch from './_containers/project-search';
import { convertQueryToSearchParams } from './utils';

const createMetadata = (searchParams: SearchProjectsParams) => {
  // 案件タイプ
  const prefectures = searchParams.prefectures
    ? Array.isArray(searchParams.prefectures)
      ? getPrefectureNames(searchParams.prefectures.map((p) => Number(p)))
      : getPrefectureNames((searchParams.prefectures as string).split(/\s+/).map((p) => Number(p)))
    : [];

  const organizationName = searchParams.organizationNameArray
    ? Array.isArray(searchParams.organizationNameArray)
      ? searchParams.organizationNameArray.join(',')
      : searchParams.organizationNameArray
    : '';

  const keywords = searchParams.orKeywords
    ? Array.isArray(searchParams.orKeywords)
      ? searchParams.orKeywords.filter((k) => k.trim() !== '').join(' ')
      : searchParams.orKeywords
    : '';
  const project_name =
    searchParams.tab === ProjectStatusTab.awarded
      ? '落札情報（落札結果、入札結果）'
      : '入札情報（入札案件、調達情報）';

  // タイトルのテキスト
  let title_text = `${project_name} 一覧 / AI入札プラットフォームLabid（入札情報サービス）`;
  // descriptionのテキスト
  let description_text = 'AI入札情報サービスLabidが提供する';

  if (keywords.length > 0) {
    title_text = `${keywords}についての${title_text}`;
    description_text = `${description_text}${keywords}についての`;
  }

  if (prefectures.length > 0) {
    title_text = `${prefectures.join(',')}の${title_text}`;
    description_text = `${description_text}${prefectures.join(',')}の`;
  } else if (organizationName.length > 0) {
    title_text = `${organizationName}の${title_text}`;
    description_text = `${description_text}${organizationName}の`;
  }

  description_text = `${description_text}${project_name}の一覧です。全国の自治体・官公庁の情報を検索することが可能で、AIを活用したレコメンドやサマリにより情報収集や精査の工数を大幅に効率化します。`;

  return {
    title: title_text,
    description: description_text,
  };
};

interface ServerComponentProps {
  searchParams: Promise<SearchProjectsParams>;
}

export async function generateMetadata(props: ServerComponentProps): Promise<Metadata> {
  const searchParams = await props.searchParams;
  return createMetadata(searchParams);
}

export default async function Projects(props: ServerComponentProps) {
  const [searchParams, session, accessToken, isMobile, forwardedFor] = await Promise.all([
    props.searchParams,
    getCachedSession(),
    getServerAccessToken(true),
    getIsServerSideMobile(),
    getForwardedFor(),
  ]);

  const reqParams: SearchProjectsParams = convertQueryToSearchParams(searchParams);

  const res: SearchProjects200 = await searchProjects(reqParams, {
    headers: {
      ...accessToken,
      'X-Forwarded-For': forwardedFor,
    },
  }).catch((error) => {
    if (error.response?.status === 303) {
      // 303の場合はリダイレクト
      const locationHeader = error.response.headers.location;
      if (!locationHeader) {
        redirect('/login');
      }
      redirect(locationHeader);
    }
    if (error.response?.status === 401) {
      // 401の場合は、ログイン画面にリダイレクト
      const params = getSearchProjectsQueryParams(reqParams);
      const redirectUrl = encodeURIComponent(`/projects?${params}`);
      redirect(`/login?redirect_to=${redirectUrl}`);
    }
    return { projects: [], meta: { pagination: {} } };
  });

  const projects = res.projects ?? [];

  // ログインしていない場合、添付資料はファイル名のみとしスクリーンショットを空にする
  if (!session) {
    for (const project of projects) {
      project.attachments =
        project.attachments?.map((attachment) => ({ name: attachment.name })) ?? [];
      if (project.screenshots) {
        project.screenshots = [];
      }
    }
  }

  return (
    <Flex direction='column' style={{ width: '100%' }}>
      <ContentHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: createMetadata(reqParams).title, as: 'h1' },
        ]}
      />
      <ProjectSearch />
      <ProjectList
        projects={projects}
        pagination={res.meta?.pagination ?? {}}
        aggregate={res.meta?.aggregation ?? {}}
        isMobile={isMobile}
      />
    </Flex>
  );
}
