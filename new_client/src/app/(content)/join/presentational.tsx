'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useToast } from '@/context/ToastContext';

type Props = {
  error?: string;
  ok?: boolean;
};

export const Presentational = ({ error, ok }: Props) => {
  const router = useRouter();
  const { enqueueToast } = useToast();

  useEffect(() => {
    if (error) {
      const returnToParams = new URLSearchParams({
        error: error,
      });
      const params = new URLSearchParams({
        returnTo: `${process.env.NEXT_PUBLIC_CLIENT_BASE_URL}/logout?${returnToParams.toString()}`,
      });
      router.push(`/auth/logout?${params.toString()}`);
    }

    if (ok) {
      enqueueToast('アカウントの会社紐付けが完了しました。', 'info');
      router.push('/mypage');
    }
  }, [error, ok]);

  return null;
};
