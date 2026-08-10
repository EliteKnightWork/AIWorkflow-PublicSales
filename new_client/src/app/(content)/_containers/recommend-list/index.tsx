'use client';
import { RecommendListContainer } from './container';
import { RecommendListType } from './type';

type Props = {
  displayType?: RecommendListType;
};

export default function RecommendList({ displayType }: Props) {
  return <RecommendListContainer displayType={displayType ?? RecommendListType.MYPAGE} />;
}
