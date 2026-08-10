'use client';
import { Flex, Text } from '@radix-ui/themes';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type {
  BidPipeline,
  BidPipelineTask,
  BidPipelineTaskStatus,
  User,
} from '@/api/generated/models';
import { TaskTable } from '../../_components/taskTable/TaskTable';
import pageStyles from '../../styles.module.css';
import styles from './styles.module.css';

type Props = {
  statusList: BidPipelineTaskStatus[];
  tasks: BidPipelineTask[];
  users: User[];
  pipelines: BidPipeline[];
};

export default function TaskManagementListPresentational({
  statusList,
  tasks,
  users,
  pipelines,
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
          案件管理 - タスクリスト
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
              <TaskTable
                statuses={statusList}
                tasks={tasks}
                users={users}
                router={router}
                pipelines={pipelines}
              />
            </Flex>
          </motion.div>
        )}
      </AnimatePresence>
    </Flex>
  );
}
