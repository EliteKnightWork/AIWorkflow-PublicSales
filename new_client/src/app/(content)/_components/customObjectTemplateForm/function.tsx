import type { User } from '@/api/generated/models';
import type {
  CustomObjectTemplateFormValue,
  CustomObjectTemplateInitialValue,
  CustomObjectTemplateItem,
} from './types';

const DEFAULT_SELECT_LABEL = '選択してください';
const OPTION_REQUIRED_LABELS = new Set(['チェックボックス', 'ラジオボタン']);

export const createUiId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const createEmptyItem = (): CustomObjectTemplateItem => ({
  uiId: createUiId(),
  title: '',
  description: '',
  type: DEFAULT_SELECT_LABEL,
  required: false,
  options: [],
});

export const normalizeInitialItems = (
  rawItems: CustomObjectTemplateInitialValue['items']
): CustomObjectTemplateItem[] => {
  if (!rawItems || rawItems.length === 0) {
    return [createEmptyItem()];
  }

  return rawItems.map((item) => ({
    uiId: item.uiId ?? createUiId(),
    id: item.id,
    title: item.title ?? '',
    description: item.description ?? '',
    type: item.type ?? DEFAULT_SELECT_LABEL,
    required: item.required ?? false,
    options:
      item.options?.map((opt) => ({ id: opt.id, choiceContent: opt.choiceContent ?? '' })) ?? [],
    members: item.members,
    order: item.order,
  }));
};

export const cloneItems = (items: CustomObjectTemplateItem[]): CustomObjectTemplateItem[] =>
  items.map((item) => ({
    ...item,
    options: item.options ? item.options.map((opt) => ({ ...opt })) : undefined,
    members: item.members ? item.members.map((member) => ({ ...member })) : undefined,
  }));

export const buildComparableSnapshot = ({ title, items }: CustomObjectTemplateFormValue) => {
  return JSON.stringify({
    title: (title || '').trim(),
    items: (items || []).map((item, idx) => ({
      id: item.id ?? null,
      title: (item.title || '').trim(),
      description: (item.description || '').trim(),
      required: !!item.required,
      type: item.type || '',
      order: typeof item.order === 'number' ? item.order : idx,
      options: (item.options || []).map((opt) => ({
        id: opt.id ?? null,
        choiceContent: (opt.choiceContent || '').trim(),
      })),
    })),
  });
};

const updateItem = (
  items: CustomObjectTemplateItem[],
  uiId: string,
  updater: (item: CustomObjectTemplateItem) => CustomObjectTemplateItem
): CustomObjectTemplateItem[] => items.map((item) => (item.uiId === uiId ? updater(item) : item));

export const appendEmptyItem = (items: CustomObjectTemplateItem[]): CustomObjectTemplateItem[] => [
  ...items,
  createEmptyItem(),
];

export const removeItemByUiId = (
  items: CustomObjectTemplateItem[],
  uiId: string
): CustomObjectTemplateItem[] => items.filter((item) => item.uiId !== uiId);

export const reorderItemsByIds = (
  items: CustomObjectTemplateItem[],
  activeId: string,
  overId: string
): CustomObjectTemplateItem[] => {
  if (activeId === overId) return items;
  const oldIndex = items.findIndex((item) => item.uiId === activeId);
  const newIndex = items.findIndex((item) => item.uiId === overId);
  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
    return items;
  }
  const next = items.slice();
  const [moved] = next.splice(oldIndex, 1);
  next.splice(newIndex, 0, moved);
  return next.map((item, idx) => ({ ...item, order: idx }));
};

export const updateItemTitle = (
  items: CustomObjectTemplateItem[],
  uiId: string,
  value: string
): CustomObjectTemplateItem[] => updateItem(items, uiId, (item) => ({ ...item, title: value }));

export const updateItemDescription = (
  items: CustomObjectTemplateItem[],
  uiId: string,
  value: string
): CustomObjectTemplateItem[] =>
  updateItem(items, uiId, (item) => ({ ...item, description: value }));

export const selectItemType = ({
  items,
  uiId,
  optionLabel,
  companyMembers,
}: {
  items: CustomObjectTemplateItem[];
  uiId: string;
  optionLabel: string;
  companyMembers: User[];
}): { items: CustomObjectTemplateItem[]; focusIndex?: number } => {
  let focusIndex: number | undefined;
  const nextItems = updateItem(items, uiId, (current) => {
    const updated: CustomObjectTemplateItem = { ...current, type: optionLabel };
    if (OPTION_REQUIRED_LABELS.has(optionLabel)) {
      if (!current.options || current.options.length === 0) {
        updated.options = [{ choiceContent: '' }];
        focusIndex = 0;
      }
    }
    if (optionLabel === '担当者' && (!current.members || current.members.length === 0)) {
      updated.members = companyMembers.map((member) => ({
        id: member.id?.toString() || '0',
        name: member.name || '名前未設定',
      }));
    }
    return updated;
  });

  return { items: nextItems, focusIndex };
};

export const addOptionToItem = (
  items: CustomObjectTemplateItem[],
  uiId: string
): { items: CustomObjectTemplateItem[]; focusIndex: number } => {
  let nextIndex = 0;
  const nextItems = updateItem(items, uiId, (item) => {
    const opts = item.options ?? [];
    nextIndex = opts.length;
    return { ...item, options: [...opts, { choiceContent: '' }] };
  });
  return { items: nextItems, focusIndex: nextIndex };
};

export const updateOptionChoiceContent = (
  items: CustomObjectTemplateItem[],
  uiId: string,
  optionIndex: number,
  value: string
): CustomObjectTemplateItem[] =>
  updateItem(items, uiId, (item) => {
    const opts = (item.options ?? []).slice();
    opts[optionIndex] = { ...(opts[optionIndex] ?? {}), choiceContent: value };
    return { ...item, options: opts };
  });

export const removeOptionFromItem = (
  items: CustomObjectTemplateItem[],
  uiId: string,
  optionIndex: number
): CustomObjectTemplateItem[] =>
  updateItem(items, uiId, (item) => {
    const opts = (item.options ?? []).filter((_, idx) => idx !== optionIndex);
    return { ...item, options: opts };
  });

export const isFormValid = (title: string, items: CustomObjectTemplateItem[]): boolean => {
  if (!title.trim()) return false;
  if (items.length === 0) return false;
  for (const item of items) {
    if (!item.title.trim() || item.title === '項目タイトル') return false;
    if (!item.type || item.type === DEFAULT_SELECT_LABEL) return false;
    if (OPTION_REQUIRED_LABELS.has(item.type) && item.options) {
      if (item.options.length === 0) return false;
      for (const opt of item.options) {
        if (!(opt.choiceContent ?? '').trim()) return false;
      }
    }
  }
  return true;
};

export const findDeletedExistingItems = (
  initialItems: CustomObjectTemplateItem[],
  currentItems: CustomObjectTemplateItem[]
): CustomObjectTemplateItem[] =>
  initialItems.filter(
    (initialItem) =>
      initialItem.id != null &&
      !currentItems.some((currentItem) => currentItem.id === initialItem.id)
  );
