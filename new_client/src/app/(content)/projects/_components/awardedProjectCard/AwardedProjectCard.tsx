'use client';
import { useUser } from '@auth0/nextjs-auth0';
import { Box, Flex, Heading } from '@radix-ui/themes';
import Link from 'next/link';
import { useState } from 'react';
import type { Project } from '@/api/generated/models';
import { BidIcon } from '@/components/projectIcon/BidIcon';
import { useBrowsedProject } from '@/hooks/useBrowsedProject';
import { formatPrice } from '@/utils/priceUtils';
import IconBadge from '../../../_components/stateBadge/IconBadge';
import { BrowsedTag } from '../browsedTag';
import styles from './styles.module.css';

type ProjectCardProps = {
  project: Project;
  onClickCard: (project: Project) => void;
  isSp?: boolean;
};

export default function AwardedProjectCard({ project, onClickCard, isSp }: ProjectCardProps) {
  const { user } = useUser();
  const [targetAwardedProject, setTargetAwardedProject] = useState<Project>(project);
  const { handleBrowseProject } = useBrowsedProject();

  const onClickProjectCard = (project: Project) => {
    if (!project.hasBrowsed && user) {
      handleBrowseProject(project.uuid);
      setTargetAwardedProject({ ...project, hasBrowsed: true });
    }

    onClickCard(project);
  };

  return (
    <Flex
      direction='column'
      gap='4'
      className={`${styles.projectCard} ${styles.noShadow} ${styles.noPadding} ${targetAwardedProject.hasBrowsed && styles.projectBrowsedCard}`}
      onClick={() => onClickProjectCard(targetAwardedProject)}
    >
      <Flex direction='column' gap='2' className=''>
        <Flex direction='column' gap='2'>
          {targetAwardedProject.hasBrowsed && (
            <Box>
              <BrowsedTag />
            </Box>
          )}
          <Flex direction='row' gap='4' align='center' justify='between' style={{ width: '100%' }}>
            <Flex direction='row' gap='4' align='center'>
              <BidIcon className={styles.projectCardIcon} />
              <Heading as='h2' size='5' weight='bold'>
                {targetAwardedProject.title}
              </Heading>
            </Flex>
            {!isSp && (
              <Link
                href={`/awardedProjects/${targetAwardedProject.uuid}`}
                onClick={(e) => e.stopPropagation()}
                className={styles.openButton}
              >
                <span className='material-icons' translate='no' aria-hidden='true'>
                  open_in_new
                </span>
              </Link>
            )}
          </Flex>
        </Flex>
        <Flex direction='row' className={styles.projectInfo} gap='2'>
          <IconBadge
            text={targetAwardedProject.organizationName ?? ''}
            icon_name='account_balance'
            active={!!targetAwardedProject.organizationName}
            icon_color={'var(--app-green-main)'}
            font_size={isSp ? '14px' : undefined}
            notLink
          />
          <IconBadge
            text={targetAwardedProject.prefectures?.join(',') ?? ''}
            icon_name='location_on'
            active={
              !!targetAwardedProject.prefectures && targetAwardedProject.prefectures?.length > 0
            }
            icon_color={'var(--app-blue-light)'}
            font_size={isSp ? '14px' : undefined}
            notLink
          />
          {targetAwardedProject.awardedProject?.successfulBidders?.map((b) => (
            <IconBadge
              key={crypto.randomUUID()}
              text={b.bidCompany?.name ?? ''}
              icon_name='apartment'
              active={!!b.bidCompany?.name}
              icon_color={'var(--text-color-tertiary)'}
              font_size={isSp ? '14px' : undefined}
              notLink
            />
          ))}
          <IconBadge
            text={
              targetAwardedProject.awardedProject?.successfulBidPrice
                ? formatPrice(targetAwardedProject.awardedProject.successfulBidPrice)
                : ''
            }
            icon_name='currency_yen'
            active={!!targetAwardedProject.awardedProject?.successfulBidPrice}
            icon_color={'var(--app-yellow-light)'}
            font_size={isSp ? '14px' : undefined}
            notLink
          />
          <IconBadge
            text={targetAwardedProject.tenderOpeningDate ?? ''}
            icon_name='calendar_today'
            active={!!targetAwardedProject.tenderOpeningDate}
            icon_color={'var(--app-strong)'}
            font_size={isSp ? '14px' : undefined}
            notLink
          />
        </Flex>
      </Flex>
    </Flex>
  );
}
