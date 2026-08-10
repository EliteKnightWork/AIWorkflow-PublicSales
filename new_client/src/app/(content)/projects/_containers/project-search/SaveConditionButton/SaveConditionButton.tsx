import { useCallback } from 'react';
import { SAVE_CONDITION_BUTTON } from '@/constants';
import { useCta } from '@/context/CtaContext';
import styles from './SaveConditionButton.module.css';

export type SaveConditionButtonProps = {
  onClick?: () => void;
  className?: string;
  isSaved?: boolean;
  isLogin?: boolean;
};

export default function SaveConditionButton({
  onClick,
  className = '',
  isSaved = false,
  isLogin = false,
}: SaveConditionButtonProps) {
  const { openCta } = useCta();
  const handleClick = useCallback(() => {
    if (!isLogin) {
      openCta();
      return;
    }
    onClick?.();
  }, [isLogin, openCta, onClick]);
  return (
    <button
      type='button'
      id={SAVE_CONDITION_BUTTON}
      className={`${styles.saveConditionButton} ${className}`}
      onClick={handleClick}
      disabled={isSaved}
    >
      {isSaved ? (
        <>
          <span className={styles.text}>条件を保存済み</span>
          <span className={`material-icons ${styles.icon}`}>check</span>
        </>
      ) : (
        <span className={styles.text}>条件を保存する</span>
      )}
    </button>
  );
}
