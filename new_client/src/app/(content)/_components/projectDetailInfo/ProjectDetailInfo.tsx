'use client';
import { Box, Flex } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { getBidPipelineStatuses } from '@/api/generated/endpoints/bid-pipeline-statuses';
import { updateBidPipeline } from '@/api/generated/endpoints/bid-pipelines';
import { getCompanyMembers, useGetMyCompany } from '@/api/generated/endpoints/companies';
import type {
  AwardedProject,
  BidPipelineStatus,
  Project,
  ProjectBidPipeline,
  User,
} from '@/api/generated/models';
import { BidPipelineStatusStage, FeatureKey } from '@/api/generated/models';
import PipelineAssignee from '@/app/_components/pipelineAssignee/PipelineAssignee';
import PipelineStatus from '@/app/_components/pipelineStatus/PipelineStatus';
import NeuralButtonGroup from '@/app/(content)/_components/projectChat/chat-button/NeuralButtonGroup';
import { FreeDemoCta } from '@/components/freeDemoCta/FreeDemoCta';
import { useToast } from '@/context/ToastContext';
import CustomObjectSection from '../../management/_components/customObjectSection/CustomObjectSection';
import { ProjectChatSideBar } from '../../projects/_components/projectChatSideBar/ProjectChatSideBar';
import AttachmentCard from '../attachmentCard/attachmentCard';
import BasicInformationCard from '../basicInformationCard/basicInformationCard';
import ExternalLinkButton from '../externalLinkButton/externalLinkButton';
import ProjectTitleCard from '../projectTitleCard/projectTitleCard';
import QualificationInformationCard from '../qualificationInformationCard/qualificationInformationCard';
import ScreenshotCard from '../screenshotCard/screenshotCard';
import SpecificationSummaryCard from '../specificationSummaryCard/specificationSummaryCard';
import styles from './styles.module.css';
import SimilarProjectList from '@/widgets/SimilarProjectList/SimilarProjectList';
import SimilarAwardedProjectList from '@/widgets/SimilarAwardedProjectList/SimilarAwardedProjectList';
import SimilarProjectByAwardedList from '@/widgets/SimilarProjectByAwardedList/SimilarProjectByAwardedList';
import type { ReactionEventSource } from '@/utils/googleAnalyticsUtils';

type ProjectDetailProps = {
  project: Project;
  isLogin: boolean;
  isAbbreviated?: boolean;
  onOpen?: (project: Project | AwardedProject) => void;
  onClose?: () => void;
  position: ReactionEventSource;
  isMobile?: boolean;
  onProjectUpdate?: (project: Project) => void;
  projectTitleContainerClassName?: string;
};

export default function ProjectDetailInfo({
  project,
  isLogin,
  isAbbreviated,
  onOpen,
  onClose,
  position,
  isMobile = false,
  onProjectUpdate,
  projectTitleContainerClassName,
}: ProjectDetailProps) {
  const { data: myCompany } = useGetMyCompany();
  const { enqueueToast } = useToast();
  const [pipelineStatuses, setPipelineStatuses] = useState<BidPipelineStatus[]>([]);
  const [companyMembers, setCompanyMembers] = useState<User[]>([]);
  const [localPipeline, setLocalPipeline] = useState<ProjectBidPipeline>(
    project.bidPipeline ?? null
  );

  const [isChatSideBarOpen, setIsChatSideBarOpen] = useState(false);
  const isProject = project.type === 'project';
  const isSplitLayout = Boolean(isChatSideBarOpen && !isMobile);
  const containerClassName = [
    styles.container,
    isSplitLayout ? styles.splitLayout : '',
    isAbbreviated ? styles.abbreviated : '',
  ]
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    const init = async () => {
      if (!isLogin || !project.bidPipeline) {
        setPipelineStatuses([]);
        setCompanyMembers([]);
        setLocalPipeline(null);
        return;
      }
      try {
        const [statusRes, membersRes] = await Promise.all([
          getBidPipelineStatuses(),
          getCompanyMembers(),
        ]);
        const sortedStatuses =
          statusRes.bidPipelineStatuses?.sort((a, b) => {
            if (a.stage === BidPipelineStatusStage.doing && b.stage === BidPipelineStatusStage.done)
              return -1;
            if (a.stage === BidPipelineStatusStage.done && b.stage === BidPipelineStatusStage.doing)
              return 1;
            return (b.order ?? 0) - (a.order ?? 0);
          }) ?? [];
        setPipelineStatuses(sortedStatuses);
        setCompanyMembers(membersRes.members ?? []);
        setLocalPipeline(project.bidPipeline);
      } catch (_e) {
        // 認可がない/取得失敗時は非表示のまま
      }
    };
    void init();
    // projectの切替に追従
  }, [project.bidPipeline, isLogin]);

  const handleUpdateStatus = async (statusId: string) => {
    if (!localPipeline?.id) return;
    const prev = localPipeline;
    const nextStatus = pipelineStatuses.find((s) => s.id?.toString() === statusId);
    setLocalPipeline({ ...prev, status: nextStatus });
    try {
      await updateBidPipeline(String(localPipeline.id), {
        bid_pipeline_status_id: Number(statusId),
      });
      enqueueToast('案件のステータスを変更しました');
      if (onProjectUpdate) {
        onProjectUpdate({
          ...project,
          bidPipeline: { ...prev, status: nextStatus },
        });
      }
    } catch (_e) {
      setLocalPipeline(prev);
      enqueueToast('案件のステータス変更に失敗しました');
    }
  };

  const handleUpdateAssignedUsers = async (assignedUserIds: number[]) => {
    if (!localPipeline?.id) return;
    const prev = localPipeline;
    const nextAssignedUsers = companyMembers.filter((u) => assignedUserIds.includes(u.id ?? -1));
    setLocalPipeline({ ...prev, assignedUsers: nextAssignedUsers });
    try {
      await updateBidPipeline(String(localPipeline.id), {
        assigned_user_ids: assignedUserIds,
      });
      enqueueToast('案件の担当者を変更しました');
      if (onProjectUpdate) {
        onProjectUpdate({
          ...project,
          bidPipeline: { ...prev, assignedUsers: nextAssignedUsers },
        });
      }
    } catch (_e) {
      setLocalPipeline(prev);
      enqueueToast('案件の担当者変更に失敗しました');
    }
  };

  const showNeuralButton =
    myCompany?.features?.some((f) => f.key === FeatureKey.ai_chat) && isProject && !isMobile;

  return (
    <Box
      className={containerClassName}
      style={{ width: !isAbbreviated ? '100%' : isChatSideBarOpen ? '80vw' : '50vw' }}
    >
      <Box className={styles.projectInfoCardContainer}>
        <Flex direction='column' className={styles.projectInfoContainer}>
          <Box
            className={
              projectTitleContainerClassName
                ? `${styles.projectTitleContainer} ${projectTitleContainerClassName}`
                : styles.projectTitleContainer
            }
          >
            <ProjectTitleCard
              onUpdateProject={onProjectUpdate}
              project={project}
              isLogin={isLogin}
              isAbbreviated={isAbbreviated}
              onOpen={onOpen as (project: Project | AwardedProject) => void}
              onClose={onClose}
              position={position}
            />
          </Box>
          <Box
            className={styles.projectContentContainer}
            style={showNeuralButton ? { paddingBottom: '120px' } : {}}
          >
            {isProject ? (
              <Box className={styles.project}>
                {isLogin && localPipeline?.id ? (
                  <>
                    <PipelineStatus
                      pipeline={localPipeline}
                      statuses={pipelineStatuses}
                      onUpdateStatus={handleUpdateStatus}
                    />
                    <PipelineAssignee
                      pipeline={localPipeline}
                      users={companyMembers}
                      onUpdateAssignedUser={handleUpdateAssignedUsers}
                    />
                  </>
                ) : null}
                {/* 案件管理と同様の「案件詳細」セクション */}
                <CustomObjectSection pipelineId={project.bidPipeline?.id ?? undefined} />
                <BasicInformationCard
                  isWide={!isAbbreviated}
                  project={project}
                  assignedUsers={localPipeline?.assignedUsers || undefined}
                />
                <QualificationInformationCard isWide={!isAbbreviated} project={project} />
                <SpecificationSummaryCard
                  project_id={project.uuid}
                  summary={project.summary || undefined}
                />
                <AttachmentCard
                  project={project}
                  attachments={project.attachments}
                  noAttachmentsMessage='掲載元にあるかもしれません'
                />

                {!isLogin ? (
                  <FreeDemoCta />
                ) : (
                  <>
                    {project.screenshots && project.screenshots.length > 0 && (
                      <ScreenshotCard title={project.title} screenshots={project.screenshots} />
                    )}
                    <Flex direction='row' justify='center'>
                      {!project.documentUrl?.startsWith('https://labid.jp/') && (
                        <ExternalLinkButton
                          externalLink={project.documentUrl ?? project.awardedProject?.documentUrl}
                        />
                      )}
                    </Flex>
                    <Box className={styles.similarProjectsBox} id='similar-projects'>
                      <SimilarAwardedProjectList projectUuid={project.uuid} isSp={isMobile} />
                    </Box>
                    <Box className={styles.similarProjectsBox}>
                      <SimilarProjectList projectUuid={project.uuid} isSp={isMobile} />
                    </Box>
                  </>
                )}
              </Box>
            ) : (
              <Flex direction='column' gap='6' px='6' py='5' className={styles.awardedProject}>
                <BasicInformationCard isWide={!isAbbreviated} project={project} />
                <AttachmentCard
                  project={project}
                  attachments={project.attachments}
                  similarProjectsLink='#similar-awarded-projects'
                />
                {isLogin ? (
                  <>
                    {project.screenshots && project.screenshots.length > 0 && (
                      <ScreenshotCard title={project.title} screenshots={project.screenshots} />
                    )}
                    <Flex direction='row' justify='center'>
                      {!project.documentUrl?.startsWith('https://labid.jp/') && (
                        <ExternalLinkButton
                          externalLink={project.documentUrl ?? project.awardedProject?.documentUrl}
                        />
                      )}
                    </Flex>
                    <Box className={styles.similarProjectsBox} id='similar-awarded-projects'>
                      <SimilarProjectByAwardedList projectUuid={project.uuid} isSp={isMobile} />
                    </Box>
                  </>
                ) : (
                  <FreeDemoCta />
                )}
              </Flex>
            )}
          </Box>
        </Flex>
        {showNeuralButton && (
          <Box className={styles.chatButtonWrapper}>
            <NeuralButtonGroup
              onClick={() => {
                setIsChatSideBarOpen(!isChatSideBarOpen);
              }}
              isOpen={isChatSideBarOpen}
            />
          </Box>
        )}
      </Box>

      {isChatSideBarOpen ? (
        <Box className={isSplitLayout ? styles.chatSidebarWrapper : undefined}>
          <ProjectChatSideBar
            projectId={project.uuid}
            isOpen={isChatSideBarOpen}
            onClose={() => setIsChatSideBarOpen(false)}
            isAbbreviated={isAbbreviated}
          />
        </Box>
      ) : null}
    </Box>
  );
}
