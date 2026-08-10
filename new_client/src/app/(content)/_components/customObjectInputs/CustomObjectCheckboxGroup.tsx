import { Box } from '@radix-ui/themes';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { CustomObjectItem, UpdateCustomObjectItemsBody } from '@/api/generated/models';
import { AppCheckbox } from '@/components/checkbox/AppCheckbox';

import styles from './styles.module.css';

type Props = {
  items: CustomObjectItem[];
  label: ReactNode;
  customObjectId: number;
  checkboxValues: Record<number, boolean>;
  setCheckboxValues: Dispatch<SetStateAction<Record<number, boolean>>>;
  getTemplateItemValueId: (item: CustomObjectItem) => number | undefined;
  buildAndSendUpdate: (
    customObjectId: number,
    payloadItems: UpdateCustomObjectItemsBody['custom_object_items']
  ) => void;
};

export function CustomObjectCheckboxGroup({
  items,
  label,
  customObjectId,
  checkboxValues,
  setCheckboxValues,
  getTemplateItemValueId,
  buildAndSendUpdate,
}: Props) {
  if (!items.length) return null;

  return (
    <Box className={styles.formItem}>
      {label}
      <Box className={styles.checkboxGroup}>
        {items.map((item) => {
          const isChecked = checkboxValues[item.id] ?? Boolean(item.isChecked);
          return (
            <AppCheckbox
              key={item.id}
              label={item.checkboxTitle || '選択肢'}
              checked={isChecked}
              onChange={(checked) => {
                setCheckboxValues((prev) => ({ ...prev, [item.id]: checked }));
                const templateValueId = getTemplateItemValueId(item);
                if (!templateValueId) return;
                buildAndSendUpdate(customObjectId, [
                  {
                    id: item.id,
                    custom_object_template_item_value_id: templateValueId,
                    is_checked: checked,
                  },
                ]);
              }}
              parentBoxCheckedClassName={styles.checkboxParentCheckedOverride}
              checkboxClassName={styles.checkboxRootOverride}
              checkBoxCheckedClassName={styles.checkboxRootCheckedOverride}
              checkedTextClassName={styles.checkboxTextCheckedOverride}
              parentBoxClassName={styles.checkboxParentOverride}
            />
          );
        })}
      </Box>
    </Box>
  );
}
