'use client';
import * as Select from '@radix-ui/react-select';
import { Box, Flex } from '@radix-ui/themes';
import styles from './styles.module.css';
import { PerPageOptions } from './types';

type Props = {
  currentPer: number;
  onChangePer: (per: number) => void;
};

export default function PaginatesPer({ currentPer, onChangePer }: Props) {
  return (
    <Box className={styles.pagePerSelectBox}>
      <Flex direction={'row'} align={'center'} gap={'3'}>
        1ページあたりの件数
        <Select.Root
          onValueChange={(value) => {
            onChangePer(Number.parseInt(value));
          }}
        >
          <Select.Trigger className={styles.pagePerSelectTrigger}>
            <Flex direction={'row'} align={'center'}>
              {currentPer}件
              <span className={`material-symbols-outlined ${styles.pagePerSelectIcon}`}>
                expand_more
              </span>
            </Flex>
          </Select.Trigger>

          <Select.Content position='popper' sideOffset={5} className={styles.pagePerSelectContent}>
            {PerPageOptions.map((perPageOption) => (
              <Select.Item
                key={perPageOption.value}
                value={`${perPageOption.value}`}
                className={styles.pagePerSelectItem}
              >
                {perPageOption.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </Flex>
    </Box>
  );
}
