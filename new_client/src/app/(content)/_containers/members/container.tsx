'use client';
import { useEffect } from 'react';
import { getCompanyInvitations, useGetCompanyMembers } from '@/api/generated/endpoints/companies';
import { useToast } from '@/context/ToastContext';
import { useApiError } from '@/hooks/useApiError';
import Members from './presentational';

export default function MembersContainer() {
  const { enqueueToast } = useToast();
  const { getApiErrorMessage } = useApiError();
  const { data: members, refetch: refetchMembers } = useGetCompanyMembers();

  useEffect(() => {
    refetchMembers();
  }, []);

  const onGetCompanyInvitations = async () => {
    try {
      const result = await getCompanyInvitations();
      navigator.clipboard.writeText(
        `${process.env.NEXT_PUBLIC_CLIENT_BASE_URL}/signup?redirect_to=/join&token=${result.token}`
      );
      enqueueToast('招待リンクをコピーしました！', 'success');
    } catch (e) {
      const message = getApiErrorMessage(e);
      enqueueToast(message.text, 'error');
    }
  };

  return (
    <Members members={members?.members ?? []} onGetCompanyInvitations={onGetCompanyInvitations} />
  );
}
