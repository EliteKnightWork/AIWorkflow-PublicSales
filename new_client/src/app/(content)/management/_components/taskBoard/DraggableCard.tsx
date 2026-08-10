import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box } from '@radix-ui/themes';
import type { BidPipelineTask } from '@/api/generated/models';
import { TaskCard } from '../taskCard/TaskCard';
import styles from './styles.module.css';

type Props = {
  elm?: BidPipelineTask;
  onClick?: () => void;
  cursor?: string;
};

export default function DraggableCard({ elm, onClick, cursor }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: elm?.id ?? '',
  });

  if (!elm) {
    return null;
  }

  return (
    <Box
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: cursor || 'grab',
      }}
      onClick={(e) => {
        // メニューやダイアログ関連の要素をクリックした場合はサイドバーを開かない
        const target = e.target as HTMLElement;
        if (
          target.closest('.menu-trigger') ||
          target.closest('.menu-content') ||
          target.closest('[role="dialog"]')
        ) {
          return;
        }
        if (onClick) {
          onClick();
        }
      }}
      {...attributes}
      {...listeners}
      className={styles.draggableCard}
    >
      <TaskCard task={elm} />
    </Box>
  );
}
