import type { CSSProperties } from 'react';
import styles from './neuralButtonGroup.module.css';

const SparkleIcon = () => (
  <svg
    width='14'
    height='14'
    viewBox='0 0 14 14'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    aria-hidden='true'
  >
    <g filter='url(#sparkleFilter)'>
      <circle cx='7' cy='6' r='2' fill='white' />
    </g>
    <defs>
      <filter
        id='sparkleFilter'
        x='0'
        y='0'
        width='14'
        height='14'
        filterUnits='userSpaceOnUse'
        colorInterpolationFilters='sRGB'
      >
        <feFlood floodOpacity='0' result='BackgroundImageFix' />
        <feColorMatrix
          in='SourceAlpha'
          type='matrix'
          values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0'
          result='hardAlpha'
        />
        <feOffset dy='1' />
        <feGaussianBlur stdDeviation='2.5' />
        <feComposite in2='hardAlpha' operator='out' />
        <feColorMatrix type='matrix' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0' />
        <feBlend mode='normal' in2='BackgroundImageFix' result='effect1_dropShadow' />
        <feBlend mode='normal' in='SourceGraphic' in2='effect1_dropShadow' result='shape' />
      </filter>
    </defs>
  </svg>
);

/**
 * NeuralButtonGroupコンポーネントのプロパティ定義
 */
export type NeuralButtonGroupProps = {
  /**
   * ボタンがクリックされたときのコールバック関数
   */
  onClick?: () => void;
  /**
   * ボタンのサイズ（デフォルト: 100px）
   */
  size?: number;
  /**
   * アニメーションの有効/無効（デフォルト: true）
   */
  animated?: boolean;
  /**
   * ボタンの無効化状態（デフォルト: false）
   */
  disabled?: boolean;
  /**
   * 追加のCSSクラス名
   */
  className?: string;
  /**
   * アクセシビリティ用のラベル
   */
  ariaLabel?: string;
  /**
   * ボタンのタイトル属性
   */
  title?: string;
  /**
   * ProjectChatが開いた状態かどうか（デフォルト: false）
   */
  isOpen?: boolean;
};

/**
 * NeuralButtonGroup - パルス効果付きのアニメーションボタンコンポーネント
 *
 * Figmaデザインに基づいて実装された、複数の円形レイヤーが重なって
 * パルス効果を生み出すアニメーション付きボタンです。
 *
 * @param props - NeuralButtonGroupProps
 * @returns JSX.Element
 */
export function NeuralButtonGroup({
  onClick,
  size = 80,
  animated = true,
  disabled = false,
  className,
  ariaLabel = 'チャットボタン',
  title = 'チャットを開始',
  isOpen = false,
}: NeuralButtonGroupProps) {
  // ボタンのスタイルを動的に計算
  const buttonStyle = {
    '--button-size': `${size}px`,
    '--animation-enabled': animated ? '1' : '0',
  } as CSSProperties;

  // クラス名を組み立て
  const containerClassName = [
    styles.container,
    animated ? styles.animated : styles.static,
    disabled ? styles.disabled : '',
    isOpen ? styles.open : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type='button'
      className={containerClassName}
      style={buttonStyle}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
      aria-pressed='false'
    >
      {!isOpen && (
        <>
          {/* 外側のパルスレイヤー（赤） */}
          <div className={styles.pulseLayer} data-layer='outer-red'>
            <div className={styles.pulseRing} />
          </div>

          {/* 第2パルスレイヤー（緑） */}
          <div className={styles.pulseLayer} data-layer='second-green'>
            <div className={styles.pulseRing} />
          </div>

          {/* 第3パルスレイヤー（青） */}
          <div className={styles.pulseLayer} data-layer='third-blue'>
            <div className={styles.pulseRing} />
          </div>

          <span className={`${styles.sparkle} ${styles.sparkleTopLeft}`} aria-hidden='true'>
            <SparkleIcon />
          </span>
          <span className={`${styles.sparkle} ${styles.sparkleBottomRight}`} aria-hidden='true'>
            <SparkleIcon />
          </span>
        </>
      )}

      {/* 中央のメインボタン */}
      {isOpen ? (
        <div className={styles.mainButton}>
          <div className={styles.iconContainer}>
            <div className={styles.chatIcon}>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='32'
                height='32'
                viewBox='0 0 32 32'
                fill='none'
                aria-hidden='true'
              >
                <path
                  fillRule='evenodd'
                  clipRule='evenodd'
                  d='M14.0949 9.24097C14.6624 9.04453 14.6624 8.69531 14.0949 8.47705L11.0175 7.29844C10.4718 7.102 9.83888 6.46903 9.62063 5.90155L8.44203 2.82406C8.24559 2.25656 7.89638 2.25656 7.67811 2.82406L6.49951 5.90155C6.30309 6.4472 5.67014 7.08017 5.10267 7.29844L2.02522 8.47705C1.45774 8.67349 1.45774 9.0227 2.02522 9.24097L5.10267 10.4196C5.64832 10.616 6.28126 11.249 6.49951 11.8165L7.67811 14.894C7.87455 15.4614 8.22376 15.4614 8.44203 14.894L9.62063 11.8165C9.81705 11.2708 10.45 10.6378 11.0175 10.4196L14.0949 9.24097ZM29.09 20.0234C30.8361 19.5868 30.8361 18.8665 29.09 18.43L25.227 17.4696C23.4808 17.0331 21.6911 15.2433 21.2546 13.4972L20.2943 9.63399C19.8577 7.8879 19.1375 7.8879 18.701 9.63399L17.7406 13.4972C17.3041 15.2433 15.5144 17.0331 13.7683 17.4696L9.90513 18.43C8.15908 18.8665 8.15908 19.5868 9.90513 20.0234L13.7683 20.9836C15.5144 21.4202 17.3041 23.2099 17.7406 24.956L18.701 28.8192C19.1375 30.5654 19.8577 30.5654 20.2943 28.8192L21.2546 24.956C21.6911 23.2099 23.4808 21.4202 25.227 20.9836L29.09 20.0234Z'
                  fill='url(#paint0_linear_10945_61842)'
                />
                <defs>
                  <linearGradient
                    id='paint0_linear_10945_61842'
                    x1='30.3996'
                    y1='30.1288'
                    x2='-3.75233'
                    y2='13.1872'
                    gradientUnits='userSpaceOnUse'
                  >
                    <stop stopColor='#49BCEE' />
                    <stop offset='1' stopColor='#394BEB' />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.mainButton}>
          <div className={styles.iconContainer}>
            <div className={styles.chatIcon}>
              <svg
                width='32'
                height='32'
                viewBox='0 0 32 32'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
                aria-hidden='true'
              >
                <path
                  fillRule='evenodd'
                  clipRule='evenodd'
                  d='M14.0949 9.24097C14.6624 9.04453 14.6624 8.69531 14.0949 8.47705L11.0175 7.29844C10.4718 7.102 9.83888 6.46903 9.62063 5.90155L8.44203 2.82406C8.24559 2.25656 7.89638 2.25656 7.67811 2.82406L6.49951 5.90155C6.30309 6.4472 5.67014 7.08017 5.10267 7.29844L2.02522 8.47705C1.45774 8.67349 1.45774 9.0227 2.02522 9.24097L5.10267 10.4196C5.64832 10.616 6.28126 11.249 6.49951 11.8165L7.67811 14.894C7.87455 15.4614 8.22376 15.4614 8.44203 14.894L9.62063 11.8165C9.81705 11.2708 10.45 10.6378 11.0175 10.4196L14.0949 9.24097ZM29.09 20.0234C30.8361 19.5868 30.8361 18.8665 29.09 18.43L25.227 17.4696C23.4808 17.0331 21.6911 15.2433 21.2546 13.4972L20.2943 9.63399C19.8577 7.8879 19.1375 7.8879 18.701 9.63399L17.7406 13.4972C17.3041 15.2433 15.5144 17.0331 13.7683 17.4696L9.90513 18.43C8.15908 18.8665 8.15908 19.5868 9.90513 20.0234L13.7683 20.9836C15.5144 21.4202 17.3041 23.2099 17.7406 24.956L18.701 28.8192C19.1375 30.5654 19.8577 30.5654 20.2943 28.8192L21.2546 24.956C21.6911 23.2099 23.4808 21.4202 25.227 20.9836L29.09 20.0234Z'
                  fill='#FEFEFE'
                />
              </svg>
            </div>
          </div>
        </div>
      )}
    </button>
  );
}

export default NeuralButtonGroup;
