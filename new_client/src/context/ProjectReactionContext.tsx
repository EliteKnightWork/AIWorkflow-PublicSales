'use client';
import React, { createContext, useCallback, useContext } from 'react';
import { useToast } from './ToastContext';
import type { ProjectReactionType } from '@/api/generated/models';
import { updateProjectReaction } from '@/api/generated/endpoints/project-reactions';
import { type ReactionEventSource, sendProjectReactionEvent } from '@/utils/googleAnalyticsUtils';

type ProjectReactionContextType = {
  handleUpdateReaction: (
    uuid: string,
    reaction: ProjectReactionType,
    source: ReactionEventSource
  ) => Promise<void>;
};

const ProjectReactionContext = createContext<ProjectReactionContextType | undefined>(undefined);

export const useProjectReaction = () => {
  const context = useContext(ProjectReactionContext);
  if (!context) {
    throw new Error('useProjectReaction must be used within a ProjectReactionProvider');
  }
  return context;
};

export const ProjectReactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { enqueueToast } = useToast();
  const handleUpdateReaction = useCallback(
    async (uuid: string, reaction: ProjectReactionType, source: ReactionEventSource) => {
      try {
        await updateProjectReaction(uuid, { reaction: reaction });
        enqueueToast('リアクションを更新しました');
        // 成功時のみGoogle Analyticsにイベントを送信
        sendProjectReactionEvent(uuid, 'project', reaction, source);
      } catch (e) {
        enqueueToast('リアクションの更新に失敗しました');
        throw e;
      }
    },
    [enqueueToast]
  );

  const value = React.useMemo(
    () => ({
      handleUpdateReaction,
    }),
    [handleUpdateReaction]
  );

  return (
    <ProjectReactionContext.Provider value={value}>{children}</ProjectReactionContext.Provider>
  );
};
