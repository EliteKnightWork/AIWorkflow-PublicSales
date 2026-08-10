import { useUser } from '@auth0/nextjs-auth0';
import { Box } from '@radix-ui/themes';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import type { Project } from '@/api/generated/models';
import ProjectDetailInfo from '../../../_components/projectDetailInfo/ProjectDetailInfo';
import styles from './styles.module.css';

type Props = {
  project: Project | null;
  onOpen?: () => void;
  onClose: () => void;
  onProjectUpdate?: (project: Project) => void;
};

export default function ProjectSideBar({ project, onOpen, onClose, onProjectUpdate }: Props) {
  const modalRef = useRef<HTMLInputElement>(null);

  const { user } = useUser();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('#ctaDialog') &&
        !(event.target as HTMLElement).closest('[role="menu"]')
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <AnimatePresence mode='wait'>
      <Box className={styles.ProjectSideBar}>
        {project !== null && (
          <motion.div
            className={styles.modal}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 100, stiffness: 600 }}
            layout
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
          >
            <ProjectDetailInfo
              project={project}
              isLogin={!!user}
              isAbbreviated={true}
              onOpen={onOpen}
              onClose={onClose}
              position='search_result'
              onProjectUpdate={onProjectUpdate}
            />
          </motion.div>
        )}
      </Box>
    </AnimatePresence>
  );
}
