'use client';
import { Button, Text } from '@radix-ui/themes';
import styles from './styles.module.css';

type Props = {
  externalLink?: string;
};

export default function ExternalLinkButton(props: Props) {
  const onClickLink = (_event: React.MouseEvent<HTMLButtonElement>) => {
    if (!props.externalLink) {
      return;
    }
    window.open(props.externalLink, '_blank');
  };

  return (
    <Button
      className={styles.externalLinkButton}
      onClick={onClickLink}
      disabled={!props.externalLink}
    >
      <Text size='4' weight='bold'>
        掲載元に移動する
      </Text>
      <span className={`material-symbols-outlined ${styles.externalLinkIcon}`}>open_in_new</span>
    </Button>
  );
}
