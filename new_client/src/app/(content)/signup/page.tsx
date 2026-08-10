'use server';
import { redirect } from 'next/navigation';
import {
  checkCompanyMemberLimitation,
  verifyCompanyInvitation,
} from '@/api/generated/endpoints/companies';
import { getCachedSession } from '@/lib/auth0';
import type { SignupSearchParams } from './model';
import { Presentational } from './presentational';

interface ServerComponentProps {
  searchParams: Promise<SignupSearchParams>;
}

export default async function Signup(props: ServerComponentProps) {
  const searchParams = await props.searchParams;
  const session = await getCachedSession();

  const token = searchParams.token;
  const error = searchParams.error;

  if (error) {
    return <Presentational error={error} />;
  }

  if (session) {
    const returnTo = searchParams.redirect_to;

    if (returnTo) {
      const searchParamsString = new URLSearchParams({
        ...(token && { token }),
      }).toString();
      redirect(`${returnTo}?${searchParamsString}`);
    }
  }

  if (!token) {
    redirect('/signup?error=not_found_token');
  }

  const verifyResponse = await verifyCompanyInvitation({ token })
    .then((res) => {
      if (!res) {
        return { error: 'invalid_token' };
      }
    })
    .catch((_e) => {
      return { error: 'invalid_token' };
    });

  if (verifyResponse && 'error' in verifyResponse) {
    redirect(`/signup?error=${verifyResponse.error}`);
  }

  const limitResponse = await checkCompanyMemberLimitation({ token }).catch((_e) => {
    return { error: 'company_member_limitation' };
  });

  if (limitResponse && 'error' in limitResponse) {
    redirect(`/signup?error=${limitResponse.error}`);
  }

  const returnToParams = new URLSearchParams({
    ...searchParams,
  });

  const params = new URLSearchParams({
    screen_hint: 'signup',
    returnTo: `/signup?${returnToParams.toString()}`,
  });

  redirect(`/auth/login?${params.toString()}`);
}
