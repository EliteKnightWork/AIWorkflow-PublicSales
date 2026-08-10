import { redirect } from 'next/navigation';
import { getServerAccessToken } from '@/lib/getServerAccessToken';
import LimitedPage from '../../../_components/limited_page';

export default async function LimitedProjects() {
  const token = await getServerAccessToken(true);

  if (!token) {
    return <LimitedPage backgroundImage={'/projects_limited.svg'} />;
  }

  redirect('/projects');
}
