import { redirect } from 'next/dist/client/components/navigation';
import { getCachedSession } from '@/lib/auth0';
import LimitedPage from '../../../../_components/limited_page';

export default async function LimitedProjects() {
  const session = await getCachedSession();
  if (!session) {
    return <LimitedPage backgroundImage={'/project_limited.svg'} />;
  }
  redirect('/projects');
}
