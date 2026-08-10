import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { type BidPipelineTask, BidPipelineTaskStatusStage } from '@/api/generated/models';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Tokyo');

export const ViewMode = {
  TABLE: 'table',
  BOARD: 'board',
} as const;

export type ViewMode = (typeof ViewMode)[keyof typeof ViewMode];

export const TabType = {
  PIPELINE: 'pipeline',
  TASKS: 'tasks',
} as const;

export type TabType = (typeof TabType)[keyof typeof TabType];

export const PipelineStatus = {
  NORMAL: 'normal',
  WARNING: 'warning',
  ERROR: 'error',
} as const;

export type PipelineStatus = (typeof PipelineStatus)[keyof typeof PipelineStatus];

export const TaskStatus = {
  NORMAL: 'normal',
  WARNING: 'warning',
  ERROR: 'error',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const getDaysUntilDeadline = (dueDate?: string) => {
  if (!dueDate) return -1;
  // 締切日と現在時刻を同じ時間(00:00:00)に設定して日数を計算
  const deadlineDate = dayjs(dueDate).startOf('day');
  const now = dayjs().startOf('day');
  const daysUntilDeadline = deadlineDate.diff(now, 'day');
  return daysUntilDeadline;
};

export const getTaskStatus = (task?: BidPipelineTask) => {
  if (task?.status?.stage === BidPipelineTaskStatusStage.done) return TaskStatus.NORMAL;

  return getTaskStatusByDueDate(task?.dueDate);
};

export const getPipelineStatusByDueDate = (dueDate?: string) => {
  if (!dueDate) return PipelineStatus.NORMAL;

  const daysUntilDeadline = getDaysUntilDeadline(dueDate);

  if (daysUntilDeadline <= 2) return PipelineStatus.ERROR;
  if (daysUntilDeadline <= 5) return PipelineStatus.WARNING;
  return PipelineStatus.NORMAL;
};

export const getTaskStatusByDueDate = (dueDate?: string) => {
  if (!dueDate) return TaskStatus.NORMAL;

  const daysUntilDeadline = getDaysUntilDeadline(dueDate);

  if (daysUntilDeadline <= 2) return TaskStatus.ERROR;
  if (daysUntilDeadline <= 5) return TaskStatus.WARNING;
  return TaskStatus.NORMAL;
};

// TMP: ステータスのCRUDを実装するタイミングで色情報をBEに移行する
export const pipelineTaskStatusColorList = [
  {
    id: '予定',
    color: 'var(--bg-color-tag-text-active)',
    borderColor: 'var(--color-secondary)',
  },
  {
    id: '対応中',
    color: 'var(--app-green-secondary)',
    borderColor: 'var(--app-green-main)',
  },
  {
    id: '完了',
    color: 'var(--app-orange-main)',
    borderColor: 'var(--border-color-orange)',
  },
];

// bid_pipeline_statusのstageごとの色定義
export const pipelineStatusColorList = [
  {
    stage: 'doing',
    color: 'var(--app-orange-main)',
    borderColor: 'var(--border-color-orange)',
  },
  {
    stage: 'done',
    color: 'var(--text-color-purple)',
    borderColor: 'var(--border-color-purple)',
  },
];

// bid_pipeline_statusのstageから色を取得するヘルパー関数
export const getPipelineStatusColors = (stage: string | undefined) => {
  const colorConfig = pipelineStatusColorList.find((config) => config.stage === stage);
  return {
    color: colorConfig?.color ?? 'var(--bg-color-tag-text-active)',
    borderColor: colorConfig?.borderColor ?? 'var(--color-secondary)',
  };
};
