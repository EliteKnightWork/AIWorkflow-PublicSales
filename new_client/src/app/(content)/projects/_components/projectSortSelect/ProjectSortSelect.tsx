'use client';

import * as Select from '@radix-ui/react-select';
import { Flex } from '@radix-ui/themes';
import { ProjectStatusTab, type SortBy } from '@/api/generated/models';
import styles from './styles.module.css';

const BASE_SORT_OPTIONS: ReadonlyArray<{ value: SortBy; label: string }> = [
  { value: 'publication_date_desc', label: '公告日が新しい順' },
  { value: 'publication_date_asc', label: '公告日が古い順' },
];

const AWARDED_SORT_OPTIONS: ReadonlyArray<{ value: SortBy; label: string }> = [
  { value: 'tender_opening_date_desc', label: '落札日が新しい順' },
  { value: 'tender_opening_date_asc', label: '落札日が古い順' },
];

type Props = {
  value?: SortBy;
  onChange: (sortBy: SortBy) => void;
  tab: ProjectStatusTab;
};

export function ProjectSortSelect({ value, onChange, tab }: Props) {
  const isAwardedTab = tab === ProjectStatusTab.awarded;
  const options = isAwardedTab
    ? [...AWARDED_SORT_OPTIONS, ...BASE_SORT_OPTIONS]
    : BASE_SORT_OPTIONS;
  const defaultValue: SortBy = isAwardedTab
    ? AWARDED_SORT_OPTIONS[0].value
    : BASE_SORT_OPTIONS[0].value;
  const currentValue: SortBy =
    value && options.some((option) => option.value === value) ? value : defaultValue;

  return (
    <Flex align='center' gap='3' className={styles.sortSelectBox}>
      表示順
      <Select.Root value={currentValue} onValueChange={(next) => onChange(next as SortBy)}>
        <Select.Trigger className={styles.sortSelectTrigger} aria-label='表示順'>
          <Flex align='center'>
            <Select.Value placeholder={options[0]?.label ?? '公告日が新しい順'} />
            <span className={`material-symbols-outlined ${styles.sortSelectIcon}`}>
              expand_more
            </span>
          </Flex>
        </Select.Trigger>
        <Select.Content position='popper' sideOffset={5} className={styles.sortSelectContent}>
          <Select.Viewport>
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className={styles.sortSelectItem}
              >
                <Select.ItemText>{option.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Root>
    </Flex>
  );
}
