import { Badge } from '@radix-ui/themes';
import styles from './styles.module.css';

type Props = {
  size?: 'small' | 'large';
};

export const NewArraivalTag = ({ size }: Props) => {
  return (
    <Badge
      className={`${styles.newArraivalTag} ${size === 'small' ? styles.newArraivalSmallTag : styles.newArraivalLargeTag}`}
    >
      新着
    </Badge>
  );
};
