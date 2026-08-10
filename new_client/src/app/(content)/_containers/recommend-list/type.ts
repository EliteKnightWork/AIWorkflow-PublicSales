export const RecommendListType = {
  MYPAGE: 'mypage',
  PROJECT: 'project',
} as const;

export type RecommendListType = (typeof RecommendListType)[keyof typeof RecommendListType];
