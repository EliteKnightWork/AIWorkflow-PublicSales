'use client';
import { Badge, Box, Flex, Text } from '@radix-ui/themes';
import { useState } from 'react';
import { type Project, ProjectReactionType } from '@/api/generated/models';
import { isOpenProject } from '@/app/(content)/projects/model';
import { CloseIcon } from '@/components/projectIcon/CloseIcon';
import { OpenIcon } from '@/components/projectIcon/OpenIcon';
import IconBadge from '../../stateBadge/IconBadge';
import styles from './styles.module.css';
import { useProjectReaction } from '@/context/ProjectReactionContext';
import { ProjectReactionButton } from '@/features/ProjectReactionButton';

type ProjectCardProps = {
  project: Project;
  onClickCard: (project: Project) => void;
};

export default function SimilarProjectCardSp({ project, onClickCard }: ProjectCardProps) {
  const [targetProject, setTargetProject] = useState<Project>(project);
  const { handleUpdateReaction } = useProjectReaction();
  const handleClickReaction = (
    e: React.MouseEvent<HTMLButtonElement>,
    reaction: ProjectReactionType
  ) => {
    e.stopPropagation();

    const currentReaction = targetProject.reaction ?? ProjectReactionType.neutral;
    setTargetProject({ ...targetProject, reaction: reaction });
    handleUpdateReaction(targetProject.uuid, reaction, 'similar_project').catch(() => {
      setTargetProject({ ...targetProject, reaction: currentReaction });
    });
  };

  return (
    <Box
      className={`${styles.projectCard} ${styles.noShadow} ${styles.noPadding}`}
      onClick={() => onClickCard(project)}
    >
      <Flex direction='row' gap='3' align='center'>
        {(!project.applicationDocumentDeadlineDate && !project.proposalDocumentDeadlineDate) ||
        isOpenProject(project) ? (
          <OpenIcon className={styles.projectCardIcon} />
        ) : (
          <CloseIcon className={styles.projectCardIcon} />
        )}
        <Flex direction='column' gap='2'>
          {project.isNewArrival && isOpenProject(project) && (
            <Box>
              <Badge className={styles.newArrivalBadge}>新着</Badge>
            </Box>
          )}
          <Text className={styles.projectTitle} weight='bold'>
            {project.title}
          </Text>
        </Flex>
        <ProjectReactionButton
          reaction={targetProject.reaction ?? ProjectReactionType.neutral}
          onChangeReaction={(
            e: React.MouseEvent<HTMLButtonElement>,
            newReaction: ProjectReactionType
          ) => {
            handleClickReaction(e, newReaction);
          }}
        />
      </Flex>

      <Flex direction='row' className={styles.projectInfo} gap='2'>
        <IconBadge
          text={targetProject.organizationName ?? ''}
          icon_name='account_balance'
          active={!!targetProject.organizationName}
          icon_color={'var(--app-green-main)'}
          font_size={'16px'}
        />
        <IconBadge
          text={targetProject.prefectures?.join(',') ?? ''}
          icon_name='location_on'
          active={!!targetProject.prefectures && targetProject.prefectures?.length > 0}
          icon_color={'var(--app-blue-light)'}
          font_size={'16px'}
        />
        <IconBadge
          text={targetProject.procedureTypeGroup ?? ''}
          icon_name='rule'
          active={!!targetProject.procedureTypeGroup}
          icon_color={'var(--app-purple-main)'}
          font_size={'16px'}
        />
        <IconBadge
          text={`公告日: ${targetProject.publicationDate ?? ''}`}
          icon_name='calendar_today'
          active={!!targetProject.publicationDate}
          icon_color={'var(--app-strong)'}
          font_size={'16px'}
        />
        <IconBadge
          text={`参加申し込み期日: ${targetProject.applicationDocumentDeadlineDate ?? ''}`}
          icon_name='calendar_today'
          active={!!targetProject.applicationDocumentDeadlineDate}
          icon_color={'var(--app-purple-secondary)'}
          font_size={'16px'}
        />
        <IconBadge
          text={`提案書期日: ${targetProject.proposalDocumentDeadlineDate ?? ''}`}
          icon_name='calendar_today'
          active={!!targetProject.proposalDocumentDeadlineDate}
          icon_color={'var(--app-orange-main)'}
          font_size={'16px'}
        />
        <IconBadge
          text={`入札日: ${targetProject.biddingDeadlineDate ?? ''}`}
          icon_name='calendar_today'
          active={!!targetProject.biddingDeadlineDate}
          icon_color={'var(--app-yellow-light)'}
          font_size={'16px'}
        />
      </Flex>
    </Box>
  );
}
