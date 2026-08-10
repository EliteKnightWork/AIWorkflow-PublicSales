type OpenIconProps = {
  className?: string;
};
export function CloseIcon({ className }: OpenIconProps) {
  return (
    <span
      className={`material-icons ${className}`}
      translate='no'
      aria-hidden='true'
      style={{ color: 'var(--icon-color-close)' }}
    >
      do_not_touch
    </span>
  );
}
