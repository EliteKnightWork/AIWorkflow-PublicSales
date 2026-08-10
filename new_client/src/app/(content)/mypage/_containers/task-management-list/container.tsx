'use client';
import type {
  BidPipeline,
  BidPipelineTask,
  BidPipelineTaskStatus,
  User,
} from '@/api/generated/models';
import TaskManagementListPresentational from './presentational';

type Props = {
  statusList: BidPipelineTaskStatus[];
  tasks: BidPipelineTask[];
  pipelines: BidPipeline[];
  users: User[];
};

export default function TaskManagementListContainer({
  statusList,
  tasks,
  pipelines,
  users,
}: Props) {
  return (
    <TaskManagementListPresentational
      statusList={statusList}
      tasks={tasks}
      users={users}
      pipelines={pipelines}
    />
  );
}
