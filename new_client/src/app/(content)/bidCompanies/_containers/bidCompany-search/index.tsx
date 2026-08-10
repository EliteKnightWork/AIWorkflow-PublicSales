import type { SearchBidCompaniesParams } from '@/api/generated/models';
import BidCompanySearchPresentational from './presentational';

type Props = {
  searchParams: SearchBidCompaniesParams;
};

export default async function BidCompanySearch({ searchParams }: Props) {
  return <BidCompanySearchPresentational searchParams={searchParams} />;
}
