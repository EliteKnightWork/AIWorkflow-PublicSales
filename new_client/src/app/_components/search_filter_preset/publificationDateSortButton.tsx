import { Box, Flex, Text } from '@radix-ui/themes';
import type { SortBy } from '@/api/generated/models';
import { AppRadio } from '@/components/radiobutton/AppRadio';
import styles from './styles.module.css';

type Props = {
  value?: SortBy;
  onChange?: (sortBy: SortBy) => void;
};

export const PublificationDateSortButton = ({ value, onChange }: Props) => {
  const handleSortChange = (sortType: 'desc' | 'asc') => {
    const sortBy = sortType === 'desc' ? 'publication_date_desc' : 'publication_date_asc';
    onChange?.(sortBy as SortBy);
  };

  const isDescSelected = value === 'publication_date_desc' || (!value && true); // Default to desc
  const isAscSelected = value === 'publication_date_asc';

  return (
    <Box className={styles.formBox}>
      <Text className={styles.formTitle}>表示順</Text>
      <Flex direction='row' className={styles.selectGroupBox}>
        <AppRadio
          label='公告日が新しい順'
          name='publificationDateSort'
          value='desc'
          checked={isDescSelected}
          onChange={() => handleSortChange('desc')}
          inputClassName={styles.input}
        />
        <AppRadio
          label='公告日が古い順'
          name='publificationDateSort'
          value='asc'
          checked={isAscSelected}
          onChange={() => handleSortChange('asc')}
          inputClassName={styles.input}
        />
      </Flex>
    </Box>
  );
};
