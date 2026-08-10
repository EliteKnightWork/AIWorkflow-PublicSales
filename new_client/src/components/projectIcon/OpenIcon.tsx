type OpenIconProps = {
  className?: string;
};
export function OpenIcon({ className }: OpenIconProps) {
  return (
    <span
      className={`material-icons ${className}`}
      translate='no'
      aria-hidden='true'
      style={{ color: 'var(--icon-color-open)' }}
    >
      waving_hand
    </span>
  );
}
