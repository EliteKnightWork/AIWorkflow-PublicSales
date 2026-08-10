'use client';
import { Flex, Text } from '@radix-ui/themes';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { BidPipeline, BidPipelineStatus, User } from '@/api/generated/models';
import { ManagementTable } from '../../_components/managementTable/ManagementTable';
import pageStyles from '../../styles.module.css';
import styles from './styles.module.css';

type Props = {
  statusList: BidPipelineStatus[];
  pipelines: BidPipeline[];
  users: User[];
  currentUserId?: number;
};

export default function PipelineManagementListPresentational({
  statusList,
  pipelines,
  users,
  currentUserId,
}: Props) {
  const [isExpand, setIsExpand] = useState(true);
  const router = useRouter();

  return (
    <Flex direction='column' className={pageStyles.mypageContentBoard}>
      <Flex
        direction='row'
        justify='between'
        align='center'
        className={pageStyles.mypageContentHeader}
        onClick={() => setIsExpand(!isExpand)}
      >
        <Text size='3' weight='bold'>
          案件管理 - 案件リスト
        </Text>
        <Flex align={'center'}>
          <span className={`material-icons ${pageStyles.mypageExpandIcon}`}>
            {isExpand ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
          </span>
        </Flex>
      </Flex>

      <AnimatePresence>
        {isExpand && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <Flex direction='column' className={styles.tableContainer}>
              <ManagementTable
                statuses={statusList}
                pipelines={pipelines}
                users={users}
                currentUserId={currentUserId}
                router={router}
              />
            </Flex>
          </motion.div>
        )}
      </AnimatePresence>
    </Flex>
  );
}
