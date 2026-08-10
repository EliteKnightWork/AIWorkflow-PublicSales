import { joinCompany } from '@/api/generated/endpoints/companies';
import { getServerAccessToken } from '@/lib/getServerAccessToken';
import type { JoinSearchParams } from './model';
import { Presentational } from './presentational';

interface ServerComponentProps {
  searchParams: Promise<JoinSearchParams>;
}

export default async function Join(props: ServerComponentProps) {
  const searchParams = await props.searchParams;
  const token = searchParams.token;

  if (!token) {
    return <Presentational error='not_found_join_token' />;
  }

  const accessToken = await getServerAccessToken();

  return await joinCompany(
    {
      token: token,
    },
    {
      headers: {
        ...accessToken,
      },
    }
  )
    .then(() => {
      return <Presentational ok />;
    })
    .catch((_e) => {
      // エラー通知
      return <Presentational error='join_company_error' />;
    });
}
