'use client';
import { useMemo } from 'react';
import { useGetParticipateQualifications } from '@/api/generated/endpoints/participate-qualifications';
import type { GetParticipateQualificationsParams } from '@/api/generated/models';

export const useParticipateQualifications = (params?: GetParticipateQualificationsParams) => {
  const shouldEnable = useMemo(
    () =>
      !params ||
      (params.ids && params.ids.length > 0) ||
      (params.gradeIds && params.gradeIds.length > 0) ||
      (params.types && params.types.length > 0) ||
      (params.prefectures && params.prefectures.length > 0),
    [params]
  );

  const query = useGetParticipateQualifications(params, {
    query: {
      enabled: shouldEnable,
      staleTime: 5 * 60 * 1000, // 5分間はデータを新鮮とみなす
    },
  });

  return {
    data: query.data?.participateQualifications,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
