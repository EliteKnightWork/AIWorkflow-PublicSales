'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';

function LogoutContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || searchParams.get('state');
  const { enqueueToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (error === 'not_found_join_token') {
      enqueueToast(
        'こちらのアカウントはご利用できません。再度、招待用URLを受け取ってログインしてください。',
        'error'
      );
    } else if (error === 'join_company_error') {
      enqueueToast(
        'URLが誤っているため、ご利用できません。再度、招待用URLを受け取ってログインしてください。',
        'error'
      );
    } else if (error === 'login_unexpected_error') {
      enqueueToast('ログインに失敗しました。再度お試しください。', 'error');
    } else if (error === 'not_found_my_company') {
      enqueueToast(
        'こちらのアカウントはご利用できません。再度、招待用URLを受け取ってログインしてください。',
        'error'
      );
    } else {
      if (error) {
        enqueueToast('想定外のエラーが発生しました。再度お試しください', 'error');
      }
    }

    router.push('/');
  }, [error]);

  return null;
}

export default function Logout() {
  return (
    <Suspense fallback={null}>
      <LogoutContent />
    </Suspense>
  );
}
