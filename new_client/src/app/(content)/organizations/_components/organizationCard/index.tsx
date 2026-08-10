import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import type { OrganizationSearchResult } from '@/api/generated/models';
import { BidIcon } from '@/components/projectIcon/BidIcon';
import { OpenIcon } from '@/components/projectIcon/OpenIcon';
import { ProjectTabType } from '../../types';
import styles from './styles.module.css';

type Props = {
  organization: OrganizationSearchResult;
};

export const OrganizationCard = ({ organization }: Props) => {
  const router = useRouter();
  return (
    <Flex justify='between' align={'center'} className={styles.organizationCardBox}>
      <Box className={styles.organizationTitleBox}>
        <span
          className={`material-icons ${styles.organizationIcon}`}
          translate='no'
          aria-hidden='true'
        >
          account_balance
        </span>
        <Text className={styles.organizationTitle}>{organization.name}</Text>
      </Box>

      <Box className={styles.buttonBox}>
        <Button
          className={styles.organizationButton}
          onClick={() => {
            const params = new URLSearchParams('');

            params.set('tab', ProjectTabType.OPEN);
            params.set('organizationNameArray', organization.name);
            router.push(`/projects?${params.toString()}`);
          }}
        >
          <OpenIcon />
          {`受付中の案件(${organization.openProjectsCount})を見る`}
        </Button>
        <Button
          className={styles.organizationButton}
          onClick={() => {
            const params = new URLSearchParams('');

            params.set('tab', ProjectTabType.AWARDED);
            params.set('organizationNameArray', organization.name);
            router.push(`/projects?${params.toString()}`);
          }}
        >
          <BidIcon />
          {`落札結果(${organization.biddedProjectsCount})を見る`}
        </Button>
      </Box>
    </Flex>
  );
};
