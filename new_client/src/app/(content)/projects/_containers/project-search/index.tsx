import { getCachedSession } from '@/lib/auth0';
import ProjectSearchPresentational from './presentational';

export default async function ProjectSearch() {
  const session = await getCachedSession();

  return <ProjectSearchPresentational isLogin={!!session} />;
}
