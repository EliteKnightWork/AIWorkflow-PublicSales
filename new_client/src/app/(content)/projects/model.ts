import type { Project } from '@/api/generated/models';
import { isPastDate } from '@/utils/dateUtils';

export function isOpenProject(project: Project) {
  const targetDate =
    project.applicationDocumentDeadlineDate ??
    project.proposalDocumentDeadlineDate ??
    project.biddingDeadlineDate ??
    '';
  if (targetDate === '') return false;
  return !isPastDate(targetDate);
}

export function getDeadlineDate(project: Project) {
  const targetDate =
    project.applicationDocumentDeadlineDate ?? project.proposalDocumentDeadlineDate ?? '';

  if (targetDate === '') return -1;

  const deadlineDate = Math.ceil(
    (new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return deadlineDate < 0 ? -1 : deadlineDate;
}
