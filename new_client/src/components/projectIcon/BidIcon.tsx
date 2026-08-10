type OpenIconProps = {
  className?: string;
};
export function BidIcon({ className }: OpenIconProps) {
  return (
    <span
      className={`material-icons ${className}`}
      translate='no'
      aria-hidden='true'
      style={{ color: 'var(--icon-color-bid)' }}
    >
      handshake
    </span>
  );
}
