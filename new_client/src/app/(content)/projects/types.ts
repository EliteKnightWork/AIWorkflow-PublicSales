export const ProjectType = {
  PROJECT: 'project',
  AWARDED_PROJECT: 'awarded_project',
} as const;

export type ProjectType = (typeof ProjectType)[keyof typeof ProjectType];
