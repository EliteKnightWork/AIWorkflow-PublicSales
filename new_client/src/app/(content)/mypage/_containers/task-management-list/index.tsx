import { getBidPipelineTaskStatuses } from '@/api/generated/endpoints/bid-pipeline-task-statuses';
import { getV1BidPipelineTasks } from '@/api/generated/endpoints/bid-pipeline-tasks';
import { getBidPipelines } from '@/api/generated/endpoints/bid-pipelines';
import { getCurrentUser } from '@/api/generated/endpoints/users';
import { getCachedCompanyMembers } from '@/lib/getCachedCompanyMembers';
import { getServerAccessToken } from '@/lib/getServerAccessToken';
import { sortTaskStatuses } from '@/utils/statusSort';
import TaskManagementListContainer from './container';

export default async function TaskManagementList() {
  const accessToken = await getServerAccessToken();

  // 未ログインやトークン取得不可の場合は空データで描画
  if (!accessToken) {
    return <TaskManagementListContainer tasks={[]} statusList={[]} pipelines={[]} users={[]} />;
  }

  try {
    const getTasks = getV1BidPipelineTasks(
      { bid_pipeline_task_status_stages: ['todo', 'doing'] },
      { headers: { ...accessToken } }
    );
    const getTaskStatus = getBidPipelineTaskStatuses({ headers: { ...accessToken } });
    const getUser = getCurrentUser({ headers: { ...accessToken } });
    const getPipelines = getBidPipelines({}, { headers: { ...accessToken } });
    const getMembers = getCachedCompanyMembers();

    const [tasksRes, taskStatusRes, userRes, pipelinesRes, membersRes] = await Promise.all([
      getTasks,
      getTaskStatus,
      getUser,
      getPipelines,
      getMembers,
    ]);

    const userPipelines =
      pipelinesRes.bidPipelines?.filter(
        (p) => p.assignedUsers?.[0] && p.assignedUsers[0].id === userRes.id
      ) ?? [];

    // stageがtodo,doing,doneの順でそれぞれのorderでsort
    const sortedStatuses = sortTaskStatuses(taskStatusRes.bidPipelineTaskStatuses ?? []);

    return (
      <TaskManagementListContainer
        tasks={
          tasksRes.filter((t) => t.assignedUsers?.[0] && t.assignedUsers[0].id === userRes.id) ?? []
        }
        statusList={sortedStatuses}
        pipelines={userPipelines}
        users={membersRes.members ?? []}
      />
    );
  } catch (error: any) {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      return <TaskManagementListContainer tasks={[]} statusList={[]} pipelines={[]} users={[]} />;
    }
    throw error;
  }
}
