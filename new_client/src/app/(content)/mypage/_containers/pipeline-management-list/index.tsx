import { getBidPipelineStatuses } from '@/api/generated/endpoints/bid-pipeline-statuses';
import { getBidPipelines } from '@/api/generated/endpoints/bid-pipelines';
import { getCurrentUser } from '@/api/generated/endpoints/users';
import { BidPipelineStatusStage } from '@/api/generated/models';
import { getCachedCompanyMembers } from '@/lib/getCachedCompanyMembers';
import { getServerAccessToken } from '@/lib/getServerAccessToken';
import PipelineManagementListContainer from './container';

export default async function PipelineManagementList() {
  const accessToken = await getServerAccessToken();

  // 未ログインやトークン取得不可の場合は空データで描画
  if (!accessToken) {
    return <PipelineManagementListContainer statusList={[]} pipelines={[]} users={[]} />;
  }

  try {
    const getPipelineStatus = getBidPipelineStatuses({ headers: { ...accessToken } });
    const getPipelines = getBidPipelines(
      { bid_pipeline_status_stages: ['doing'] },
      { headers: { ...accessToken } }
    );
    const getUser = getCurrentUser({ headers: { ...accessToken } });
    const getMembers = getCachedCompanyMembers();

    const [statusRes, pipelinesRes, userRes, membersRes] = await Promise.all([
      getPipelineStatus,
      getPipelines,
      getUser,
      getMembers,
    ]);

    return (
      <PipelineManagementListContainer
        statusList={
          statusRes.bidPipelineStatuses?.sort((a, b) => {
            if (a.stage === BidPipelineStatusStage.doing && b.stage === BidPipelineStatusStage.done)
              return -1;
            if (a.stage === BidPipelineStatusStage.done && b.stage === BidPipelineStatusStage.doing)
              return 1;
            return (b.order ?? 0) - (a.order ?? 0);
          }) ?? []
        }
        pipelines={
          pipelinesRes.bidPipelines?.filter((p) =>
            p.assignedUsers?.some((user) => user.id === userRes.id)
          ) ?? []
        }
        users={membersRes.members ?? []}
        currentUserId={userRes.id}
      />
    );
  } catch (error: any) {
    // 認可エラー時は空データで描画（プリフェッチ等でもエラーにしない）
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      return <PipelineManagementListContainer statusList={[]} pipelines={[]} users={[]} />;
    }
    throw error;
  }
}
