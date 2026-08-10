import { Flex, Text } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import type { BidPipelineTask } from '@/api/generated/models';
import AppTooltip from '@/app/_components/tooltip/AppTooltip';
import IconBadge from '@/app/(content)/_components/stateBadge/IconBadge';
import { useTaskBoard } from '../../_context/ManagementContext';
import { getTaskStatus, TaskStatus } from '../../types';
import { TaskOptionMenuBar } from '../taskOptionMenu/TaskOptionMenu';
import styles from './styles.module.css';

type Props = {
  task: BidPipelineTask;
};

export const TaskCard = ({ task }: Props) => {
  const { deleteTask } = useTaskBoard();

  const [taskStatus, setTaskStatus] = useState<TaskStatus>(getTaskStatus(task));

  useEffect(() => {
    setTaskStatus(getTaskStatus(task));
  }, [task]);

  const isErrorStatus = taskStatus === TaskStatus.ERROR;
  const isWarningStatus = taskStatus === TaskStatus.WARNING;

  return (
    <Flex
      className={`${styles.taskCard} ${
        isErrorStatus ? styles.expiredTaskCard : isWarningStatus ? styles.warningTaskCard : ''
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
          <span className='material-icons' style={{ color: 'var(--app-yellow-light)' }}>
            warning
          </span>
        )}

        <AppTooltip
          triggerChildren={<Text className={styles.taskCardTitle}>{task.title}</Text>}
          content={task.title}
        />

        <TaskOptionMenuBar task={task} deleteTask={deleteTask} />
      </Flex>
      <Flex direction={'column'} gap='2' className={styles.iconBadgeColumns}>
        <IconBadge
          text={`タスク期日: ${task.dueDate ?? '-'}`}
          icon_name='calendar_today'
          active
          icon_color={'var(--app-blue-main)'}
          bg_color={'var(--bg-color-info)'}
          text_color={'var(--app-blue-main)'}
          font_size='12px'
          icon_size='16px'
          badge_className={styles.iconBadge}
        />
        <IconBadge
          text={task.assignedUsers?.map((u) => u.name ?? u.email).join(',') ?? '-'}
          icon_name='account_circle'
          active
          icon_color={'var(--text-color-purple)'}
          bg_color={'var(--bg-color-red)'}
          text_color={'var(--text-color-purple)'}
          font_size='12px'
          icon_size='16px'
          badge_className={styles.iconBadge}
        />
        <IconBadge
          text={task.pipeline?.projectTitle ?? '-'}
          icon_name='work'
          active
          icon_color={'var(--text-color-green)'}
          bg_color={'var(--bg-color-green)'}
          text_color={'var(--text-color-green)'}
          font_size='12px'
          icon_size='16px'
          badge_className={styles.iconBadge}
        />
      </Flex>
    </Flex>
  );
};
