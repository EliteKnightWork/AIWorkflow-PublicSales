'use client';
import type { ButtonProps } from '@radix-ui/themes';
import { Button, Text } from '@radix-ui/themes';
import styles from './styles.module.css';

interface FilterClearButtonProps extends Omit<ButtonProps, 'variant' | 'className'> {
  /**
   * ボタンクリック時の処理
   */
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * ボタンの無効化状態
   */
  disabled?: boolean;
}

/**
 * フィルタクリアボタンの共通コンポーネント
 * 案件一覧画面のスタイルに統一
 */
export default function FilterClearButton({ onClick, disabled, ...props }: FilterClearButtonProps) {
  return (
    <Button
      variant='ghost'
      className={styles.filterClearButton}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      <Text>フィルタクリア</Text>
    </Button>
  );
}
