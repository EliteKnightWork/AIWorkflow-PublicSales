import type { SearchOrganizationsParams } from '@/api/generated/models';
import OrganizationSearchPresentational from './presentational';

type Props = {
  searchParams: SearchOrganizationsParams;
};

export default async function OrganizationSearch({ searchParams }: Props) {
  return <OrganizationSearchPresentational searchParams={searchParams} />;
}
