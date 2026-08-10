import { Badge } from '@radix-ui/themes';
import type { BidPipelineStatus } from '@/api/generated/models';
import { getPipelineStatusColors } from '@/app/(content)/management/types';
import styles from './styles.module.css';

type Props = {
  size?: 'small' | 'large';
  status: BidPipelineStatus;
};

export const BidPipelineStatusTag = ({ size, status }: Props) => {
  const colors = getPipelineStatusColors(status.stage);

  return (
    <Badge
      className={`${styles.statusTag} ${size === 'small' ? styles.statusSmallTag : styles.statusLargeTag}`}
      style={{
        color: colors.color,
        borderColor: colors.borderColor,
      }}
    >
      案件ステータス：{status.name}
    </Badge>
  );
};
