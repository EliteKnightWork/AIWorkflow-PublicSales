'use client';
import { Box, Flex } from '@radix-ui/themes';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { OrganizationSearchResult, Pagination } from '@/api/generated/models';
import PagenatesPer from '@/components/pagenatesPer/PagenatesPer';
import AppPagination from '@/components/pagination/AppPagination';
import { OrganizationCard } from '../../_components/organizationCard';
import { useOrganizationList } from '../../_context/organizationListContext';
import styles from './styles.module.css';

type Props = {
  organizations: OrganizationSearchResult[];
  pagination: Pagination;
};

export const OrganizationList = ({ organizations, pagination }: Props) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [targetPage, setTargetPage] = useState(1);
  const [perPage, setPerPage] = useState(pagination.limit || 25);
  const [targetOrganizations, setTargetOrganizations] = useState<OrganizationSearchResult[]>([]);
  const { setLoading } = useOrganizationList();

  useEffect(() => {
    setTargetOrganizations(organizations);
    setLoading(false);
  }, [organizations]);

  const onPageChanged = (page: number, per: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    params.set('perPage', per.toString());
    router.push(`/organizations?${params.toString()}`);
  };

  const saveCookiePerPage = async (per: number) => {
    await cookieStore.set({
      name: 'organizationsPerPage',
      value: String(per),
      path: '/',
      expires: Date.now() + 31536000000,
    });
  };

  return (
    <Flex className={styles.organizationListBox} direction={'column'} justify={'center'}>
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
      <Box className={styles.organizationCardsBox}>
        {targetOrganizations.map((o) => {
          return <OrganizationCard key={o.name} organization={o} />;
        })}
        {targetOrganizations.length === 0 && (
          <Box className={styles.noOrganizationBox}>
            <p>該当する発注機関が見つかりませんでした。検索条件を変更して再度お試しください。</p>
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
