import type React from 'react';
import styles from './breathingAnimation.module.css';

type BreathingAnimationProps = {
  className?: string;
};

/**
 * Breathingアニメーションコンポーネント
 * 2つの丸が重なり合いながら軌道上を回転する背景アニメーション
 */
export const BreathingAnimation: React.FC<BreathingAnimationProps> = ({ className }) => {
  return (
    <div className={[styles.breathingContainer, className].filter(Boolean).join(' ')}>
      <div className={`${styles.breathingEllipse} ${styles.ellipse1}`} />
      <div className={`${styles.breathingEllipse} ${styles.ellipse2}`} />
    </div>
  );
};
