import styles from './DetailSearchButton.module.css';

export type DetailSearchButtonProps = {
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
};

export default function DetailSearchButton({
  onClick,
  className = '',
  disabled = false,
}: DetailSearchButtonProps) {
  return (
    <button
      type='button'
      className={`${styles.detailSearchButton} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className={styles.text}>詳細な条件でさがす</span>
      <span className={`material-icons ${styles.icon}`} aria-hidden='true'>
        filter_alt
      </span>
    </button>
  );
}
