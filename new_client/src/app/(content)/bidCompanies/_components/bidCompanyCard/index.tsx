import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import type { BidCompanySearchResult } from '@/api/generated/models';
import { BidIcon } from '@/components/projectIcon/BidIcon';
import { CloseIcon } from '@/components/projectIcon/CloseIcon';
import { ProjectTabType } from '../../types';
import styles from './styles.module.css';

type Props = {
  bidCompany: BidCompanySearchResult;
};

export const BidCompanyCard = ({ bidCompany }: Props) => {
  const router = useRouter();
  return (
    <Flex justify='between' align={'center'} className={styles.bidCompanyCardBox}>
      <Box className={styles.bidCompanyTitleBox}>
        <span
          className={`material-icons ${styles.bidCompanyIcon}`}
          translate='no'
          aria-hidden='true'
        >
          apartment
        </span>
        <Text className={styles.bidCompanyTitle}>{bidCompany.name}</Text>
      </Box>

      <Box className={styles.buttonBox}>
        <Button
          className={styles.bidCompanyButton}
          onClick={() => {
            const params = new URLSearchParams('');

            params.set('tab', ProjectTabType.AWARDED);
            params.set('onlySuccessfulBidders', 'true');
            params.set('bidCompanyName', bidCompany.name);
            router.push(`/projects?${params.toString()}`);
          }}
        >
          <BidIcon />
          {`落札案件(${bidCompany.successfulBidCount})を見る`}
        </Button>
        <Button
          className={styles.bidCompanyButton}
          onClick={() => {
            const params = new URLSearchParams('');

            params.set('tab', ProjectTabType.AWARDED);
            params.set('bidCompanyName', bidCompany.name);
            router.push(`/projects?${params.toString()}`);
          }}
        >
          <CloseIcon />
          {`参加案件(${bidCompany.bidCount})を見る`}
        </Button>
      </Box>
    </Flex>
  );
};
