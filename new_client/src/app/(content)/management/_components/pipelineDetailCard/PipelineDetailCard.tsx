'use client';

import { Box } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { getProject } from '@/api/generated/endpoints/projects';
import type { BidPipeline, BidPipelineStatus, Project, User } from '@/api/generated/models';
import PipelineAssignee from '@/app/_components/pipelineAssignee/PipelineAssignee';
import PipelineStatus from '@/app/_components/pipelineStatus/PipelineStatus';
import QualificationInformationCard from '@/app/(content)/_components/qualificationInformationCard/qualificationInformationCard';
import LoadingSpinner from '@/components/loadingSpinner/LoadingSpinner';
import AttachmentCard from '../../../_components/attachmentCard/attachmentCard';
import BasicInformationCard from '../../../_components/basicInformationCard/basicInformationCard';
import ProjectTitleCard from '../../../_components/projectTitleCard/projectTitleCard';
import ScreenshotCard from '../../../_components/screenshotCard/screenshotCard';
import SpecificationSummaryCard from '../../../_components/specificationSummaryCard/specificationSummaryCard';
import { useManagementContext } from '../../_context/ManagementContext';
import CustomObjectSection from '../customObjectSection/CustomObjectSection';
import styles from './styles.module.css';
import SimilarAwardedProjectList from '@/widgets/SimilarAwardedProjectList/SimilarAwardedProjectList';
import SimilarProjectList from '@/widgets/SimilarProjectList/SimilarProjectList';

type Props = {
  pipeline?: BidPipeline;
  users: User[];
  statuses: BidPipelineStatus[];
  onClose?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  selectRef?: React.RefObject<HTMLDivElement>;
  onUpdateStatus?: (statusId: string) => void;
  onUpdateAssignedUser?: (assignedUserIds: number[]) => void;
};

// こちらを参考にする
export default function PipelineDetailCard({
  pipeline,
  users,
  statuses,
  onClose,
  onEdit,
  onDelete,
  onUpdateAssignedUser,
  onUpdateStatus,
  selectRef,
}: Props) {
  const [project, setProject] = useState<Project | undefined>(undefined);
  const { pipelineBoardData, onUpdatePipeline } = useManagementContext();

  useEffect(() => {
    if (pipeline?.project?.uuid) {
      // 案件情報を取得（UUIDが存在する場合のみ）
      getProject(pipeline.project.uuid).then((res) => {
        setProject(res);
      });
    }
  }, [pipeline]);

  if (!project || !pipeline) {
    return (
      <Box className={styles.loadingBox}>
        <LoadingSpinner />
      </Box>
    );
  }

  return (
    <Box className={styles.content}>
      <Box className={styles.projectTitleCard}>
        <ProjectTitleCard
          onUpdateProject={(updatedProject) => {
            setProject(updatedProject);
          }}
          hideReactionButton={true}
          project={project}
          isLogin={true}
          isAbbreviated={true}
          onClose={onClose}
          onOpen={(targetProject) => {
            window.open(`/projects/${targetProject.uuid}`, '_blank');
          }}
          onEdit={onEdit}
          onDelete={onDelete}
          position='pipeline'
        />
      </Box>

      <PipelineStatus
        pipeline={pipeline}
        statuses={statuses}
        onUpdateStatus={onUpdateStatus}
        selectRef={selectRef}
      />

      <PipelineAssignee
        pipeline={pipeline}
        users={users}
        onUpdateAssignedUser={onUpdateAssignedUser}
        selectRef={selectRef}
      />

      <CustomObjectSection pipelineId={pipeline?.id} />

      <Box className={styles.section}>
        <BasicInformationCard
          isWide={false}
          project={project}
          pipelineBoardData={pipelineBoardData}
          onUpdatePipeline={onUpdatePipeline}
          assignedUsers={pipeline.assignedUsers}
        />
      </Box>

      <Box className={styles.section}>
        <QualificationInformationCard isWide={false} project={project} />
      </Box>

      <Box className={styles.section}>
        <SpecificationSummaryCard
          project_id={project.uuid}
          summary={project.summary || undefined}
        />
      </Box>

      <Box className={styles.section}>
        <AttachmentCard
          project={project}
          attachments={project.attachments}
          noAttachmentsMessage='掲載元にあるかもしれません'
        />
      </Box>

      {project.screenshots && project.screenshots.length > 0 && (
        <Box className={styles.section}>
          <ScreenshotCard title={project.title} screenshots={project.screenshots} />
        </Box>
      )}

      <Box className={styles.section} id='similar-projects' style={{ padding: '24px' }}>
        <SimilarAwardedProjectList projectUuid={project.uuid} />
      </Box>
      <Box className={styles.section} style={{ padding: '24px' }}>
        <SimilarProjectList projectUuid={project.uuid} />
      </Box>
    </Box>
  );
}
