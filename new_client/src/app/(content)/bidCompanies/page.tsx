import { Flex } from '@radix-ui/themes';
import { searchBidCompanies } from '@/api/generated/endpoints/bid-companies';
import type { SearchBidCompaniesParams } from '@/api/generated/models';
import { ContentHeader } from '@/app/_components/contentHeader/ContentHeader';
import { PerPageOptions } from '@/components/pagenatesPer/types';
import { getCookie } from '@/lib/getCookie';
import { getServerAccessToken } from '@/lib/getServerAccessToken';
import { BidCompanyList } from './_containers/bidCompany-list';
import BidCompanySearch from './_containers/bidCompany-search';

type Props = {
  searchParams: Promise<SearchBidCompaniesParams>;
};

export default async function BidCompanies(props: Props) {
  const searchParams = await props.searchParams;
  const accessToken = await getServerAccessToken();

  const cookiePerPage = await getCookie('bidCompaniesPerPage');
  const paramPerPage = Number(searchParams.perPage) || Number(cookiePerPage) || 25;
  const perPage = PerPageOptions.find((p) => p.value === paramPerPage)?.value;

  const params: SearchBidCompaniesParams = {
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

  const res = await searchBidCompanies(
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
    <Flex direction='column' style={{ width: '100%' }}>
      <ContentHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: '落札企業一覧', as: 'h1' },
        ]}
      />
      <BidCompanySearch searchParams={params} />
      <BidCompanyList
        bidCompanies={res.bidCompanies || []}
        pagination={res.meta?.pagination || {}}
      />
    </Flex>
  );
}
