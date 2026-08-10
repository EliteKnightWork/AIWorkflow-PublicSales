import { Flex } from '@radix-ui/themes';
import { searchOrganizations } from '@/api/generated/endpoints/organizations';
import type { SearchOrganizationsParams } from '@/api/generated/models';
import { ContentHeader } from '@/app/_components/contentHeader/ContentHeader';
import { PerPageOptions } from '@/components/pagenatesPer/types';
import { getCookie } from '@/lib/getCookie';
import { getServerAccessToken } from '@/lib/getServerAccessToken';
import { OrganizationList } from './_containers/organization-list';
import OrganizationSearch from './_containers/organization-search';

type Props = {
  searchParams: Promise<SearchOrganizationsParams>;
};

export default async function Organizations(props: Props) {
  const searchParams = await props.searchParams;
  const accessToken = await getServerAccessToken();

  const cookiePerPage = await getCookie('organizationsPerPage');
  const paramPerPage = Number(searchParams.perPage) || Number(cookiePerPage) || 25;
  const perPage = PerPageOptions.find((p) => p.value === paramPerPage)?.value || 25;

  const params: SearchOrganizationsParams = {
    ...(searchParams.keywords && {
      keywords: Array.isArray(searchParams.keywords)
        ? searchParams.keywords
        : (searchParams.keywords as string).split(','),
    }),
    ...(searchParams.page && {
      page: searchParams.page,
    }),
    ...(perPage && {
      perPage: perPage,
    }),
  };

  const res = await searchOrganizations(
    {
      ...params,
    },
    {
      headers: {
        ...accessToken,
      },
    }
  );

  return (
    <Flex direction={'column'} style={{ width: '100%' }}>
      <ContentHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: '発注機関一覧', as: 'h1' },
        ]}
      />
      <OrganizationSearch searchParams={params} />
      <OrganizationList
        organizations={res.organizationSearchResults || []}
        pagination={res.meta?.pagination || {}}
      />
    </Flex>
  );
}
