'use client';

import { Box, Table as RadixTable } from '@radix-ui/themes';
import type { ComponentProps, ReactNode } from 'react';
import styles from './listTable.module.css';

export type ListTableItem = {
  /** ラベル（左側の列） */
  heading: string;
  /** 値（右側の列）。null の場合は emptyPlaceholder を表示 */
  content: ReactNode | null;
};

export type ListTableProps = Omit<ComponentProps<typeof RadixTable.Root>, 'children'> & {
  /** テーブルの行データ */
  items: ListTableItem[];
  /** 値が null の場合に表示するプレースホルダー */
  emptyPlaceholder?: string;
  /** ラベル列の幅 */
  headingColumnWidth?: string;
  /** 追加のクラス名 */
  className?: string;
};

/**
 * 2列のリスト形式テーブルコンポーネント
 */
export default function ListTable({
  items,
  emptyPlaceholder = '未設定',
  headingColumnWidth = '120px',
  className,
  ...props
}: ListTableProps) {
  return (
    <RadixTable.Root className={`${styles.tableRoot} ${className ?? ''}`} {...props}>
      <RadixTable.Body className={styles.tableBody}>
        {items.map((item, index) => (
          <RadixTable.Row key={`${item.heading}-${index}`} className={styles.tableRow}>
            <RadixTable.Cell className={styles.headingCell} style={{ width: headingColumnWidth }}>
              {item.heading}
            </RadixTable.Cell>
            <RadixTable.Cell className={styles.contentCell}>
              {item.content ? (
                <Box className={styles.content}>{item.content}</Box>
              ) : (
                <Box className={styles.emptyContent}>{emptyPlaceholder}</Box>
              )}
            </RadixTable.Cell>
          </RadixTable.Row>
        ))}
      </RadixTable.Body>
    </RadixTable.Root>
  );
}
