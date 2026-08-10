import { Box } from '@radix-ui/themes';
import type { Aggregation, Pagination, Project } from '@/api/generated/models';
import RecommendList from '@/app/(content)/_containers/recommend-list';
import { RecommendListType } from '@/app/(content)/_containers/recommend-list/type';
import { getCachedSession } from '@/lib/auth0';
import { ProjectListContainer } from './container';

interface Props {
  projects: Project[];
  pagination: Pagination;
  aggregate: Aggregation;
  isMobile?: boolean;
}

export default async function ProjectList({
  projects,
  pagination,
  aggregate,
  isMobile = false,
}: Props) {
  const session = await getCachedSession();

  // RecommendListをタブの外に配置
  const recommendListElement = session ? (
    <Box mb='4'>
      <RecommendList displayType={RecommendListType.PROJECT} />
    </Box>
  ) : null;

  return (
    <ProjectListContainer
      projects={projects}
      pagination={pagination}
      aggregate={aggregate}
      recommendListElement={recommendListElement}
      isMobile={isMobile}
      isLogin={!!session}
    />
  );
}
