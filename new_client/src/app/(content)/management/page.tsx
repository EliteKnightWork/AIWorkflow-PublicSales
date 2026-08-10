import { Flex } from '@radix-ui/themes';
import { getBidPipelineStatuses } from '@/api/generated/endpoints/bid-pipeline-statuses';
import { getBidPipelineTaskStatuses } from '@/api/generated/endpoints/bid-pipeline-task-statuses';
import { getV1BidPipelineTasks } from '@/api/generated/endpoints/bid-pipeline-tasks';
import { getBidPipelines } from '@/api/generated/endpoints/bid-pipelines';
import { getCompanyMembers } from '@/api/generated/endpoints/companies';
import { BidPipelineStatusStage } from '@/api/generated/models';
import { ContentHeader } from '@/app/_components/contentHeader/ContentHeader';
import { getServerAccessToken } from '@/lib/getServerAccessToken';
import { sortTaskStatuses } from '@/utils/statusSort';
import ManagementScreen from './_container/managementscreen';
import { ManagementProvider } from './_context/ManagementContext';
import type { TabType } from './types';

export type ManagementParams = {
  type?: TabType;
};

export default async function Management(props: { searchParams: Promise<ManagementParams> }) {
  const searchParams = await props.searchParams;
  const accessToken = await getServerAccessToken();

  // 案件リストと案件ステータスを取得
  const [statusRes, pipelinesRes] = await Promise.all([
    getBidPipelineStatuses(accessToken ? { headers: { ...accessToken } } : undefined),
    getBidPipelines({}, accessToken ? { headers: { ...accessToken } } : undefined),
  ]);

  // タスクリストとタスクステータス、会社メンバーを取得
  const [tasksRes, taskStatusRes, companyMembersRes] = await Promise.all([
    getV1BidPipelineTasks({}, accessToken ? { headers: { ...accessToken } } : undefined),
    getBidPipelineTaskStatuses(accessToken ? { headers: { ...accessToken } } : undefined),
    getCompanyMembers(accessToken ? { headers: { ...accessToken } } : undefined),
  ]);

  // ソート処理
  const sortedPipelineStatuses =
    statusRes.bidPipelineStatuses?.sort((a, b) => {
      if (a.stage === BidPipelineStatusStage.doing && b.stage === BidPipelineStatusStage.done)
        return -1;
      if (a.stage === BidPipelineStatusStage.done && b.stage === BidPipelineStatusStage.doing)
        return 1;
      return (b.order ?? 0) - (a.order ?? 0);
    }) ?? [];

  const sortedTaskStatuses = sortTaskStatuses(taskStatusRes.bidPipelineTaskStatuses ?? []);

  return (
    <Flex direction={'column'}>
      <ContentHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: '案件管理', as: 'h1' },
        ]}
      />
      <ManagementProvider
        statusList={sortedPipelineStatuses}
        pipelines={pipelinesRes.bidPipelines ?? []}
        initialTasks={tasksRes ?? []}
        taskStatusList={sortedTaskStatuses}
        companyMembers={companyMembersRes.members ?? []}
      >
        <ManagementScreen type={searchParams.type} />
      </ManagementProvider>
    </Flex>
  );
}
