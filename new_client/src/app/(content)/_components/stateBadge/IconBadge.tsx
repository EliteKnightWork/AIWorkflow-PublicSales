import { Badge, Heading, Link } from '@radix-ui/themes';
import styles from './styles.module.css';

export default function IconBadge({
  text,
  icon_name,
  active,
  icon_color,
  font_size,
  icon_size,
  text_color,
  bg_color,
  badge_className,
  text_as,
  href,
  onClick, // hrefよりも優先される
  notLink,
}: {
  text: string;
  icon_name: string;
  active: boolean;
  icon_color?: string;
  font_size?: string;
  icon_size?: string;
  text_color?: string;
  bg_color?: string;
  badge_className?: string;
  text_as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | undefined;
  href?: string | undefined;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  notLink?: boolean;
}) {
  const badgeContent = (
    <Badge
      className={`${styles.stateBadge} ${active ? '' : styles.inactiveStateBadge} ${badge_className}`}
      style={{
        backgroundColor: bg_color ?? 'var(--bg-color-secondary)',
      }}
    >
      {icon_name && (
        <span
          className='material-icons'
          translate='no'
          aria-hidden='true'
          style={{ fontSize: icon_size ?? font_size ?? '16px', color: icon_color }}
        >
          {icon_name}
        </span>
      )}
      <Heading
        as={text_as ?? 'h2'}
        style={{
          fontSize: font_size ?? '16px',
          fontWeight: 500,
          color: text_color ?? 'var(--text-color-tertiary)',
          textDecoration: href ? 'underline' : 'none',
          lineHeight: 1,
        }}
      >
        {text}
      </Heading>
    </Badge>
  );

  if (notLink) {
    return badgeContent;
  }
  return (
    <Link
      href={onClick ? undefined : href}
      onClick={onClick}
      style={{ cursor: href || onClick ? 'pointer' : 'default' }}
    >
      {badgeContent}
    </Link>
  );
}
