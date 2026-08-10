'use client';
import { useUser } from '@auth0/nextjs-auth0';
import { Button, Flex, IconButton } from '@radix-ui/themes';
import { useState } from 'react';
import { useCta } from '@/context/CtaContext';
import styles from './styles.module.css';

type Props = {
  currentPage: number;
  minPage: number;
  maxPage: number;
  onSelectPage: (page: number) => void;
};

export default function AppPagination({ currentPage, minPage, maxPage, onSelectPage }: Props) {
  const [activePage, setActivePage] = useState(currentPage);
  const { user } = useUser();
  const { openCta } = useCta();

  return (
    <Flex direction={'row'} gap={'2'}>
      <IconButton
        variant='outline'
        onClick={() => {
          // 非ログインユーザーの場合はCTAを表示
          if (!user) {
            openCta();
            return;
          }
          setActivePage(activePage - 1);
          onSelectPage(activePage - 1);
        }}
        disabled={activePage <= minPage || maxPage < minPage}
        className={styles.paginationButton}
      >
        <span className='material-symbols-outlined' translate='no' aria-hidden='true'>
          chevron_left
        </span>
      </IconButton>

      {Array.from({ length: maxPage - minPage + 1 }, (_, i) => i + minPage).map((page) => (
        <Button
          key={page}
          variant={activePage === page ? 'solid' : 'outline'}
          onClick={() => {
            // 非ログインユーザーの場合はCTAを表示
            if (!user) {
              openCta();
              return;
            }
            setActivePage(page);
            onSelectPage(page);
          }}
          className={`${styles.paginationButton} ${activePage === page ? styles.activePaginationButton : ''}`}
        >
          {page}
        </Button>
      ))}

      <IconButton
        variant='outline'
        onClick={() => {
          // 非ログインユーザーの場合はCTAを表示
          if (!user) {
            openCta();
            return;
          }
          setActivePage(activePage + 1);
          onSelectPage(activePage + 1);
        }}
        disabled={activePage >= maxPage || maxPage < minPage}
        className={styles.paginationButton}
      >
        <span className='material-symbols-outlined' translate='no' aria-hidden='true'>
          chevron_right
        </span>
      </IconButton>
    </Flex>
  );
}
