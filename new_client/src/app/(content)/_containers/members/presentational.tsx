'use client';
import { Box, Button, Table } from '@radix-ui/themes';
import type { User } from '@/api/generated/models';
import styles from './styles.module.css';

type Props = {
  members: User[];
  onGetCompanyInvitations: () => void;
};

export default function Members({ members, onGetCompanyInvitations }: Props) {
  return (
    <Box className={styles.membersArea}>
      <Table.Root className={styles.membersTable}>
        <Table.Header className={styles.membersTableHeader}>
          <Table.Row className={styles.membersTableHeaderRow}>
            <Table.ColumnHeaderCell
              className={`${styles.membersTableHeaderCell} ${styles.membersTableHeaderCellName}`}
            >
              名前
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className={styles.membersTableHeaderCell}>
              メールアドレス
            </Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {members?.map((member) => (
            <Table.Row key={member.id}>
              <Table.Cell className={`${styles.membersTableCell} ${styles.membersTableCellName}`}>
                {member.name}
              </Table.Cell>
              <Table.Cell className={styles.membersTableCell}>{member.email}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      <Box className={styles.bottomButtonArea}>
        <Button className={styles.memberLinkButton} onClick={onGetCompanyInvitations}>
          <span className='material-icons' translate='no' aria-hidden='true'>
            person_add
          </span>
          新規メンバーを招待
        </Button>
      </Box>
    </Box>
  );
}
