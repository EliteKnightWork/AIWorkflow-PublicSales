'use client';

import { ProjectReactionType } from '@/api/generated/models/projectReactionType';
import { sendGTMEvent } from '@next/third-parties/google';

export type ReactionEventSource =
  | 'search_result'
  | 'recommendation'
  | 'detail'
  | 'detail_via_recommendation'
  | 'similar_project'
  | 'pipeline';

/**
 * 検索イベントをGoogle Analyticsに送信する
 * @param searchType - 検索タイプ
 * @param searchTerm - 検索キーワード
 */
export const sendSearchEvent = (searchType: string, searchTerm: string) => {
  sendGTMEvent({
    event: 'search',
    search_type: searchType,
    search_term: searchTerm,
  });
};

/**
 * プロジェクトリアクションイベントをGoogle Analyticsに送信する
 * @param uuid - プロジェクトのUUID
 * @param projectType - プロジェクトタイプ
 * @param reaction - リアクションタイプ
 * @param source - イベントの発生元
 */
export const sendProjectReactionEvent = (
  uuid: string,
  projectType: string,
  reaction: ProjectReactionType,
  source: ReactionEventSource
) => {
  const event =
    reaction === ProjectReactionType.like
      ? 'reaction_like'
      : reaction === ProjectReactionType.neutral
        ? 'reaction_neutral'
        : 'reaction_dislike';

  sendGTMEvent({
    event: event,
    uuid: uuid,
    project_type: projectType,
    favorite_source: source,
  });
};
