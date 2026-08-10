import { redirect } from 'next/navigation';
import { getCachedCompanyMembers } from '@/lib/getCachedCompanyMembers';
import { getServerAccessToken } from '@/lib/getServerAccessToken';
import LikedProjectsListPresentational from './presentational';
import { getProjectReactionLikes } from '@/api/generated/endpoints/project-reactions';
import { ProjectReactionType } from '@/api/generated/models';

// いいねした案件の表示
export default async function LikedProjectsList() {
  // お気に入り情報の取得
  const accessToken = await getServerAccessToken();

  try {
    const [likedProjects, companyMembers] = await Promise.all([
      getProjectReactionLikes(
        {
          sort_by: 'publication_date_desc',
          reaction: ProjectReactionType.like,
        },
        {
          headers: {
            ...accessToken,
          },
        }
      ),
      getCachedCompanyMembers(),
    ]);

    return (
      <LikedProjectsListPresentational
        likedProjectsItems={likedProjects.reactedProjects ?? []}
        companyMembers={companyMembers.members ?? []}
      />
    );
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      return redirect('/login');
    }
  }
}
