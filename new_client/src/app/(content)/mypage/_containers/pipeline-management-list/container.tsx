'use client';
import type { BidPipeline, BidPipelineStatus, User } from '@/api/generated/models';
import PipelineManagementListPresentational from './presentational';

type Props = {
  statusList: BidPipelineStatus[];
  pipelines: BidPipeline[];
  users: User[];
  currentUserId?: number;
};

export default function PipelineManagementListContainer({
  statusList,
  pipelines,
  users,
  currentUserId,
}: Props) {
  return (
    <PipelineManagementListPresentational
      statusList={statusList}
      pipelines={pipelines}
      users={users}
      currentUserId={currentUserId}
    />
  );
}
