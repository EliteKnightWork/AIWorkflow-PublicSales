import { Box, Text } from '@radix-ui/themes';
import type { Dispatch, ReactNode, SetStateAction } from 'react';

import type { CustomObjectItem, UpdateCustomObjectItemsBody } from '@/api/generated/models';

import styles from './styles.module.css';

const MAX_INTEGER_DIGITS = 15;
const MAX_FRACTION_DIGITS = 5;
const LENGTH_ERROR_MESSAGE = `整数部は${MAX_INTEGER_DIGITS}桁以内、小数部は${MAX_FRACTION_DIGITS}桁以内で入力してください`;

// 入力値の整形
const sanitizeNumberInput = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { normalized: '', decimalValue: null, isValid: true } as const;
  }

  // 許容する形式: 符号(optional) + 整数部 + 小数部(optional)。
  // 指数表記は許容しない（onKeyDown/onInput 側でも e/E を抑止）。
  const match = trimmed.match(/^(-?)(\d*)(?:\.(\d*))?$/);
  if (!match) {
    return { normalized: '', decimalValue: null, isValid: false } as const;
  }

  const [, sign, integerRaw = '', fractionRaw = ''] = match;
  // 先頭ゼロを整理しつつ、空の整数部は "0" とする
  let integerPart = integerRaw === '' ? '0' : integerRaw;
  // 先頭の0削除
  integerPart = integerPart.replace(/^0+(?=\d)/, '');
  if (integerPart === '') integerPart = '0';
  // 桁数制限に合わせて整数部を切り詰め
  integerPart = integerPart.slice(0, MAX_INTEGER_DIGITS);

  // 桁数制限に合わせて小数部を切り詰め
  const fractionPart = fractionRaw.slice(0, MAX_FRACTION_DIGITS);

  // 絶対値が 0 の場合は負号を外す
  const shouldKeepNegative = sign === '-' && (integerPart !== '0' || fractionPart.length > 0);
  const normalized = `${shouldKeepNegative ? '-' : ''}${integerPart}${
    fractionPart.length > 0 ? `.${fractionPart}` : ''
  }`;
  return { normalized, decimalValue: normalized, isValid: true } as const;
};

type Props = {
  items: CustomObjectItem[];
  label: ReactNode;
  customObjectId: number;
  getTemplateItemValueId: (item: CustomObjectItem) => number | undefined;
  buildAndSendUpdate: (
    customObjectId: number,
    payloadItems: UpdateCustomObjectItemsBody['custom_object_items']
  ) => void;
  invalidNumberMap: Record<number, boolean>;
  setInvalidNumberMap: Dispatch<SetStateAction<Record<number, boolean>>>;
};

export function CustomObjectNumberField({
  items,
  label,
  customObjectId,
  getTemplateItemValueId,
  buildAndSendUpdate,
  invalidNumberMap,
  setInvalidNumberMap,
}: Props) {
  if (!items.length) return null;

  return (
    <Box className={styles.formItem}>
      {label}
      {items.map((item) => {
        const itemKey = `${item.id}-${item.numberValue ?? ''}`;
        return (
          <Box key={itemKey} className={styles.fieldWithMessage}>
            <Box className={styles.textField}>
              <input
                className={styles.textFieldInput}
                type='number'
                inputMode='decimal'
                step='any'
                defaultValue={item.numberValue ?? ''}
                placeholder='数値を入力してください'
                aria-invalid={invalidNumberMap[item.id] ? 'true' : 'false'}
                onKeyDown={(event) => {
                  if (event.key === 'e' || event.key === 'E') {
                    event.preventDefault();
                  }
                }}
                onInput={(event) => {
                  const value = event.currentTarget.value;
                  if (value.includes('e') || value.includes('E')) {
                    event.currentTarget.value = value.replace(/e/gi, '');
                  }
                }}
                onBlur={(event) => {
                  const templateValueId = getTemplateItemValueId(item);
                  if (!templateValueId) return;

                  const rawValue = event.currentTarget.value;
                  if (rawValue.trim() === '') {
                    setInvalidNumberMap((prev) => ({ ...prev, [item.id]: false }));
                    buildAndSendUpdate(customObjectId, [
                      {
                        id: item.id,
                        custom_object_template_item_value_id: templateValueId,
                        number_value: null,
                      },
                    ]);
                    event.currentTarget.value = '';
                    return;
                  }

                  const { normalized, decimalValue, isValid } = sanitizeNumberInput(rawValue);
                  if (!isValid || normalized === '') {
                    setInvalidNumberMap((prev) => ({ ...prev, [item.id]: true }));
                    event.currentTarget.value =
                      item.numberValue != null ? String(item.numberValue) : '';
                    return;
                  }

                  setInvalidNumberMap((prev) => ({ ...prev, [item.id]: false }));
                  event.currentTarget.value = normalized;
                  buildAndSendUpdate(customObjectId, [
                    {
                      id: item.id,
                      custom_object_template_item_value_id: templateValueId,
                      number_value: decimalValue,
                    },
                  ]);
                }}
              />
              <span
                className='material-symbols-outlined'
                style={{ color: 'var(--text-color-tertiary)', fontSize: '24px' }}
              >
                pin
              </span>
            </Box>
            {invalidNumberMap[item.id] && (
              <Text color='red' size='1' className={styles.inlineErrorMessage}>
                {LENGTH_ERROR_MESSAGE}
              </Text>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
