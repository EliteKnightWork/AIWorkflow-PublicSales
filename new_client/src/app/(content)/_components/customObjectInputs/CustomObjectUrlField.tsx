import { Box, Text } from '@radix-ui/themes';
import type { Dispatch, ReactNode, SetStateAction } from 'react';

import type { CustomObjectItem, UpdateCustomObjectItemsBody } from '@/api/generated/models';

import styles from './styles.module.css';

type Props = {
  items: CustomObjectItem[];
  label: ReactNode;
  customObjectId: number;
  invalidUrlMap: Record<number, boolean>;
  setInvalidUrlMap: Dispatch<SetStateAction<Record<number, boolean>>>;
  isValidHttpUrl: (value: string) => boolean;
  getTemplateItemValueId: (item: CustomObjectItem) => number | undefined;
  buildAndSendUpdate: (
    customObjectId: number,
    payloadItems: UpdateCustomObjectItemsBody['custom_object_items']
  ) => void;
};

export function CustomObjectUrlField({
  items,
  label,
  customObjectId,
  invalidUrlMap,
  setInvalidUrlMap,
  isValidHttpUrl,
  getTemplateItemValueId,
  buildAndSendUpdate,
}: Props) {
  if (!items.length) return null;

  return (
    <Box className={styles.formItem}>
      {label}
      {items.map((item) => (
        <Box key={`${item.id}-${item.url ?? ''}`}>
          <Box className={styles.selectField}>
            <input
              className={styles.textFieldInput}
              type='url'
              defaultValue={item.url || ''}
              placeholder='入力してください'
              inputMode='url'
              aria-invalid={invalidUrlMap[item.id] ? 'true' : 'false'}
              onChange={(e) => {
                const val = (e.currentTarget.value || '').trim();
                setInvalidUrlMap((prev) => ({
                  ...prev,
                  [item.id]: val.length > 0 ? !isValidHttpUrl(val) : false,
                }));
              }}
              onBlur={(e) => {
                const value = (e.currentTarget.value || '').trim();
                setInvalidUrlMap((prev) => ({
                  ...prev,
                  [item.id]: value.length > 0 ? !isValidHttpUrl(value) : false,
                }));
                if (value.length > 0 && !isValidHttpUrl(value)) return;
                const templateValueId = getTemplateItemValueId(item);
                if (!templateValueId) return;
                buildAndSendUpdate(customObjectId, [
                  {
                    id: item.id,
                    custom_object_template_item_value_id: templateValueId,
                    url: value ? value : null,
                  },
                ]);
              }}
            />
            <span className='material-icons' style={{ color: '#373b47', fontSize: '24px' }}>
              link
            </span>
          </Box>
          {invalidUrlMap[item.id] && (
            <Text color='red' size='1' style={{ marginTop: '4px' }}>
              URLは http:// または https:// で始める必要があります
            </Text>
          )}
        </Box>
      ))}
    </Box>
  );
}
