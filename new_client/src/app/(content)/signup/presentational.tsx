'use client';

import { Flex } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/loadingSpinner/LoadingSpinner';
import { useToast } from '@/context/ToastContext';

type Props = {
  error?: string;
};

export const Presentational = ({ error }: Props) => {
  const router = useRouter();
  const { enqueueToast } = useToast();

  if (error) {
    if (error === 'invalid_token') {
      enqueueToast(
        'こちらのアカウントはご利用できません。再度、招待用URLを受け取ってログインしてください。',
        'error'
      );
    } else if (error === 'company_member_limitation') {
      enqueueToast(
        'ご利用できるアカウント数の上限を超えています。アカウント数の調整をお願いします。利用枠を増加する場合はお問い合わせください。',
        'error'
      );
    } else if (error === 'not_found_token') {
      enqueueToast(
        'こちらのアカウントはご利用できません。再度、招待用URLを受け取ってログインしてください。',
        'error'
      );
    } else {
      enqueueToast('サインアップ処理中にエラーが発生しました', 'error');
    }

    router.push('/');
  }

  return (
    <Flex align='center' justify='center'>
      <LoadingSpinner />
    </Flex>
  );
};
