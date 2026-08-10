import { useUser } from '@auth0/nextjs-auth0';
import { Box, Button, Flex, Strong, Text } from '@radix-ui/themes';
import { useMemo, useState } from 'react';
import { type BidPipeline, type Project, ProjectReactionType } from '@/api/generated/models';
import AppTooltip from '@/app/_components/tooltip/AppTooltip';
import IconBadge from '@/app/(content)/_components/stateBadge/IconBadge';
import { getDeadlineDate, isOpenProject } from '@/app/(content)/projects/model';
import { useBidPipeline } from '@/context/BidPipelineContext';
import { useBrowsedProject } from '@/hooks/useBrowsedProject';
import { BidPipelineStatusTag } from '../../projects/_components/bidPipelineStatusTag';
import { BrowsedTag } from '../../projects/_components/browsedTag';
import { NewArraivalTag } from '../../projects/_components/newArraivalTag';
import styles from './styles.module.css';
import { ProjectReactionButton } from '@/features/ProjectReactionButton';
import { useProjectReaction } from '@/context/ProjectReactionContext';

type ProjectSummaryCardProps = {
  project: Project;
  showProjectReactionButton?: boolean;
  showBidPipelineIcon?: boolean;
  topElement?: React.ReactNode;
  source: string;
};

export const ProjectSummaryCard = ({
  project,
  showProjectReactionButton = true,
  showBidPipelineIcon = true,
  topElement,
  source,
}: ProjectSummaryCardProps) => {
  const { user } = useUser();
  const [targetProject, setTargetProject] = useState<Project>(project);
  const { handleBrowseProject } = useBrowsedProject();
  const { handleAddBidPipeline, openConfirmDeleteBidPipelineDialog } = useBidPipeline();
  const { handleUpdateReaction } = useProjectReaction();

  const handleClickReaction = (
    e: React.MouseEvent<HTMLButtonElement>,
    reaction: ProjectReactionType
  ) => {
    e.stopPropagation();

    const currentReaction = targetProject.reaction ?? ProjectReactionType.neutral;
    setTargetProject({ ...targetProject, reaction: reaction });
    handleUpdateReaction(targetProject.uuid, reaction, 'recommendation').catch(() => {
      setTargetProject({ ...targetProject, reaction: currentReaction });
    });
  };

  const handleClickPipeline = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (targetProject.bidPipeline?.id) {
      openConfirmDeleteBidPipelineDialog(
        targetProject.bidPipeline.id.toString(),
        () => {
          setTargetProject({ ...targetProject, bidPipeline: undefined });
        },
        () => {}
      );
    } else {
      handleAddBidPipeline(targetProject.uuid, (response: BidPipeline) => {
        setTargetProject({ ...targetProject, bidPipeline: response });
      }).catch(() => {
        setTargetProject({ ...targetProject, bidPipeline: undefined });
      });
    }
  };

  const deadlineText = useMemo(() => {
    const remainingDays = getDeadlineDate(targetProject);
    return remainingDays < 0 ? (
      <Text>-</Text>
    ) : (
      <Text className={styles.deadlineText}>
        締切日まで <Strong className={styles.deadlineDateText}>{remainingDays}日</Strong>
      </Text>
    );
  }, [targetProject]);

  const isCompanyProject = targetProject.companyProjectId != null;
  const shouldShowProjectReactionButton =
    showProjectReactionButton && !targetProject.bidPipeline?.id && !isCompanyProject;
  const shouldShowPipelineButton = showBidPipelineIcon && !isCompanyProject;

  const onClickCard = () => {
    if (!targetProject.hasBrowsed && user) {
      handleBrowseProject(targetProject.uuid);
      setTargetProject({ ...targetProject, hasBrowsed: true });
    }
    window.open(`/projects/${targetProject.uuid}?source=${source}`, '_blank');
  };

  return (
    <AppTooltip
      triggerChildren={
        <Box
          className={`${styles.projectSummaryCard} ${targetProject.hasBrowsed && styles.projectBrowsedCard}`}
          onClick={() => {
            onClickCard();
          }}
        >
          <Box>
            <Flex direction={'column'} gap='2' justify={'start'} align={'start'} width={'100%'}>
              {topElement}
              <Flex direction={'row'} gap='2' align={'center'}>
                {!targetProject.hasBrowsed &&
                  targetProject.isNewArrival &&
                  isOpenProject(targetProject) && <NewArraivalTag size='small' />}
                {targetProject.bidPipeline?.status ? (
                  <BidPipelineStatusTag status={targetProject.bidPipeline.status} size='small' />
                ) : (
                  targetProject.hasBrowsed && <BrowsedTag size='small' />
                )}
              </Flex>
              <Box style={{ width: '100%' }}>
                <Text className={styles.projectSummaryCardTitle}>{targetProject.title}</Text>
              </Box>
            </Flex>
            <Flex
              direction={'column'}
              gap='2'
              className={styles.projectSummaryCardIconBadgeColumns}
            >
              {targetProject.prefectures && (
                <IconBadge
                  text={targetProject.prefectures.join(',') ?? ''}
                  icon_name='location_on'
                  active={!!targetProject.prefectures && targetProject.prefectures.length > 0}
                  icon_color={'var(--app-blue-light)'}
                  font_size='12px'
                />
              )}
              {targetProject.procedureTypeGroup && (
                <IconBadge
                  text={targetProject.procedureTypeGroup ?? ''}
                  icon_name='rule'
                  active={!!targetProject.procedureTypeGroup}
                  icon_color={'var(--app-purple-main)'}
                  font_size='12px'
                />
              )}
              {targetProject.organizationName && (
                <IconBadge
                  text={targetProject.organizationName ?? ''}
                  icon_name='account_balance'
                  active={!!targetProject.organizationName}
                  icon_color={'var(--app-green-main)'}
                  font_size='12px'
                />
              )}
              {targetProject.publicationDate && (
                <IconBadge
                  text={`公告日: ${targetProject.publicationDate}`}
                  icon_name='calendar_today'
                  active={!!targetProject.publicationDate}
                  icon_color={'var(--app-strong)'}
                  font_size='12px'
                />
              )}
              {(targetProject.applicationDocumentDeadlineDate ||
                targetProject.proposalDocumentDeadlineDate) && (
                <IconBadge
                  text={`締切日: ${targetProject.applicationDocumentDeadlineDate ?? targetProject.proposalDocumentDeadlineDate}`}
                  icon_name='calendar_today'
                  active={!!targetProject.publicationDate}
                  icon_color={'var(--app-purple-secondary)'}
                  font_size='12px'
                />
              )}
            </Flex>
          </Box>
          <Flex
            direction={'column'}
            justify={'start'}
            align={'start'}
            gap={'2'}
            className={styles.footer}
          >
            {deadlineText}
            <Flex direction={'row'} justify={'between'} align={'center'} width={'100%'}>
              {shouldShowProjectReactionButton && (
                <ProjectReactionButton
                  reaction={targetProject.reaction ?? ProjectReactionType.neutral}
                  onChangeReaction={(
                    e: React.MouseEvent<HTMLButtonElement>,
                    newReaction: ProjectReactionType
                  ) => {
                    handleClickReaction(e, newReaction);
                  }}
                />
              )}
              {shouldShowPipelineButton && (
                <Button
                  className={`actionButton ${styles.projectPipelineButton} ${!!targetProject.bidPipeline && 'actionActiveButton'}`}
                  onClick={handleClickPipeline}
                >
                  <span className={'material-icons'} translate='no' aria-hidden='true'>
                    note
                  </span>
                  <Text>{targetProject.bidPipeline?.id ? '追加済み' : '追加する'}</Text>
                </Button>
              )}
            </Flex>
          </Flex>
        </Box>
      }
      content={<Text className={styles.tooltipText}>{project.title}</Text>}
    />
  );
};
