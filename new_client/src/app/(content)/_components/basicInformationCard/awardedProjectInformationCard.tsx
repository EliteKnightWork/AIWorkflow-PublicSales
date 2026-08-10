import { useUser } from '@auth0/nextjs-auth0';
import { Box, Flex, Grid, Heading, Link, Text } from '@radix-ui/themes';
import type { Project } from '@/api/generated/models';
import { getSearchProjectsQueryParams } from '@/lib/getSearchProjectsQueryParams';
import { formatPrice } from '@/utils/priceUtils';
import parentStyles from '../styles.module.css';
import styles from './styles.module.css';

type Props = {
  project: Project;
  isWide?: boolean;
};

export const AwardedProjectInformationCard = ({ project, isWide }: Props) => {
  const defaultValue = '-';
  const { user } = useUser();

  const searchUrl = (searchProps: { bidCompanyName?: string; onlySuccessfulBidders?: boolean }) => {
    const updateParams = {
      ...(searchProps.bidCompanyName && { bidCompanyName: searchProps.bidCompanyName }),
      ...(searchProps.onlySuccessfulBidders && {
        onlySuccessfulBidders: searchProps.onlySuccessfulBidders,
      }),
      page: 1,
    };

    const params = getSearchProjectsQueryParams(updateParams);
    return `/projects?${params}`;
  };

  if (isWide) {
    return (
      <Grid className={styles.body}>
        <Grid columns='4' rows='1' className={styles.grid}>
          <Flex
            direction='column'
            gap='1'
            className={`${parentStyles.item} ${parentStyles.topLeft}`}
          >
            <Heading
              className={
                project.awardedProject?.successfulBidders
                  ? parentStyles.itemTitle
                  : parentStyles.itemTitleDefault
              }
              as='h3'
              size='3'
            >
              落札企業
            </Heading>
            <Flex direction='row' gap='2' className={styles.bidderInfo}>
              {project.awardedProject?.successfulBidders?.map((b) => {
                if (b.bidCompany?.name) {
                  const bidCompanyUrl = user
                    ? searchUrl({ bidCompanyName: b.bidCompany.name, onlySuccessfulBidders: true })
                    : undefined;
                  return (
                    <Link href={bidCompanyUrl} key={b.id}>
                      <Box className={styles.bidder}>
                        <Text style={{ textDecoration: user ? 'underline' : 'none' }}>
                          {b.bidCompany.name}
                        </Text>
                      </Box>
                    </Link>
                  );
                }
              })}
            </Flex>
          </Flex>
          <Flex direction='column' gap='1' className={parentStyles.item}>
            <Heading
              className={
                project.awardedProject?.successfulBidPrice
                  ? parentStyles.itemTitle
                  : parentStyles.itemTitleDefault
              }
              as='h3'
              size='3'
            >
              落札金額
            </Heading>
            <Text>
              {project.awardedProject?.successfulBidPrice
                ? formatPrice(project.awardedProject.successfulBidPrice)
                : defaultValue}
            </Text>
          </Flex>
          <Flex direction='column' gap='1' className={parentStyles.item}>
            <Heading
              className={
                project.tenderOpeningDate ? parentStyles.itemTitle : parentStyles.itemTitleDefault
              }
              as='h3'
              size='3'
            >
              落札日
            </Heading>
            <Text>{project.tenderOpeningDate ? project.tenderOpeningDate : defaultValue}</Text>
          </Flex>
          <Flex
            direction='column'
            gap='1'
            className={`${parentStyles.item} ${parentStyles.topRight}`}
          >
            <Heading
              className={
                project.plannedPrice ? parentStyles.itemTitle : parentStyles.itemTitleDefault
              }
              as='h3'
              size='3'
            >
              予定価格
            </Heading>
            <Text>{project.plannedPrice ? formatPrice(project.plannedPrice) : defaultValue}</Text>
          </Flex>
        </Grid>
        <Grid columns='1' rows='1' className={styles.grid}>
          <Flex
            direction='column'
            gap='1'
            className={`${parentStyles.item} ${parentStyles.bottomLeft} ${parentStyles.bottomRight}`}
          >
            <Heading
              className={
                project.awardedProject?.bidders
                  ? parentStyles.itemTitle
                  : parentStyles.itemTitleDefault
              }
              as='h3'
              size='3'
            >
              参加企業
            </Heading>
            <Flex direction='row' gap='2' className={styles.bidderInfo}>
              {project.awardedProject?.bidders?.map((b) => {
                if (b.bidCompany?.name) {
                  const bidCompanyUrl = user
                    ? searchUrl({ bidCompanyName: b.bidCompany.name })
                    : undefined;
                  return (
                    <Link href={bidCompanyUrl} key={b.id}>
                      <Box className={styles.bidder}>
                        <Text style={{ textDecoration: user ? 'underline' : 'none' }}>
                          {b.bidCompany.name}
                        </Text>
                      </Box>
                    </Link>
                  );
                }
              })}
            </Flex>
          </Flex>
        </Grid>
      </Grid>
    );
  }

  return (
    // サイドバーレイアウト
    <Grid className={styles.body}>
      <Grid columns='2' rows='2' className={styles.grid}>
        <Flex direction='column' gap='1' className={`${parentStyles.item} ${parentStyles.topLeft}`}>
          <Heading
            className={
              project.awardedProject?.successfulBidders
                ? parentStyles.itemTitle
                : parentStyles.itemTitleDefault
            }
            as='h3'
            size='3'
          >
            落札企業
          </Heading>
          <Flex direction='row' gap='2' className={styles.bidderInfo}>
            {project.awardedProject?.successfulBidders?.map((b) => {
              if (b.bidCompany?.name) {
                const bidCompanyUrl = user
                  ? searchUrl({ bidCompanyName: b.bidCompany.name, onlySuccessfulBidders: true })
                  : undefined;
                return (
                  <Link href={bidCompanyUrl} key={b.id}>
                    <Box className={styles.bidder}>
                      <Text style={{ textDecoration: user ? 'underline' : 'none' }}>
                        {b.bidCompany.name}
                      </Text>
                    </Box>
                  </Link>
                );
              }
            })}
          </Flex>
        </Flex>
        <Flex
          direction='column'
          gap='1'
          className={`${parentStyles.item} ${parentStyles.topRight}`}
        >
          <Heading
            className={
              project.awardedProject?.successfulBidPrice
                ? parentStyles.itemTitle
                : parentStyles.itemTitleDefault
            }
            as='h3'
            size='3'
          >
            落札金額
          </Heading>
          <Text>
            {project.awardedProject?.successfulBidPrice
              ? formatPrice(project.awardedProject.successfulBidPrice)
              : defaultValue}
          </Text>
        </Flex>
        <Flex direction='column' gap='1' className={parentStyles.item}>
          <Heading
            className={
              project.tenderOpeningDate ? parentStyles.itemTitle : parentStyles.itemTitleDefault
            }
            as='h3'
            size='3'
          >
            落札日
          </Heading>
          <Text>{project.tenderOpeningDate ? project.tenderOpeningDate : defaultValue}</Text>
        </Flex>
        <Flex direction='column' gap='1' className={parentStyles.item}>
          <Heading
            className={
              project.plannedPrice ? parentStyles.itemTitle : parentStyles.itemTitleDefault
            }
            as='h3'
            size='3'
          >
            予定価格
          </Heading>
          <Text>{project.plannedPrice ? formatPrice(project.plannedPrice) : defaultValue}</Text>
        </Flex>
      </Grid>
      <Grid columns='1' rows='1' className={styles.grid}>
        <Flex
          direction='column'
          gap='1'
          className={`${parentStyles.item} ${parentStyles.bottomLeft} ${parentStyles.bottomRight}`}
        >
          <Heading
            className={
              project.awardedProject?.bidders
                ? parentStyles.itemTitle
                : parentStyles.itemTitleDefault
            }
            as='h3'
            size='3'
          >
            参加企業
          </Heading>
          <Flex direction='row' gap='2' className={styles.bidderInfo}>
            {project.awardedProject?.bidders?.map((b) => {
              if (b.bidCompany?.name) {
                const bidCompanyUrl = user
                  ? searchUrl({ bidCompanyName: b.bidCompany.name })
                  : undefined;
                return (
                  <Link href={bidCompanyUrl} key={b.id}>
                    <Box className={styles.bidder}>
                      <Text style={{ textDecoration: user ? 'underline' : 'none' }}>
                        {b.bidCompany.name}
                      </Text>
                    </Box>
                  </Link>
                );
              }
            })}
          </Flex>
        </Flex>
      </Grid>
    </Grid>
  );
};
