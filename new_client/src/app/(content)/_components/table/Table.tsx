'use client';
import { Box, Table as RadixTable } from '@radix-ui/themes';
import type { ReactNode } from 'react';
import styles from './styles.module.css';

export interface ColumnDef {
  id: string;
  header: string;
  width?: string;
  accessor: (row: any) => string | ReactNode;
}

interface TableProps {
  columns: ColumnDef[];
  data: any[];
  className?: string;
  additionalRow?: ReactNode;
}

export function Table({ columns, data, className, additionalRow }: TableProps) {
  return (
    <Box className={`${styles.tableContainer} ${className || ''}`}>
      <RadixTable.Root className={styles.tableRoot}>
        <RadixTable.Header className={styles.tableHeader}>
          <RadixTable.Row>
            {columns.map((column) => (
              <RadixTable.ColumnHeaderCell
                key={column.id}
                style={{ width: column.width }}
                className={styles.tableHeaderCell}
              >
                {column.header}
              </RadixTable.ColumnHeaderCell>
            ))}
          </RadixTable.Row>
        </RadixTable.Header>

        <RadixTable.Body className={styles.tableBody}>
          {data.map((row) => (
            <RadixTable.Row key={row.id} className={styles.tableRow}>
              {columns.map((column) => (
                <RadixTable.Cell key={`${row.id}-${column.id}`} className={styles.tableCell}>
                  {column.accessor(row)}
                </RadixTable.Cell>
              ))}
            </RadixTable.Row>
          ))}
          {additionalRow && (
            <RadixTable.Row className={styles.tableRow}>
              <RadixTable.Cell colSpan={columns.length} className={styles.tableCell}>
                {additionalRow}
              </RadixTable.Cell>
            </RadixTable.Row>
          )}
        </RadixTable.Body>
      </RadixTable.Root>
    </Box>
  );
}
