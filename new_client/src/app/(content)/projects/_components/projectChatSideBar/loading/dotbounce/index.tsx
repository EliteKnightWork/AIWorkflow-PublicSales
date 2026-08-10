import type { CSSProperties } from 'react';
import styles from './styles.module.css';

const DEFAULT_COLORS = [
  'linear-gradient(255deg, #EEB44E 0%, #E95F33 100%)',
  'linear-gradient(296deg, #49BCEE 0%, #394BEB 100%)',
  'linear-gradient(296deg, #49FA86 0%, #34B761 100%)',
] as const;
const DOT_POSITIONS = ['first', 'second', 'third'] as const;

export type DotBounceProps = {
  /**
   * Optional className to append to the root element.
   */
  className?: string;
  /**
   * Minimum size of each dot in pixels.
   */
  minSize?: number;
  /**
   * Maximum size of each dot in pixels.
   */
  maxSize?: number;
  /**
   * Shorthand to set both the minimum and maximum size.
   */
  size?: number;
  /**
   * Override the gap between dots in pixels.
   */
  gap?: number;
  /**
   * Colors applied to the three dots. Defaults to the gradient set used in Labid.
   */
  colors?: readonly [string, string, string];
  /**
   * Adjust the stagger between dot animations in seconds.
   */
  delayStep?: number;
};

export function DotBounce({
  className,
  minSize,
  maxSize,
  size,
  gap = 8,
  colors = DEFAULT_COLORS,
  delayStep = 0.18,
}: DotBounceProps) {
  const resolvedMinSize = minSize ?? size ?? 8;
  const resolvedMaxSize = Math.max(maxSize ?? size ?? 12, resolvedMinSize);
  const containerClassName = className ? `${styles.container} ${className}` : styles.container;

  const containerStyle = {
    '--dot-min-size': `${resolvedMinSize}px`,
    '--dot-max-size': `${resolvedMaxSize}px`,
    '--dot-gap': `${gap}px`,
    '--dot-delay-step': `${delayStep}s`,
    '--dot-scale-factor': `${resolvedMaxSize / resolvedMinSize}`,
  } as CSSProperties;

  return (
    <div className={containerClassName} style={containerStyle} aria-live='polite' aria-busy>
      {DOT_POSITIONS.map((position, index) => (
        <span
          key={position}
          className={styles.dot}
          style={{ background: colors[index] } as CSSProperties}
          aria-hidden
        />
      ))}
    </div>
  );
}

export default DotBounce;
