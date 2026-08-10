'use client';
import { Box, Flex, Heading } from '@radix-ui/themes';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { BidPipeline, Project, User } from '@/api/generated/models';
import parentStyles from '../styles.module.css';
import { AwardedProjectInformationCard } from './awardedProjectInformationCard';
import { ProjectInformationCard } from './projectInformationCard';

type Props = {
  // レイアウト選択用の変数
  isWide?: boolean;
  project: Project;
  pipelineBoardData?: {
    list: Array<{
      id: string;
      pipelines: BidPipeline[];
    }>;
  };
  onUpdatePipeline?: (pipeline: BidPipeline) => void;
  assignedUsers?: User[];
};

export default function BasicInformationCard({
  isWide,
  project,
  pipelineBoardData,
  onUpdatePipeline,
  assignedUsers,
}: Props) {
  const [isExpand, setIsExpand] = useState(true);
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    setIsFirstRender(false);
  }, []);

  return (
    <Flex direction='column'>
      <Flex
        direction='row'
        justify='between'
        align='center'
        className={`${parentStyles.title} ${!isExpand && parentStyles.titleNotExpand}`}
        onClick={() => setIsExpand(!isExpand)}
      >
        <Flex direction='row' justify='center' gap='2'>
          <span
            className='material-icons'
            translate='no'
            aria-hidden='true'
            style={{ color: 'var(--app-orange-main)' }}
          >
            analytics
          </span>
          <Heading as='h2' size='4' weight='bold'>
            基本情報
          </Heading>
        </Flex>
        <Box className={parentStyles.expandIcon}>
          <span className='material-symbols-outlined'>
            {isExpand ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
          </span>
        </Box>
      </Flex>

      <AnimatePresence>
        {isExpand && (
          <motion.div
            initial={isFirstRender ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            {project.type === 'project' && (
              <ProjectInformationCard
                project={project}
                isWide={isWide}
                pipelineBoardData={pipelineBoardData}
                onUpdatePipeline={onUpdatePipeline}
                assignedUsers={assignedUsers}
              />
            )}

            {project.type !== 'project' && (
              <AwardedProjectInformationCard project={project} isWide={isWide} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Flex>
  );
}
