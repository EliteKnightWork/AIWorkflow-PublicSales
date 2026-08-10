import { Box } from '@radix-ui/themes';
import type { Dispatch, ReactNode, SetStateAction } from 'react';

import type { CustomObjectItem, UpdateCustomObjectItemsBody } from '@/api/generated/models';
import { TaskFormSelect } from '../../management/_components/taskForm/select/TaskFormSelect';

import styles from './styles.module.css';

type CompanyMember = {
  id?: number | null;
  name?: string | null;
  email?: string | null;
};

type Props = {
  items: CustomObjectItem[];
  label: ReactNode;
  customObjectId: number;
  companyMembers: CompanyMember[];
  personValues: Record<number, string | undefined>;
  setPersonValues: Dispatch<SetStateAction<Record<number, string | undefined>>>;
  getTemplateItemValueId: (item: CustomObjectItem) => number | undefined;
  buildAndSendUpdate: (
    customObjectId: number,
    payloadItems: UpdateCustomObjectItemsBody['custom_object_items']
  ) => void;
};

export function CustomObjectPersonSelect({
  items,
  label,
  customObjectId,
  companyMembers,
  personValues,
  setPersonValues,
  getTemplateItemValueId,
  buildAndSendUpdate,
}: Props) {
  if (!items.length) return null;

  const members = (companyMembers ?? []).map((u) => ({
    id: u.id?.toString() ?? '',
    value: u.name ?? u.email ?? '',
  }));

  return (
    <Box className={styles.formItem}>
      {label}
      {items.map((item) => {
        const selectedId = personValues[item.id] ?? (item.userId ? String(item.userId) : undefined);
        const selectedItem = selectedId ? (members.find((m) => m.id === selectedId) ?? null) : null;
        const selectedLabel = selectedItem?.value ?? '未選択';
        return (
          <TaskFormSelect
            key={item.id}
            className={styles.selectField}
            triggerNode={
              <Box style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                {selectedItem ? (
                  <Box className={styles.personTag}>{selectedLabel}</Box>
                ) : (
                  <Box className={`${styles.selectFieldInput}`} style={{ textAlign: 'left' }}>
                    {selectedLabel}
                  </Box>
                )}
              </Box>
            }
            items={members}
            selectedItem={selectedItem}
            onSelect={(sel) => {
              setPersonValues((prev) => ({ ...prev, [item.id]: sel.id }));
              const templateValueId = getTemplateItemValueId(item);
              if (!templateValueId) return;
              buildAndSendUpdate(customObjectId, [
                {
                  id: item.id,
                  custom_object_template_item_value_id: templateValueId,
                  user_id: sel?.id ? Number(sel.id) : null,
                },
              ]);
            }}
          />
        );
      })}
    </Box>
  );
}
