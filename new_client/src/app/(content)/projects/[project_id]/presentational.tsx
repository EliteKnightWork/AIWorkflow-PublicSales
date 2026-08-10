'use client';

import type { Project } from '@/api/generated/models';
import type { ReactionEventSource } from '@/utils/googleAnalyticsUtils';
import ProjectDetailInfo from '../../_components/projectDetailInfo/ProjectDetailInfo';
import { useEffect, useState } from 'react';

type ProjectDetailProps = {
  project: Project;
  isLogin: boolean;
  position: ReactionEventSource;
  isMobile?: boolean;
  projectTitleContainerClassName?: string;
};

export function ProjectDetailPresentational({
  project,
  isLogin,
  position,
  isMobile,
  projectTitleContainerClassName,
}: ProjectDetailProps) {
  const [targetProject, setTargetProject] = useState<Project>(project);

  useEffect(() => {
    setTargetProject(project);
  }, [project]);

  return (
    <ProjectDetailInfo
      project={targetProject}
      isLogin={isLogin}
      position={position}
      isMobile={isMobile}
      onProjectUpdate={(updatedProject) => setTargetProject(updatedProject)}
      projectTitleContainerClassName={projectTitleContainerClassName}
    />
  );
}
