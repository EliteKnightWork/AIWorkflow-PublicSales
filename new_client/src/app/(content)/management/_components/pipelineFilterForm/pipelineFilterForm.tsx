'use client';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { useEffect, useMemo, useState } from 'react';
import { useGetCustomObjectFilterItems } from '@/api/generated/endpoints/custom-object-filter-items';
import { useGetCurrentUser } from '@/api/generated/endpoints/users';
import type { CustomObjectFilterItem, User } from '@/api/generated/models';
import customObjectInputStyles from '@/app/(content)/_components/customObjectInputs/styles.module.css';
import { AppDatePicker } from '@/app/(content)/_components/datePicker/AppDatePicker';
import { AppCheckbox } from '@/components/checkbox/AppCheckbox';
import { AppRadio } from '@/components/radiobutton/AppRadio';
import { convertDateToYYYYMMDD } from '@/utils/dateUtils';
import { TaskFormMultiSelect } from '../taskForm/select/TaskFormMultiSelect';
import { TaskFormSelect } from '../taskForm/select/TaskFormSelect';
import styles from './styles.module.css';
import { NO_ASSIGNED_ID, UNSELECTED_ID, UNSELECTED_MEMBER } from './types';

export type PipelineFilterCondition = {
  statusId?: number;
  assignedUserIds?: number[];
  participationDeadlineFrom?: string;
  participationDeadlineTo?: string;
  proposalDeadlineFrom?: string;
  proposalDeadlineTo?: string;
  // カスタムオブジェクトの絞り込み条件
  // key: custom_object_template_item.id
  customObjectFilters?: Record<number, any>;
};

type Props = {
  onSubmit: (filterCondition: PipelineFilterCondition) => void;
  onCancel: () => void;
  initialCondition?: PipelineFilterCondition;
  members?: User[];
};

const MAX_INTEGER_DIGITS = 15;
const MAX_FRACTION_DIGITS = 5;
const LENGTH_ERROR_MESSAGE = `整数部は${MAX_INTEGER_DIGITS}桁以内、小数部は${MAX_FRACTION_DIGITS}桁以内で入力してください`;
const RANGE_ERROR_MESSAGE = '下限は上限以下で入力してください';
const FRACTION_SCALE = BigInt(10) ** BigInt(MAX_FRACTION_DIGITS);

const sanitizeNumberString = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { normalized: '', isValid: true } as const;
  }

  const match = trimmed.match(/^(-?)(\d*)(?:\.(\d*))?$/);
  if (!match) {
    return { normalized: '', isValid: false } as const;
  }

  const [, sign, integerRaw = '', fractionRaw = ''] = match;
  let integerPart = integerRaw === '' ? '0' : integerRaw;
  integerPart = integerPart.replace(/^0+(?=\d)/, '');
  if (integerPart === '') integerPart = '0';
  integerPart = integerPart.slice(0, MAX_INTEGER_DIGITS);

  const fractionPart = fractionRaw.slice(0, MAX_FRACTION_DIGITS);

  const shouldKeepNegative = sign === '-' && (integerPart !== '0' || fractionPart.length > 0);
  const normalized = `${shouldKeepNegative ? '-' : ''}${integerPart}${
    fractionPart.length > 0 ? `.${fractionPart}` : ''
  }`;

  if (!Number.isFinite(Number(normalized))) {
    return { normalized: '', isValid: false } as const;
  }

  return { normalized, isValid: true } as const;
};

const toScaledInteger = (value: string): bigint => {
  const negative = value.startsWith('-');
  const unsigned = negative ? value.slice(1) : value;
  const [integerPartRaw, fractionPartRaw = ''] = unsigned.split('.');
  const integerPart = integerPartRaw === '' ? '0' : integerPartRaw;
  const fractionPart = (fractionPartRaw + '0'.repeat(MAX_FRACTION_DIGITS)).slice(
    0,
    MAX_FRACTION_DIGITS
  );
  const integerComponent = BigInt(integerPart) * FRACTION_SCALE;
  const fractionComponent = fractionPart === '' ? BigInt(0) : BigInt(fractionPart);
  const scaled = integerComponent + fractionComponent;
  return negative ? -scaled : scaled;
};

const sanitizeCustomObjectFilterValue = (value: any) => {
  if (!value) return undefined;

  switch (value.type) {
    case 'checkbox': {
      const selected = Array.isArray(value.selectedChoiceIds) ? value.selectedChoiceIds : [];
      return selected.length > 0 ? { ...value, selectedChoiceIds: selected } : undefined;
    }
    case 'radio':
      return value.selectedChoiceId != null ? value : undefined;
    case 'person':
      return value.userId != null ? value : undefined;
    case 'free_text':
    case 'free_text_multiline': {
      const text = typeof value.text === 'string' ? value.text.trim() : '';
      return text.length > 0 ? { ...value, text } : undefined;
    }
    case 'url': {
      const url = typeof value.url === 'string' ? value.url.trim() : '';
      return url.length > 0 ? { ...value, url } : undefined;
    }
    case 'calendar': {
      const rawFrom = typeof value.from === 'string' ? value.from.trim() : '';
      const rawTo = typeof value.to === 'string' ? value.to.trim() : '';

      let from = rawFrom || undefined;
      let to = rawTo || undefined;

      if (!from && !to) return undefined;

      if (from && to && from > to) {
        const [start, end] = [to, from];
        from = start;
        to = end;
      }

      return {
        type: 'calendar',
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      };
    }
    case 'number': {
      const rawFrom = typeof value.from === 'string' ? value.from.trim() : '';
      const rawTo = typeof value.to === 'string' ? value.to.trim() : '';

      let normalizedFrom: string | undefined;
      let normalizedTo: string | undefined;

      if (rawFrom) {
        const { normalized, isValid } = sanitizeNumberString(rawFrom);
        if (!isValid || normalized === '') return undefined;
        normalizedFrom = normalized;
      }

      if (rawTo) {
        const { normalized, isValid } = sanitizeNumberString(rawTo);
        if (!isValid || normalized === '') return undefined;
        normalizedTo = normalized;
      }

      if (!normalizedFrom && !normalizedTo) return undefined;

      if (normalizedFrom && normalizedTo) {
        const fromScaled = toScaledInteger(normalizedFrom);
        const toScaled = toScaledInteger(normalizedTo);
        if (fromScaled > toScaled) {
          const [start, end] = [normalizedTo, normalizedFrom];
          normalizedFrom = start;
          normalizedTo = end;
        }
      }

      return {
        type: 'number',
        ...(normalizedFrom ? { from: normalizedFrom } : {}),
        ...(normalizedTo ? { to: normalizedTo } : {}),
      };
    }
    default:
      return undefined;
  }
};

const sanitizeAssignedUserIds = (ids?: number[]) => {
  if (!ids || ids.length === 0) return undefined;
  const filtered = ids.filter((id) => id !== UNSELECTED_ID && id !== NO_ASSIGNED_ID);
  return filtered.length > 0 ? filtered : undefined;
};

export const PipelineFilterForm = ({
  onSubmit,
  onCancel,
  initialCondition,
  members = [],
}: Props) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filterCondition, setFilterCondition] = useState<PipelineFilterCondition>({
    statusId: undefined,
    assignedUserIds: undefined,
    participationDeadlineFrom: undefined,
    participationDeadlineTo: undefined,
    proposalDeadlineFrom: undefined,
    proposalDeadlineTo: undefined,
  });

  const memberSelectItems = useMemo(
    () =>
      users
        .filter((u): u is User & { id: number } => typeof u.id === 'number')
        .map((u) => ({ id: u.id.toString(), value: u.name ?? u.email ?? '' })),
    [users]
  );

  // 現在のユーザーからcompanyIdを取得し、項目一覧を取得
  const { data: currentUser } = useGetCurrentUser();
  const companyId = currentUser?.companyId ?? undefined;
  const { data: customObjectFilterItems } = useGetCustomObjectFilterItems(companyId || 0, {
    query: {
      enabled: !!companyId,
    },
  });

  const isValidHttpUrl = (value: string): boolean => {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_e) {
      return false;
    }
  };

  const [invalidUrlFilterMap, setInvalidUrlFilterMap] = useState<Record<number, boolean>>({});
  const [numberFilterErrorMap, setNumberFilterErrorMap] = useState<
    Record<number, string | undefined>
  >({});
  const hasInvalidUrls = Object.values(invalidUrlFilterMap).some(Boolean);
  const hasInvalidNumbers = Object.values(numberFilterErrorMap).some((message) => Boolean(message));

  const [expandedTemplateIds, setExpandedTemplateIds] = useState<Set<number>>(new Set());
  const [groupResetKeys, setGroupResetKeys] = useState<Record<number, number>>({});

  const groupedCustomObjectFilterItems = useMemo(() => {
    if (!customObjectFilterItems || customObjectFilterItems.length === 0) {
      return [] as Array<{
        template: CustomObjectFilterItem['customObjectTemplate'];
        items: CustomObjectFilterItem[];
      }>;
    }

    const groups: Array<{
      template: CustomObjectFilterItem['customObjectTemplate'];
      items: CustomObjectFilterItem[];
    }> = [];
    const templateMap = new Map<
      number,
      { template: CustomObjectFilterItem['customObjectTemplate']; items: CustomObjectFilterItem[] }
    >();

    for (const item of customObjectFilterItems) {
      const template = item.customObjectTemplate;
      if (!template || typeof template.id !== 'number') return;

      let group = templateMap.get(template.id);
      if (!group) {
        group = { template, items: [] };
        templateMap.set(template.id, group);
        groups.push(group);
      }
      group.items.push(item);
    }

    return groups;
  }, [customObjectFilterItems]);

  useEffect(() => {
    if (groupedCustomObjectFilterItems?.length === 0) return;

    setExpandedTemplateIds((prev) => {
      const presentIds = new Set<number>();
      for (const group of groupedCustomObjectFilterItems ?? []) {
        if (typeof group.template.id === 'number') {
          presentIds.add(group.template.id);
        }
      }

      const next = new Set(prev);
      let changed = false;

      for (const id of prev) {
        if (!presentIds.has(id)) {
          next.delete(id);
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [groupedCustomObjectFilterItems]);

  useEffect(() => {
    if (initialCondition) {
      setFilterCondition({
        ...initialCondition,
        assignedUserIds: sanitizeAssignedUserIds(initialCondition.assignedUserIds),
      });
    }
  }, [initialCondition]);

  // メンバーデータの初期化
  useEffect(() => {
    const sanitizedMembers = (members ?? []).filter((member) => member?.id !== NO_ASSIGNED_ID);
    const membersWithOptions = [{ ...UNSELECTED_MEMBER, name: '未選択' }, ...sanitizedMembers];
    setUsers(membersWithOptions);
  }, [members]);

  const handleResetCustomObjectFilters = (templateId: number, itemIds: number[]) => {
    if (itemIds.length === 0) return;

    let shouldResetKey = false;

    setFilterCondition((prev) => {
      const prevFilters = prev.customObjectFilters;
      if (!prevFilters || Object.keys(prevFilters).length === 0) {
        if (prev.customObjectFilters) {
          shouldResetKey = true;
          return { ...prev, customObjectFilters: undefined };
        }
        return prev;
      }

      const nextFilters = { ...prevFilters } as Record<number, any>;
      let updated = false;

      for (const id of itemIds) {
        if (id in nextFilters) {
          delete nextFilters[id];
          updated = true;
        }
      }

      if (!updated) return prev;

      shouldResetKey = true;

      return {
        ...prev,
        customObjectFilters: Object.keys(nextFilters).length > 0 ? nextFilters : undefined,
      };
    });

    setInvalidUrlFilterMap((prev) => {
      let updated = false;
      const next = { ...prev };

      for (const id of itemIds) {
        if (id in next) {
          delete next[id];
          updated = true;
        }
      }

      if (updated) {
        shouldResetKey = true;
        return next;
      }

      return prev;
    });

    setNumberFilterErrorMap((prev) => {
      let updated = false;
      const next = { ...prev };

      for (const id of itemIds) {
        if (id in next) {
          delete next[id];
          updated = true;
        }
      }

      if (updated) {
        shouldResetKey = true;
        return next;
      }

      return prev;
    });

    if (shouldResetKey) {
      setGroupResetKeys((prev) => ({
        ...prev,
        [templateId]: (prev[templateId] ?? 0) + 1,
      }));
    }
  };

  return (
    <Flex direction={'column'} className={styles.pipelineFilterForm}>
      <Box className={styles.formBox}>
        <Text className={styles.formTitle}>担当者</Text>
        <TaskFormMultiSelect
          className={styles.select}
          triggerNode={
            <Box>
              {filterCondition.assignedUserIds && filterCondition.assignedUserIds.length > 0 ? (
                <Flex direction='row' gap='1' wrap='wrap' align='center'>
                  {filterCondition.assignedUserIds.map((userId) => {
                    const user = users.find((u) => u.id === userId);
                    return (
                      <Box
                        key={userId}
                        className={`${styles.selectedTab} ${styles.selectedAssignedUserTab}`}
                      >
                        {user?.name ?? user?.email ?? '未選択'}
                      </Box>
                    );
                  })}
                </Flex>
              ) : (
                <Box className={styles.unselectedTab}>未選択</Box>
              )}
            </Box>
          }
          items={[
            ...users.map((user) => ({
              id: user.id?.toString() ?? '',
              value: user.name ?? user.email ?? '',
            })),
          ]}
          selectedIds={filterCondition.assignedUserIds?.map((id) => id.toString()) ?? []}
          onSelectionChange={(selectedIds) => {
            const currentIds = filterCondition.assignedUserIds?.map((id) => id.toString()) ?? [];
            const addedIds = selectedIds.filter((id) => !currentIds.includes(id));

            if (addedIds.length > 0) {
              const addedId = addedIds[0];
              if (addedId === UNSELECTED_ID.toString()) {
                setFilterCondition({
                  ...filterCondition,
                  assignedUserIds: undefined,
                });
              } else if (addedId === NO_ASSIGNED_ID.toString()) {
                setFilterCondition({
                  ...filterCondition,
                  assignedUserIds: undefined,
                });
              } else {
                const filteredCurrentIds = (filterCondition.assignedUserIds ?? []).filter(
                  (id) => id !== Number(UNSELECTED_ID) && id !== Number(NO_ASSIGNED_ID)
                );
                setFilterCondition({
                  ...filterCondition,
                  assignedUserIds: sanitizeAssignedUserIds([
                    ...filteredCurrentIds,
                    Number(addedId),
                  ]),
                });
              }
            } else {
              const next = sanitizeAssignedUserIds(selectedIds.map((id) => Number(id)));
              setFilterCondition({
                ...filterCondition,
                assignedUserIds: next,
              });
            }
          }}
        />
      </Box>

      <Box className={styles.formBox}>
        <Text className={styles.formTitle}>参加申込期日</Text>
        <Flex
          direction={'row'}
          justify={'start'}
          align={'center'}
          className={styles.dateRangeContainer}
        >
          <Box className={styles.datePickerContainer}>
            <AppDatePicker
              maxDate={
                filterCondition.participationDeadlineTo
                  ? new Date(filterCondition.participationDeadlineTo)
                  : undefined
              }
              value={
                filterCondition.participationDeadlineFrom
                  ? new Date(filterCondition.participationDeadlineFrom)
                  : undefined
              }
              placeholderText='選択してください'
              onChange={(date) => {
                setFilterCondition({
                  ...filterCondition,
                  participationDeadlineFrom: date ? convertDateToYYYYMMDD(date) : undefined,
                });
              }}
            />
            <span className='material-icons' style={{ color: '#373b47', fontSize: '24px' }}>
              calendar_today
            </span>
          </Box>
          <span className={styles.dateRangeSeparator}>〜</span>
          <Box className={styles.datePickerContainer}>
            <AppDatePicker
              minDate={
                filterCondition.participationDeadlineFrom
                  ? new Date(filterCondition.participationDeadlineFrom)
                  : undefined
              }
              value={
                filterCondition.participationDeadlineTo
                  ? new Date(filterCondition.participationDeadlineTo)
                  : undefined
              }
              placeholderText='選択してください'
              onChange={(date) => {
                setFilterCondition({
                  ...filterCondition,
                  participationDeadlineTo: date ? convertDateToYYYYMMDD(date) : undefined,
                });
              }}
            />
            <span className='material-icons' style={{ color: '#373b47', fontSize: '24px' }}>
              calendar_today
            </span>
          </Box>
        </Flex>
      </Box>

      <Box className={styles.formBox}>
        <Text className={styles.formTitle}>提案書期日</Text>
        <Flex
          direction={'row'}
          justify={'start'}
          align={'center'}
          className={styles.dateRangeContainer}
        >
          <Box className={styles.datePickerContainer}>
            <AppDatePicker
              maxDate={
                filterCondition.proposalDeadlineTo
                  ? new Date(filterCondition.proposalDeadlineTo)
                  : undefined
              }
              value={
                filterCondition.proposalDeadlineFrom
                  ? new Date(filterCondition.proposalDeadlineFrom)
                  : undefined
              }
              placeholderText='選択してください'
              onChange={(date) => {
                setFilterCondition({
                  ...filterCondition,
                  proposalDeadlineFrom: date ? convertDateToYYYYMMDD(date) : undefined,
                });
              }}
            />
            <span className='material-icons' style={{ color: '#373b47', fontSize: '24px' }}>
              calendar_today
            </span>
          </Box>
          <span className={styles.dateRangeSeparator}>〜</span>
          <Box className={styles.datePickerContainer}>
            <AppDatePicker
              minDate={
                filterCondition.proposalDeadlineFrom
                  ? new Date(filterCondition.proposalDeadlineFrom)
                  : undefined
              }
              value={
                filterCondition.proposalDeadlineTo
                  ? new Date(filterCondition.proposalDeadlineTo)
                  : undefined
              }
              placeholderText='選択してください'
              onChange={(date) => {
                setFilterCondition({
                  ...filterCondition,
                  proposalDeadlineTo: date ? convertDateToYYYYMMDD(date) : undefined,
                });
              }}
            />
            <span className='material-icons' style={{ color: '#373b47', fontSize: '24px' }}>
              calendar_today
            </span>
          </Box>
        </Flex>
      </Box>

      <Box className={styles.divider} />

      {groupedCustomObjectFilterItems?.map((group) => {
        const templateId = group.template.id;
        if (typeof templateId !== 'number') return null;
        const resetKey = groupResetKeys[templateId] ?? 0;
        const itemIds = group.items
          .map((item) => (typeof item.id === 'number' ? item.id : undefined))
          .filter((id): id is number => id != null);
        const hasActiveFilterInGroup = itemIds.some((id) =>
          Boolean(filterCondition.customObjectFilters?.[id])
        );
        const isExpanded = expandedTemplateIds.has(templateId);

        const handleToggle = () => {
          setExpandedTemplateIds((prev) => {
            const next = new Set(prev);
            if (next.has(templateId)) {
              next.delete(templateId);
            } else {
              next.add(templateId);
            }
            return next;
          });
        };

        return (
          <Box key={`${templateId}-${resetKey}`} className={styles.customFilterGroup}>
            <button
              type='button'
              className={styles.customFilterGroupHeaderButton}
              onClick={handleToggle}
              aria-expanded={isExpanded}
            >
              <Text className={styles.customFilterGroupTitle}>{group.template.title}</Text>
              <span
                className={`material-icons ${styles.customFilterChevron}`}
                aria-hidden='true'
                translate='no'
              >
                expand_more
              </span>
            </button>
            {isExpanded && (
              <Box className={styles.customFilterGroupBody}>
                <Box className={styles.customFilterGroupActions}>
                  <Button
                    type='button'
                    className={`${styles.customFilterResetButton} ${
                      !hasActiveFilterInGroup ? styles.disabledButton : ''
                    }`}
                    onClick={() => handleResetCustomObjectFilters(templateId, itemIds)}
                    disabled={!hasActiveFilterInGroup}
                  >
                    選択をリセット
                  </Button>
                </Box>
                {group.items.map((item) => {
                  const current = filterCondition.customObjectFilters?.[item.id];
                  const calendarValue =
                    current?.type === 'calendar'
                      ? {
                          from: current.from,
                          to: current.to,
                        }
                      : undefined;

                  const setCurrent = (value: any) => {
                    setFilterCondition((prev) => {
                      const sanitizedValue = sanitizeCustomObjectFilterValue(value);
                      const nextFilters = { ...(prev.customObjectFilters ?? {}) } as Record<
                        number,
                        any
                      >;

                      if (sanitizedValue) {
                        nextFilters[item.id] = sanitizedValue;
                      } else {
                        delete nextFilters[item.id];
                      }

                      return {
                        ...prev,
                        customObjectFilters:
                          Object.keys(nextFilters).length > 0 ? nextFilters : undefined,
                      };
                    });
                  };

                  const numberValue = current?.type === 'number' ? current : undefined;
                  const numberRange = {
                    from:
                      typeof numberValue?.from === 'string' && numberValue.from.trim() !== ''
                        ? sanitizeNumberString(numberValue.from).normalized
                        : undefined,
                    to:
                      typeof numberValue?.to === 'string' && numberValue.to.trim() !== ''
                        ? sanitizeNumberString(numberValue.to).normalized
                        : undefined,
                  };
                  const numberErrorMessage = numberFilterErrorMap[item.id];
                  const updateNumberError = (message?: string) => {
                    setNumberFilterErrorMap((prev) => ({
                      ...prev,
                      [item.id]: message,
                    }));
                  };

                  return (
                    <Box
                      key={item.id}
                      className={`${styles.formBox} ${styles.customFilterItemBox}`}
                    >
                      {item.inputType === 'free_text' ||
                      item.inputType === 'free_text_multiline' ? null : (
                        <Text className={styles.formTitle}>{item.title}</Text>
                      )}

                      {item.inputType === 'url' && (
                        <Box>
                          <Box className={styles.datePickerContainer}>
                            <input
                              className={styles.textInput}
                              type='url'
                              defaultValue={current?.url || ''}
                              placeholder='入力してください'
                              inputMode='url'
                              aria-invalid={invalidUrlFilterMap[item.id] ? 'true' : 'false'}
                              onChange={(e) => {
                                const val = (e.currentTarget.value || '').trim();
                                setInvalidUrlFilterMap((prev) => ({
                                  ...prev,
                                  [item.id]: val.length > 0 ? !isValidHttpUrl(val) : false,
                                }));
                              }}
                              onBlur={(e) => {
                                const val = (e.currentTarget.value || '').trim();
                                setInvalidUrlFilterMap((prev) => ({
                                  ...prev,
                                  [item.id]: val.length > 0 ? !isValidHttpUrl(val) : false,
                                }));
                                if (val.length > 0 && !isValidHttpUrl(val)) return;
                                setCurrent({ type: 'url', url: val });
                              }}
                            />
                            <span
                              className='material-icons'
                              style={{ color: '#373b47', fontSize: '24px' }}
                            >
                              link
                            </span>
                          </Box>
                          {invalidUrlFilterMap[item.id] && (
                            <Text color='red' size='1' style={{ marginTop: '4px' }}>
                              URLは http:// または https:// で始める必要があります
                            </Text>
                          )}
                        </Box>
                      )}

                      {item.inputType === 'calendar' && (
                        <Flex
                          direction={'row'}
                          justify={'start'}
                          align={'center'}
                          className={styles.dateRangeContainer}
                        >
                          <Box className={styles.datePickerContainer}>
                            <AppDatePicker
                              maxDate={calendarValue?.to ? new Date(calendarValue.to) : undefined}
                              value={calendarValue?.from ? new Date(calendarValue.from) : undefined}
                              placeholderText='開始日を選択'
                              onChange={(date) =>
                                setCurrent({
                                  type: 'calendar',
                                  from: date ? convertDateToYYYYMMDD(date) : undefined,
                                  to: calendarValue?.to,
                                })
                              }
                            />
                            <span
                              className='material-icons'
                              style={{ color: 'var(--text-color-tertiary)', fontSize: '24px' }}
                            >
                              calendar_today
                            </span>
                          </Box>
                          <span className={styles.dateRangeSeparator}>〜</span>
                          <Box className={styles.datePickerContainer}>
                            <AppDatePicker
                              minDate={
                                calendarValue?.from ? new Date(calendarValue.from) : undefined
                              }
                              value={calendarValue?.to ? new Date(calendarValue.to) : undefined}
                              placeholderText='終了日を選択'
                              onChange={(date) =>
                                setCurrent({
                                  type: 'calendar',
                                  from: calendarValue?.from,
                                  to: date ? convertDateToYYYYMMDD(date) : undefined,
                                })
                              }
                            />
                            <span
                              className='material-icons'
                              style={{ color: 'var(--text-color-tertiary)', fontSize: '24px' }}
                            >
                              calendar_today
                            </span>
                          </Box>
                        </Flex>
                      )}

                      {item.inputType === 'number' && (
                        <Box>
                          <Flex
                            direction='row'
                            justify='start'
                            align='center'
                            className={styles.dateRangeContainer}
                          >
                            <Box className={styles.datePickerContainer}>
                              <input
                                className={styles.textInput}
                                type='number'
                                step='any'
                                inputMode='decimal'
                                aria-invalid={numberErrorMessage ? 'true' : 'false'}
                                defaultValue={numberRange.from ?? ''}
                                placeholder='最小値を入力してください'
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
                                onBlur={(e) => {
                                  const raw = (e.currentTarget.value || '').trim();
                                  if (raw === '') {
                                    updateNumberError(undefined);
                                    if (numberRange.to) {
                                      setCurrent({ type: 'number', to: numberRange.to });
                                    } else {
                                      setCurrent(undefined);
                                    }
                                    return;
                                  }

                                  const { normalized, isValid } = sanitizeNumberString(raw);
                                  if (!isValid || normalized === '') {
                                    updateNumberError(LENGTH_ERROR_MESSAGE);
                                    e.currentTarget.value = numberRange.from ?? '';
                                    return;
                                  }

                                  if (numberRange.to) {
                                    const fromScaled = toScaledInteger(normalized);
                                    const toScaled = toScaledInteger(numberRange.to);
                                    if (fromScaled > toScaled) {
                                      updateNumberError(RANGE_ERROR_MESSAGE);
                                      e.currentTarget.value = numberRange.from ?? '';
                                      return;
                                    }
                                  }

                                  updateNumberError(undefined);
                                  setCurrent({
                                    type: 'number',
                                    from: normalized,
                                    to: numberRange.to,
                                  });
                                  e.currentTarget.value = normalized;
                                }}
                              />
                              <span
                                className='material-symbols-outlined'
                                style={{ color: 'var(--text-color-tertiary)', fontSize: '24px' }}
                              >
                                pin
                              </span>
                            </Box>
                            <span className={styles.dateRangeSeparator}>〜</span>
                            <Box className={styles.datePickerContainer}>
                              <input
                                className={styles.textInput}
                                type='number'
                                step='any'
                                inputMode='decimal'
                                aria-invalid={numberErrorMessage ? 'true' : 'false'}
                                defaultValue={numberRange.to ?? ''}
                                placeholder='最大値を入力してください'
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
                                onBlur={(e) => {
                                  const raw = (e.currentTarget.value || '').trim();
                                  if (raw === '') {
                                    updateNumberError(undefined);
                                    if (numberRange.from) {
                                      setCurrent({ type: 'number', from: numberRange.from });
                                    } else {
                                      setCurrent(undefined);
                                    }
                                    return;
                                  }

                                  const { normalized, isValid } = sanitizeNumberString(raw);
                                  if (!isValid || normalized === '') {
                                    updateNumberError(LENGTH_ERROR_MESSAGE);
                                    e.currentTarget.value = numberRange.to ?? '';
                                    return;
                                  }

                                  if (numberRange.from) {
                                    const fromScaled = toScaledInteger(numberRange.from);
                                    const toScaled = toScaledInteger(normalized);
                                    if (fromScaled > toScaled) {
                                      updateNumberError(RANGE_ERROR_MESSAGE);
                                      e.currentTarget.value = numberRange.to ?? '';
                                      return;
                                    }
                                  }

                                  updateNumberError(undefined);
                                  setCurrent({
                                    type: 'number',
                                    from: numberRange.from,
                                    to: normalized,
                                  });
                                  e.currentTarget.value = normalized;
                                }}
                              />
                              <span
                                className='material-symbols-outlined'
                                style={{ color: 'var(--text-color-tertiary)', fontSize: '24px' }}
                              >
                                pin
                              </span>
                            </Box>
                          </Flex>
                          {numberErrorMessage && (
                            <Text color='red' size='1' style={{ marginTop: '4px' }}>
                              {numberErrorMessage}
                            </Text>
                          )}
                        </Box>
                      )}

                      {item.inputType === 'person' && (
                        <TaskFormSelect
                          className={styles.select}
                          triggerNode={
                            <Box>
                              {current?.userId ? (
                                <Box className={styles.selectedTab}>
                                  {
                                    memberSelectItems.find((m) => m.id === String(current.userId))
                                      ?.value
                                  }
                                </Box>
                              ) : (
                                <Box className={styles.unselectedTab}>未選択</Box>
                              )}
                            </Box>
                          }
                          items={memberSelectItems}
                          selectedItem={
                            current?.userId
                              ? (memberSelectItems.find((m) => m.id === String(current.userId)) ??
                                null)
                              : null
                          }
                          onSelect={(sel) => {
                            if (
                              sel?.id === String(NO_ASSIGNED_ID) ||
                              sel?.id === String(UNSELECTED_ID)
                            ) {
                              setCurrent(undefined);
                              return;
                            }

                            setCurrent({
                              type: 'person',
                              userId: sel?.id ? Number(sel.id) : undefined,
                            });
                          }}
                        />
                      )}

                      {item.inputType === 'radio' && (
                        <Flex
                          direction='column'
                          className={`${customObjectInputStyles.radioGroup} ${customObjectInputStyles.radioBlueTheme}`}
                        >
                          {(item.choices ?? []).map((choice) => (
                            <AppRadio
                              key={choice.id}
                              name={`cof-radio-${item.id}`}
                              value={String(choice.id)}
                              label={choice.content}
                              checked={
                                String(current?.selectedChoiceId ?? '') === String(choice.id)
                              }
                              onChange={() =>
                                setCurrent({ type: 'radio', selectedChoiceId: choice.id })
                              }
                              parentClassName={customObjectInputStyles.radioParentOverride}
                              onClick={() => {
                                if (String(current?.selectedChoiceId ?? '') === String(choice.id)) {
                                  setCurrent(undefined);
                                }
                              }}
                            />
                          ))}
                        </Flex>
                      )}

                      {item.inputType === 'checkbox' && (
                        <Flex direction='column' className={customObjectInputStyles.checkboxGroup}>
                          {(item.choices ?? []).map((choice) => {
                            const selected: number[] = current?.selectedChoiceIds ?? [];
                            const checked = selected.includes(choice.id);
                            return (
                              <AppCheckbox
                                key={choice.id}
                                label={choice.content}
                                checked={checked}
                                parentBoxClassName={customObjectInputStyles.checkboxParentOverride}
                                parentBoxCheckedClassName={
                                  customObjectInputStyles.checkboxParentCheckedOverride
                                }
                                checkboxClassName={customObjectInputStyles.checkboxRootOverride}
                                checkBoxCheckedClassName={
                                  customObjectInputStyles.checkboxRootCheckedOverride
                                }
                                checkedTextClassName={
                                  customObjectInputStyles.checkboxTextCheckedOverride
                                }
                                onChange={(isChecked) => {
                                  const base: number[] = current?.selectedChoiceIds ?? [];
                                  const next = isChecked
                                    ? Array.from(new Set([...base, choice.id]))
                                    : base.filter((id: number) => id !== choice.id);
                                  setCurrent({ type: 'checkbox', selectedChoiceIds: next });
                                }}
                              />
                            );
                          })}
                        </Flex>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        );
      })}

      <Box className={styles.formBox}>
        <Flex className={styles.buttonBox} direction='row' justify='center' align='center'>
          <Button className={styles.cancelButton} onClick={onCancel}>
            キャンセル
          </Button>
          <Button
            className={`${
              styles.submitButton
            } ${hasInvalidUrls || hasInvalidNumbers ? styles.disabledButton : ''}`}
            onClick={() => onSubmit(filterCondition)}
            disabled={hasInvalidUrls || hasInvalidNumbers}
          >
            絞り込む
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
};
