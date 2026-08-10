import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box } from '@radix-ui/themes';
import type { BidPipeline } from '@/api/generated/models';
import { PipelineCard } from '../pipelineCard/PipelineCard';
import styles from './styles.module.css';

type Props = {
  elm?: BidPipeline;
  onClick?: () => void;
  cursor?: string;
};

export default function DraggableCard({ elm, onClick, cursor }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: elm?.id ?? '',
  });

  if (!elm) {
    return null;
  }

  const adjustedTransform = transform ? { ...transform, scaleX: 1, scaleY: 1 } : transform;

  return (
    <Box
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(adjustedTransform),
        transition,
        cursor: cursor || 'grab',
        opacity: isDragging ? 0.4 : 1,
      }}
      onClick={() => {
        if (onClick) {
          onClick();
        }
      }}
      {...attributes}
      {...listeners}
      className={styles.draggableCard}
    >
      <PipelineCard pipeline={elm} />
    </Box>
  );
}
