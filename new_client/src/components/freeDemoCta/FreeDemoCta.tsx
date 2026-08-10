'use client';

import { Flex, Text } from '@radix-ui/themes';
import { usePathname } from 'next/navigation';
import type { FC } from 'react';
import { SMARTPHONE_WIDTH } from '@/constants';
import styles from './styles.module.css';

interface FreeDemoCtaProps {
  onClose?: () => void;
  isDialog?: boolean;
}

export const FreeDemoCta: FC<FreeDemoCtaProps> = ({ onClose, isDialog = false }) => {
  const pathName = usePathname();

  const handleDemoClick = () => {
    if (pathName.includes('limited')) {
      window.open(
        `${process.env.NEXT_PUBLIC_CLIENT_BASE_URL}?utm_content=limited_demo_cta`,
        '_blank'
      );
    } else {
      window.open(`${process.env.NEXT_PUBLIC_CLIENT_BASE_URL}?utm_content=demo_cta`, '_blank');
    }
  };

  return (
    <div className={`${styles.container} ${isDialog ? styles.dialogContainer : ''}`}>
      <Flex
        direction='column'
        className={
          typeof window !== 'undefined' && window.innerWidth <= SMARTPHONE_WIDTH
            ? styles.limitedBoxSp
            : styles.limitedBox
        }
        gap='24px'
      >
        {isDialog && (
          <button className={styles.closeButton} onClick={onClose} type='button'>
            <span className='material-icons'>close</span>
          </button>
        )}
        <Flex direction='column' className={styles.limitedBoxHeader}>
          <Text>閲覧・検索には上限があります</Text>
          <Text>
            <span className={styles.emphasisColor}>無料デモ体験</span>で詳細をご案内します
          </Text>
        </Flex>
        <Flex
          direction='column'
          gap='16px'
          align='start'
          justify='center'
          className={styles.limitedBoxDescription}
        >
          <Flex direction='row' justify='center' align='center' gap='2'>
            <span className={`material-icons ${styles.limitedBoxIcon}`}>note</span>
            <Text align={'left'}>案件管理・提案書作成機能</Text>
          </Flex>
          <Flex direction='row' justify='center' align='center' gap='2'>
            <span className={`material-icons ${styles.limitedBoxIcon}`}>laptop_chromebook</span>
            <Text align={'left'}>操作方法や貴社に合った活用方法のデモの実施</Text>
          </Flex>
          <Flex direction='row' justify='center' align='center' gap='2'>
            <span className={`material-icons ${styles.limitedBoxIcon}`}>currency_yen</span>
            <Text align={'left'}>料金プラン</Text>
          </Flex>
        </Flex>
        <Flex direction='column' className={styles.limitedBoxWarning}>
          <Text>※トライアルご希望の場合でも一度お時間を頂戴しております</Text>
        </Flex>
        <Flex direction='column' className={styles.limitedButtonArea}>
          <button className={styles.demoButton} onClick={handleDemoClick} type='button'>
            いますぐ無料デモ体験に申し込む
          </button>
        </Flex>
      </Flex>
    </div>
  );
};
