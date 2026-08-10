'use client';
import { Box, Flex, Text } from '@radix-ui/themes';
import type { Project } from '@/api/generated/models';
import { BidIcon } from '@/components/projectIcon/BidIcon';
import { formatPrice } from '@/utils/priceUtils';
import IconBadge from '../../stateBadge/IconBadge';
import styles from './styles.module.css';

type ProjectCardProps = {
  project: Project;
  onClickCard: (project: Project) => void;
};

export default function SimilarAwardedProjectCardSp({ project, onClickCard }: ProjectCardProps) {
  return (
    <Box
      className={`${styles.projectCard} ${styles.noShadow} ${styles.noPadding}`}
      onClick={() => onClickCard(project)}
    >
      <Flex direction='row' gap='3' align='center'>
        <BidIcon className={styles.projectCardIcon} />
        <Flex direction='column' gap='2'>
          <Text className={styles.projectTitle} weight='bold'>
            {project.title}
          </Text>
        </Flex>
      </Flex>
      <Flex direction='row' className={styles.projectInfo} gap='4'>
        <IconBadge
          text={project.organizationName ?? ''}
          icon_name='account_balance'
          active={!!project.organizationName}
          icon_color={'var(--app-green-main)'}
          font_size={'16px'}
        />
        <IconBadge
          text={project.prefectures?.join(',') ?? ''}
          icon_name='location_on'
          active={!!project.prefectures && project.prefectures?.length > 0}
          icon_color={'var(--app-blue-light)'}
          font_size={'16px'}
        />
        {project.awardedProject?.successfulBidders?.map((b) => (
          <IconBadge
            key={crypto.randomUUID()}
            text={b.bidCompany?.name ?? ''}
            icon_name='rule'
            active={!!b.bidCompany?.name}
            icon_color={'var(--app-purple-main)'}
            font_size={'16px'}
          />
        ))}
        <IconBadge
          text={
            project.awardedProject?.successfulBidPrice
              ? formatPrice(project.awardedProject.successfulBidPrice)
              : ''
          }
          icon_name='currency_yen'
          active={!!project.awardedProject?.successfulBidPrice}
          icon_color={'var(--app-yellow-light)'}
          font_size={'16px'}
        />
        <IconBadge
          text={project.tenderOpeningDate ?? ''}
          icon_name='calendar_today'
          active={!!project.tenderOpeningDate}
          icon_color={'var(--app-strong)'}
          font_size={'16px'}
        />
      </Flex>
    </Box>
  );
}
