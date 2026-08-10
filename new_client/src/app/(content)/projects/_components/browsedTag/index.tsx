import { Badge } from '@radix-ui/themes';
import styles from './styles.module.css';

type Props = {
  size?: 'small' | 'large';
};

export const BrowsedTag = ({ size }: Props) => {
  return (
    <Badge
      className={`${styles.browsedTag} ${size === 'small' ? styles.browsedSmallTag : styles.browsedLargeTag}`}
    >
      閲覧済み
    </Badge>
  );
};
