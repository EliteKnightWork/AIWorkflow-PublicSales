import { Box } from '@radix-ui/themes';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import type { CustomObjectItem, UpdateCustomObjectItemsBody } from '@/api/generated/models';

import styles from './styles.module.css';

type Props = {
  items: CustomObjectItem[];
  label: ReactNode;
  customObjectId: number;
  calendarValues: Record<number, Date | undefined>;
  setCalendarValues: Dispatch<SetStateAction<Record<number, Date | undefined>>>;
  getTemplateItemValueId: (item: CustomObjectItem) => number | undefined;
  buildAndSendUpdate: (
    customObjectId: number,
    payloadItems: UpdateCustomObjectItemsBody['custom_object_items']
  ) => void;
};

export function CustomObjectCalendarField({
  items,
  label,
  customObjectId,
  calendarValues,
  setCalendarValues,
  getTemplateItemValueId,
  buildAndSendUpdate,
}: Props) {
  if (!items.length) return null;

  return (
    <Box className={styles.formItem}>
      {label}
      {items.map((item) => {
        const selected =
          calendarValues[item.id] ?? (item.calendar ? new Date(item.calendar) : undefined);
        return (
          <Box key={item.id} className={styles.selectField}>
            <DatePicker
              selected={selected}
              onChange={(date) => {
                setCalendarValues((prev) => ({ ...prev, [item.id]: date ?? undefined }));
                const templateValueId = getTemplateItemValueId(item);
                if (!templateValueId) return;
                buildAndSendUpdate(customObjectId, [
                  {
                    id: item.id,
                    custom_object_template_item_value_id: templateValueId,
                    calendar: date ? new Date(date).toISOString() : null,
                  },
                ]);
              }}
              dateFormat='yyyy/MM/dd'
              placeholderText='選択してください'
              locale='ja'
              customInput={<input className={styles.textFieldInput} />}
            />
            <span className='material-icons' style={{ color: '#373b47', fontSize: '24px' }}>
              calendar_today
            </span>
          </Box>
        );
      })}
    </Box>
  );
}
