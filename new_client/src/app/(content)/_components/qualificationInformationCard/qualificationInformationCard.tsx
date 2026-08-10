'use client';
import { Box, Flex, Text } from '@radix-ui/themes';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { Project } from '@/api/generated/models';
import parentStyles from '../styles.module.css';
import { ProjectInformationCard } from './projectInformationCard';

type Props = {
  // レイアウト選択用の変数
  isWide?: boolean;
  project: Project;
};

export default function QualificationInformationCard({ isWide, project }: Props) {
  const _isProject = project.type === 'project';
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
          <span className='material-icons' style={{ color: 'var(--app-orange-main)' }}>
            analytics
          </span>
          <Text size='4' weight='bold'>
            参加資格情報
          </Text>
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
            <ProjectInformationCard project={project} isWide={isWide} />
          </motion.div>
        )}
      </AnimatePresence>
    </Flex>
  );
}
