'use client';
import { Box, Flex } from '@radix-ui/themes';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { BidCompanySearchResult, Pagination } from '@/api/generated/models';
import PagenatesPer from '@/components/pagenatesPer/PagenatesPer';
import AppPagination from '@/components/pagination/AppPagination';
import { BidCompanyCard } from '../../_components/bidCompanyCard';
import { useBidCompanyList } from '../../_context/bidConpanyListContext';
import styles from './styles.module.css';

type Props = {
  bidCompanies: BidCompanySearchResult[];
  pagination: Pagination;
};

export const BidCompanyList = ({ bidCompanies, pagination }: Props) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [targetPage, setTargetPage] = useState(1);
  const [perPage, setPerPage] = useState(pagination.limit || 25);
  const [targetBidCompanies, setTargetBidCompanies] = useState<BidCompanySearchResult[]>([]);
  const { setLoading } = useBidCompanyList();

  useEffect(() => {
    setTargetBidCompanies(bidCompanies);
    setLoading(false);
  }, [bidCompanies]);

  const onPageChanged = (page: number, per: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    params.set('perPage', per.toString());
    router.push(`/bidCompanies?${params.toString()}`);
  };

  const saveCookiePerPage = async (per: number) => {
    await cookieStore.set({
      name: 'bidCompaniesPerPage',
      value: String(per),
      path: '/',
      expires: Date.now() + 31536000000,
    });
  };

  return (
    <Flex className={styles.bidCompanyListBox} direction={'column'} justify={'center'}>
      <Box className={styles.pagenatesPerBox}>
        <PagenatesPer
          currentPer={perPage}
          onChangePer={(per) => {
            saveCookiePerPage(per);
            setLoading(true);
            setPerPage(per);
            setTargetPage(1);
            onPageChanged(1, per);
          }}
        />
      </Box>
      <Box className={styles.bidCompanyCardsBox}>
        {targetBidCompanies.map((o) => {
          return <BidCompanyCard key={o.name} bidCompany={o} />;
        })}
        {targetBidCompanies.length === 0 && (
          <Box className={styles.noBidCompanyBox}>
            <p>該当する落札企業が見つかりませんでした。検索条件を変更して再度お試しください。</p>
          </Box>
        )}
      </Box>
      <Box className={styles.paginationBox}>
        <AppPagination
          currentPage={Math.max(Math.min(targetPage, pagination.pages ?? 1), 1)}
          minPage={Math.max(1, targetPage - 2)}
          maxPage={Math.min(pagination.pages ?? targetPage, targetPage + 2)}
          onSelectPage={(page) => {
            setLoading(true);
            setTargetPage(page);
            onPageChanged(page, perPage);
          }}
        />
      </Box>
    </Flex>
  );
};
