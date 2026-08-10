import { redirect } from 'next/navigation';
import { getMyCompany } from '@/api/generated/endpoints/companies';
import { resetGuestFeatureUsage } from '@/api/generated/endpoints/guest-feature-usages';
import { getSearchFilterPresets } from '@/api/generated/endpoints/search-filter-presets';
import { getServerAccessToken } from '@/lib/getServerAccessToken';
import { getForwardedFor } from '@/lib/getServerForwardedFor';
import Onboarding from '../_containers/onboarding';
import type { LoginSearchParams } from './model';

interface ServerComponentProps {
  searchParams: Promise<LoginSearchParams>;
}

export default async function Login(props: ServerComponentProps) {
  const searchParams = await props.searchParams;
  const token = await getServerAccessToken(true);

  if (token) {
    const returnTo = searchParams.redirect_to;

    // ログイン済みの場合
    const searchParamsString = new URLSearchParams({
      ...(searchParams.token && { token: searchParams.token }),
    }).toString();

    const accessToken = await getServerAccessToken(true);

    const forwardedFor = await getForwardedFor();

    // ログイン直後に未ログイン状態の利用制限をリセット
    await resetGuestFeatureUsage({
      headers: {
        'Content-Type': 'application/json',
        ...accessToken,
        'X-Forwarded-For': forwardedFor,
      },
    }).catch((e) => {
      if (e.status === 401) {
        const params = new URLSearchParams({
          returnTo: `${process.env.NEXT_PUBLIC_CLIENT_BASE_URL}/logout`,
        });
        redirect(`/auth/logout?${params.toString()}`);
      }
    });

    if (!searchParams.token || returnTo !== '/join') {
      // すでに会社と紐づいているか確認する
      const res = await getMyCompany({
        headers: {
          ...accessToken,
        },
      }).catch((e) => {
        if (e.status === 404) {
          return { error: 'not_found_my_company' };
        }
        return { error: 'login_unexpected_error' };
      });

      if ('error' in res) {
        const returnToParams = new URLSearchParams({
          error: res.error,
        });
        const params = new URLSearchParams({
          returnTo: `${process.env.NEXT_PUBLIC_CLIENT_BASE_URL}/logout?${returnToParams.toString()}`,
        });
        redirect(`/auth/logout?${params.toString()}`);
      }
    }

    const res = await getSearchFilterPresets(undefined, {
      headers: {
        ...accessToken,
      },
    });
    if (!res.searchFilterPresets || res.searchFilterPresets.length === 0) {
      // 保存済みの検索条件がない場合
      return (
        <Onboarding redirectPath={returnTo ? `${returnTo}?${searchParamsString}` : '/mypage'} />
      );
    }

    if (returnTo) {
      if (returnTo.includes('?')) {
        redirect(returnTo);
      }
      redirect(`${returnTo}?${searchParamsString}`);
    } else {
      redirect('/mypage');
    }
  }

  // 前処理(return_toの付与)
  const returnToParams = new URLSearchParams({
    ...searchParams,
  });

  const params = new URLSearchParams({
    returnTo: `/login?${returnToParams.toString()}`,
  });

  redirect(`/auth/login?${params.toString()}`);
}
