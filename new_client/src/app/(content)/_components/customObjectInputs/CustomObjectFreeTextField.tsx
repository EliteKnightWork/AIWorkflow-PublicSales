import { Box, Flex, Text } from '@radix-ui/themes';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import type { CustomObjectItem, UpdateCustomObjectItemsBody } from '@/api/generated/models';

import styles from './styles.module.css';

const SINGLELINE_MAX_LENGTH = 100;

type Props = {
  items: CustomObjectItem[];
  label: ReactNode;
  customObjectId: number;
  getTemplateItemValueId: (item: CustomObjectItem) => number | undefined;
  buildAndSendUpdate: (
    customObjectId: number,
    payloadItems: UpdateCustomObjectItemsBody['custom_object_items']
  ) => void;
};

export function CustomObjectFreeTextField({
  items,
  label,
  customObjectId,
  getTemplateItemValueId,
  buildAndSendUpdate,
}: Props) {
  const [counts, setCounts] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    for (const item of items) {
      const value = item.freeText || '';
      initial[item.id] = value.length;
    }
    return initial;
  });

  useEffect(() => {
    const next: Record<number, number> = {};
    for (const item of items) {
      const value = item.freeText || '';
      next[item.id] = value.length;
    }
    setCounts(next);
  }, [items]);

  if (!items.length) return null;

  return (
    <Box className={styles.formItem}>
      {label}
      {items.map((item) => (
        <Box key={`${item.id}-${item.freeText ?? ''}`} className={styles.fieldWithMessage}>
          <Box className={styles.textField}>
            <input
              className={styles.textFieldInput}
              maxLength={SINGLELINE_MAX_LENGTH}
              defaultValue={item.freeText || ''}
              placeholder='入力してください'
              onChange={(e) => {
                const value = e.currentTarget.value;
                setCounts((prev) => ({ ...prev, [item.id]: value.length }));
              }}
              onBlur={(e) => {
                const sanitized = e.currentTarget.value?.replace(/[\r\n]+/g, ' ').trim();
                const limited = (sanitized || '').slice(0, SINGLELINE_MAX_LENGTH);
                const templateValueId = getTemplateItemValueId(item);
                if (!templateValueId) return;
                buildAndSendUpdate(customObjectId, [
                  {
                    id: item.id,
                    custom_object_template_item_value_id: templateValueId,
                    free_text: limited.length > 0 ? limited : null,
                  },
                ]);
              }}
            />
          </Box>
          <Flex className={styles.flexRow}>
            {counts[item.id] >= SINGLELINE_MAX_LENGTH && (
              <Text color='red' size='1'>
                文字数が上限に達しました。これ以上入力することができません。
              </Text>
            )}
            <Box className={styles.countRow}>
              <span className={styles.countText}>
                {counts[item.id] ?? 0} / {SINGLELINE_MAX_LENGTH}
              </span>
            </Box>
          </Flex>
        </Box>
      ))}
    </Box>
  );
}
