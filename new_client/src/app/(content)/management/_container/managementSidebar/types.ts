export const SidebarDisplayMode = {
  PROJECT: 'project',
  PROJECT_EDIT: 'project_edit',
  PROJECT_CREATE: 'project_create',
  TASK_INFO: 'task_info',
  TASK_DETAIL: 'task_detail',
  TASK_CREATE: 'task_create',
} as const;

export type SidebarDisplayMode = (typeof SidebarDisplayMode)[keyof typeof SidebarDisplayMode];

export const MenagementSidebarTab = {
  PROJECT: 'project',
  TASK: 'task',
} as const;

export type MenagementSidebarTab = (typeof MenagementSidebarTab)[keyof typeof MenagementSidebarTab];
