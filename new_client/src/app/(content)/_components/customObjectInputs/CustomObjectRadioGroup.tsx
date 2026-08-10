import { Box } from '@radix-ui/themes';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { CustomObjectItem, UpdateCustomObjectItemsBody } from '@/api/generated/models';
import { AppRadio } from '@/components/radiobutton/AppRadio';

import styles from './styles.module.css';

type Props = {
  items: CustomObjectItem[];
  label: ReactNode;
  customObjectId: number;
  radioValues: Record<string, string | undefined>;
  setRadioValues: Dispatch<SetStateAction<Record<string, string | undefined>>>;
  getTemplateItemValueId: (item: CustomObjectItem) => number | undefined;
  buildAndSendUpdate: (
    customObjectId: number,
    payloadItems: UpdateCustomObjectItemsBody['custom_object_items']
  ) => void;
};

export function CustomObjectRadioGroup({
  items,
  label,
  customObjectId,
  radioValues,
  setRadioValues,
  getTemplateItemValueId,
  buildAndSendUpdate,
}: Props) {
  if (!items.length) return null;

  const groupKey = String(
    (items[0] as unknown as { customObjectTemplateItemId?: number }).customObjectTemplateItemId ??
      items[0].id
  );
  const selected = radioValues[groupKey] ?? items.find((i) => i.isChecked)?.id?.toString();

  const buildPayload = (selectedId: number | null) =>
    items
      .map((it) => {
        const templateValueId = getTemplateItemValueId(it);
        if (!templateValueId) return null;
        return {
          id: it.id,
          custom_object_template_item_value_id: templateValueId,
          is_checked: selectedId !== null && it.id === selectedId,
        };
      })
      .filter(Boolean) as UpdateCustomObjectItemsBody['custom_object_items'];

  return (
    <Box className={styles.formItem}>
      {label}
      <Box className={`${styles.radioGroup} ${styles.radioBlueTheme}`}>
        {items.map((item) => (
          <AppRadio
            key={item.id}
            name={`custom-object-radio-${groupKey}`}
            value={String(item.id)}
            label={item.radioButtonTitle || '選択肢'}
            checked={selected === String(item.id)}
            onChange={() => {
              setRadioValues((prev) => ({ ...prev, [groupKey]: String(item.id) }));
              buildAndSendUpdate(customObjectId, buildPayload(item.id));
            }}
            onClick={() => {
              if (selected === String(item.id)) {
                setRadioValues((prev) => ({ ...prev, [groupKey]: '' }));
                buildAndSendUpdate(customObjectId, buildPayload(null));
              }
            }}
            parentClassName={styles.radioParentOverride}
          />
        ))}
      </Box>
    </Box>
  );
}
