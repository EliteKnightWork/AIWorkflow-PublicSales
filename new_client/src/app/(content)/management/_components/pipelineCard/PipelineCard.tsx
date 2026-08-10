import { Flex, Text } from '@radix-ui/themes';
import type { BidPipeline } from '@/api/generated/models';
import { BidPipelineStatusStage } from '@/api/generated/models';
import AppTooltip from '@/app/_components/tooltip/AppTooltip';
import IconBadge from '@/app/(content)/_components/stateBadge/IconBadge';
import { getPipelineStatusByDueDate, PipelineStatus } from '@/app/(content)/management/types';
import styles from './styles.module.css';

type Props = {
  pipeline: BidPipeline;
};

export const PipelineCard = ({ pipeline }: Props) => {
  const getPipelineStatus = (() => {
    if (pipeline.status?.stage === BidPipelineStatusStage.done) return PipelineStatus.NORMAL;

    const baseDeadlineDate =
      pipeline.project?.applicationDocumentDeadlineDate ||
      pipeline.project?.proposalDocumentDeadlineDate ||
      pipeline.project?.biddingDeadlineDate;
    if (!baseDeadlineDate) return PipelineStatus.NORMAL;
    return getPipelineStatusByDueDate(baseDeadlineDate);
  })();

  const isErrorStatus = getPipelineStatus === PipelineStatus.ERROR;
  const isWarningStatus = getPipelineStatus === PipelineStatus.WARNING;

  return (
    <Flex
      className={`${styles.taskCard} ${
        isErrorStatus
          ? styles.expiredPipelineCard
          : isWarningStatus
            ? styles.warningPipelineCard
            : ''
      }`}
      direction={'column'}
      gap='2'
    >
      <Flex direction={'row'} gap='2' align={'center'} justify='start'>
        {isErrorStatus && (
          <span
            className='material-icons'
            translate='no'
            aria-hidden='true'
            style={{ color: 'var(--text-color-error)' }}
          >
            error
          </span>
        )}
        {isWarningStatus && (
          <span
            className='material-icons'
            translate='no'
            aria-hidden='true'
            style={{ color: 'var(--app-yellow-light)' }}
          >
            warning
          </span>
        )}

        <AppTooltip
          triggerChildren={
            <Text className={`${styles.taskCardTitle}`}>{pipeline.project?.title}</Text>
          }
          content={pipeline.project?.title}
        />
      </Flex>
      <Flex direction={'column'} gap='1' className={styles.iconBadgeColumns}>
        {pipeline.project?.applicationDocumentDeadlineDate ? (
          <IconBadge
            text={`参加申し込み期日: ${pipeline.project.applicationDocumentDeadlineDate}`}
            icon_name='calendar_today'
            active
            icon_color={'var(--text-color-tertiary)'}
            bg_color={'var(--bg-color-modal)'}
            text_color={'var(--text-color-tertiary)'}
            font_size='12px'
            icon_size='16px'
            badge_className={styles.iconBadge}
          />
        ) : pipeline.project?.proposalDocumentDeadlineDate ? (
          <IconBadge
            text={`提案書期日: ${pipeline.project?.proposalDocumentDeadlineDate}`}
            icon_name='calendar_today'
            active
            icon_color={'var(--text-color-secondary)'}
            bg_color={'var(--bg-color-modal)'}
            text_color={'var(--text-color-secondary)'}
            font_size='12px'
            icon_size='16px'
            badge_className={styles.iconBadge}
          />
        ) : (
          pipeline.project?.biddingDeadlineDate && (
            <IconBadge
              text={`入札日: ${pipeline.project?.biddingDeadlineDate ?? '-'}`}
              icon_name='calendar_today'
              active
              icon_color={'var(--text-color-tertiary)'}
              bg_color={'var(--bg-color-modal)'}
              text_color={'var(--text-color-tertiary)'}
              font_size='12px'
              icon_size='16px'
              badge_className={styles.iconBadge}
            />
          )
        )}
        <IconBadge
          text={pipeline.assignedUsers?.map((u) => u.name ?? u.email).join(',') ?? '-'}
          icon_name='account_circle'
          active
          icon_color={'var(--text-color-purple)'}
          bg_color={'var(--bg-color-red)'}
          text_color={'var(--text-color-purple)'}
          font_size='12px'
          icon_size='16px'
          badge_className={styles.iconBadge}
        />
        {pipeline.upcommingTask && (
          <IconBadge
            text={pipeline.upcommingTask.title}
            icon_name='task'
            active
            icon_color={'var(--text-color-green)'}
            bg_color={'var(--bg-color-green)'}
            text_color={'var(--text-color-green)'}
            font_size='12px'
            icon_size='16px'
            badge_className={styles.iconBadge}
          />
        )}
      </Flex>
    </Flex>
  );
};
