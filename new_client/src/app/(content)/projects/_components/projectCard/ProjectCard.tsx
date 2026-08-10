'use client';
import { useUser } from '@auth0/nextjs-auth0';
import { Badge, Box, Button, Flex, Heading, Link, Strong, Text } from '@radix-ui/themes';
import dayjs from 'dayjs';
import React, { useMemo, useRef, useState } from 'react';
import { ProjectReactionType, type Project } from '@/api/generated/models';
import AppTooltip from '@/app/_components/tooltip/AppTooltip';
import { getDeadlineDate } from '@/app/(content)/projects/model';
import { CloseIcon } from '@/components/projectIcon/CloseIcon';
import { OpenIcon } from '@/components/projectIcon/OpenIcon';
import { useBidPipeline } from '@/context/BidPipelineContext';
import { useCta } from '@/context/CtaContext';
import { useBrowsedProject } from '@/hooks/useBrowsedProject';
import IconBadge from '../../../_components/stateBadge/IconBadge';
import { isOpenProject } from '../../model';
import { BidPipelineStatusTag } from '../bidPipelineStatusTag';
import { BrowsedTag } from '../browsedTag';
import styles from './styles.module.css';
import { ProjectReactionButton } from '@/features/ProjectReactionButton';
import { useProjectReaction } from '@/context/ProjectReactionContext';

type ProjectCardProps = {
  project: Project;
  onClickCard: (project: Project) => void;
  isSp?: boolean;
};

export default function ProjectCard({ project, onClickCard, isSp }: ProjectCardProps) {
  const { user } = useUser();
  const { openCta } = useCta();

  const [targetProject, setTargetProject] = useState<Project>(project);
  const [isTitleTruncated, setIsTitleTruncated] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const { handleAddBidPipeline, openConfirmDeleteBidPipelineDialog } = useBidPipeline();
  const { handleUpdateReaction } = useProjectReaction();
  const { handleBrowseProject } = useBrowsedProject();
  const isCompanyProject = targetProject.companyProjectId != null;

  const handleClickReaction = (
    e: React.MouseEvent<HTMLButtonElement>,
    reaction: ProjectReactionType
  ) => {
    e.stopPropagation();

    if (!user) {
      openCta();
      return;
    }

    const currentReaction = targetProject.reaction ?? ProjectReactionType.neutral;
    setTargetProject({ ...targetProject, reaction: reaction });
    handleUpdateReaction(targetProject.uuid, reaction, 'search_result').catch(() => {
      setTargetProject({ ...targetProject, reaction: currentReaction });
    });
  };

  const handleClickPipeline = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (!user) {
      openCta();
      return;
    }

    if (targetProject.bidPipeline?.id) {
      // 案件管理から外す
      openConfirmDeleteBidPipelineDialog(
        targetProject.bidPipeline.id.toString(),
        () => {
          setTargetProject({ ...targetProject, bidPipeline: undefined });
        },
        () => {}
      );
    } else {
      handleAddBidPipeline(targetProject.uuid, (pipeline) => {
        setTargetProject({
          ...targetProject,
          bidPipeline: {
            id: pipeline.id,
            status: pipeline.status,
          },
        });
      }).catch(() => {
        setTargetProject({ ...targetProject, bidPipeline: undefined });
      });
    }
  };

  const onClickProjectCard = (clickedProject: Project) => {
    if (!clickedProject.hasBrowsed && user) {
      handleBrowseProject(clickedProject.uuid);
      setTargetProject({ ...clickedProject, hasBrowsed: true });
    }

    onClickCard(clickedProject);
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

  const registrationText = useMemo(() => {
    return (
      <Text className={styles.registrationText}>
        登録日：
        {targetProject.registrationDate
          ? dayjs(targetProject.registrationDate).format('YYYY/MM/DD')
          : '-'}
      </Text>
    );
  }, [targetProject]);

  // タイトルが省略されているかチェック
  React.useEffect(() => {
    if (titleRef.current) {
      setIsTitleTruncated(titleRef.current.scrollWidth > titleRef.current.clientWidth);
    }
  }, []);

  // 親から渡ってくる project の変更をローカル状態へ同期
  React.useEffect(() => {
    setTargetProject(project);
  }, [project]);

  return (
    <Flex
      direction='column'
      gap='4'
      className={`${styles.projectCard} ${targetProject.hasBrowsed && styles.projectBrowsedCard}`}
      onClick={() => onClickProjectCard(targetProject)}
    >
      <Flex justify='between' width='100%' gap={{ initial: '2', lg: '4' }} align='center'>
        <Flex
          direction='row'
          gap={{ initial: '2', lg: '4' }}
          align='center'
          className={styles.titleContainer}
        >
          {isOpenProject(targetProject) ? (
            <OpenIcon className={styles.projectCardIcon} />
          ) : (
            <CloseIcon className={styles.projectCardIcon} />
          )}
          <Flex direction='column' gap='2' className={styles.titleContainer}>
            <Flex direction='row' gap='2'>
              {!targetProject.hasBrowsed &&
                targetProject.isNewArrival &&
                isOpenProject(targetProject) && (
                  <Box>
                    <Badge className={styles.newArrivalBadge}>新着</Badge>
                  </Box>
                )}
              {!isSp && targetProject.bidPipeline?.status ? (
                <Box>
                  <BidPipelineStatusTag size='large' status={targetProject.bidPipeline.status} />
                </Box>
              ) : (
                targetProject.hasBrowsed && (
                  <Box>
                    <BrowsedTag />
                  </Box>
                )
              )}
            </Flex>
            {isTitleTruncated ? (
              <AppTooltip
                triggerChildren={
                  <Heading
                    as='h2'
                    size='5'
                    weight='bold'
                    className={styles.projectTitle}
                    ref={titleRef}
                  >
                    {targetProject.title}
                  </Heading>
                }
                content={targetProject.title}
              />
            ) : (
              <Heading
                as='h2'
                size='5'
                weight='bold'
                className={styles.projectTitle}
                ref={titleRef}
              >
                {targetProject.title}
              </Heading>
            )}
          </Flex>
        </Flex>
        <Flex gap='2' direction='row' align='center' className={styles.buttonArea}>
          {!isCompanyProject && !targetProject.bidPipeline?.id && (
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
          {!isCompanyProject && (
            <Button
              className={`actionButton ${styles.pipelineButton} ${!!targetProject.bidPipeline && 'actionActiveButton'}`}
              onClick={handleClickPipeline}
            >
              <span className='material-icons' translate='no' aria-hidden='true'>
                note
              </span>
              <Text>{targetProject.bidPipeline ? '案件管理に追加済み' : '案件管理に追加する'}</Text>
            </Button>
          )}
          {!isSp && (
            <Link
              href={`/projects/${targetProject.uuid}`}
              onClick={(e) => e.stopPropagation()}
              className={`${styles.openButton}`}
            >
              <span className='material-icons' translate='no' aria-hidden='true'>
                open_in_new
              </span>
            </Link>
          )}
        </Flex>
      </Flex>
      <Flex direction='row' className={styles.projectInfo} gap='2'>
        <IconBadge
          text={targetProject.organizationName ?? ''}
          icon_name='account_balance'
          active={!!targetProject.organizationName}
          icon_color={'var(--app-green-main)'}
          font_size={isSp ? '14px' : undefined}
          notLink
        />
        <IconBadge
          text={targetProject.prefectures?.join(',') ?? ''}
          icon_name='location_on'
          active={!!targetProject.prefectures && targetProject.prefectures?.length > 0}
          icon_color={'var(--app-blue-light)'}
          font_size={isSp ? '14px' : undefined}
          notLink
        />
        <IconBadge
          text={targetProject.procedureTypeGroup ?? ''}
          icon_name='rule'
          active={!!targetProject.procedureTypeGroup}
          icon_color={'var(--app-purple-main)'}
          font_size={isSp ? '14px' : undefined}
          notLink
        />
        <IconBadge
          text={`公告日: ${targetProject.publicationDate ?? ''}`}
          icon_name='calendar_today'
          active={!!targetProject.publicationDate}
          icon_color={'var(--app-strong)'}
          font_size={isSp ? '14px' : undefined}
          notLink
        />
        <IconBadge
          text={`参加申し込み期日: ${targetProject.applicationDocumentDeadlineDate ?? ''}`}
          icon_name='calendar_today'
          active={!!targetProject.applicationDocumentDeadlineDate}
          icon_color={'var(--app-purple-secondary)'}
          font_size={isSp ? '14px' : undefined}
          notLink
        />
        <IconBadge
          text={`提案書期日: ${targetProject.proposalDocumentDeadlineDate ?? ''}`}
          icon_name='calendar_today'
          active={!!targetProject.proposalDocumentDeadlineDate}
          icon_color={'var(--app-orange-main)'}
          font_size={isSp ? '14px' : undefined}
          notLink
        />
        <IconBadge
          text={`入札日: ${targetProject.biddingDeadlineDate ?? ''}`}
          icon_name='calendar_today'
          active={!!targetProject.biddingDeadlineDate}
          icon_color={'var(--app-yellow-light)'}
          font_size={isSp ? '14px' : undefined}
          notLink
        />
      </Flex>

      <Flex justify='between' width='100%' align='center'>
        {deadlineText}
        {registrationText}
      </Flex>
    </Flex>
  );
}
