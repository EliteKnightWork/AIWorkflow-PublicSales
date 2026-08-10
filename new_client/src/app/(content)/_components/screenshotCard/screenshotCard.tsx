'use client';
import { Box, Flex, Heading } from '@radix-ui/themes';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { Screenshot } from '@/api/generated/models';
import parentStyles from '../styles.module.css';
import styles from './styles.module.css';

type Props = {
  title: string;
  screenshots: Screenshot[];
};

export default function ScreenshotCard(props: Props) {
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
            photo_library
          </span>
          <Heading as='h2' size='4' weight='bold'>
            スクリーンショット
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
            <Flex direction='column' className={styles.body}>
              <Flex wrap='wrap' display='flex' gap='2'>
                {props.screenshots.map((screenshot) => (
                  <Image
                    key={screenshot.url}
                    width={160}
                    height={160}
                    className={styles.screenshot}
                    src={screenshot.url}
                    alt={`${props.title}_screenshot`}
                    onClick={() => {
                      window.open(screenshot.url, '_blank');
                    }}
                    onKeyDown={() => {}}
                  />
                ))}
              </Flex>
            </Flex>
          </motion.div>
        )}
      </AnimatePresence>
    </Flex>
  );
}
