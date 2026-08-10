'use client';

import { DndContext, type DragEndEvent, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppInput from '@/components/appInput/AppInput';
import { CONFIRM_SAVE_WITH_DELETION_MESSAGE, dropdownOptions } from './constants';
import {
  addOptionToItem,
  appendEmptyItem,
  buildComparableSnapshot,
  cloneItems,
  findDeletedExistingItems,
  isFormValid,
  normalizeInitialItems,
  removeItemByUiId,
  removeOptionFromItem,
  reorderItemsByIds,
  selectItemType,
  updateItemDescription,
  updateItemTitle,
  updateOptionChoiceContent,
} from './function';
import styles from './styles.module.css';
import type {
  CustomObjectTemplateFormProps,
  CustomObjectTemplateFormValue,
  CustomObjectTemplateItem,
} from './types';

type DragHandleProps = { id: string };

function DragHandle({ id }: DragHandleProps) {
  const { attributes, listeners } = useSortable({ id });
  return (
    <Box
      className={styles.dragHandle}
      {...attributes}
      {...listeners}
      aria-label='ドラッグして並び替え'
    >
      <span className='material-icons' translate='no' aria-hidden='true'>
        drag_indicator
      </span>
    </Box>
  );
}

type SortableItemProps = {
  id: string;
  children: ReactNode;
};

function SortableItem({ id, children }: SortableItemProps) {
  const { setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const adjustedTransform = transform ? { ...transform, scaleX: 1, scaleY: 1 } : transform;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(adjustedTransform),
        transition,
        zIndex: isDragging ? 1000 : 'auto',
      }}
    >
      {children}
    </div>
  );
}

export function CustomObjectTemplateForm({
  companyMembers,
  onSubmit,
  onCancel,
  initialValue,
  onDirtyChange,
  submitButtonLabel = '保存する',
  cancelButtonLabel = 'キャンセル',
  loadingText = '保存中...',
}: CustomObjectTemplateFormProps) {
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 5 } }));
  const initialItemsRef = useRef<CustomObjectTemplateItem[]>(
    normalizeInitialItems(initialValue?.items)
  );
  const initialTitleRef = useRef(initialValue?.title ?? '');
  const [title, setTitle] = useState(initialTitleRef.current);
  const [items, setItems] = useState<CustomObjectTemplateItem[]>(initialItemsRef.current);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [pendingFocus, setPendingFocus] = useState<{ uiId: string; index: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const optionInputRefs = useRef<Record<string, Array<HTMLInputElement | null>>>({});
  const lastInitialValueRef = useRef<CustomObjectTemplateFormValue>({
    title: initialTitleRef.current,
    items: cloneItems(initialItemsRef.current),
  });
  const initialSnapshotRef = useRef<string>(buildComparableSnapshot(lastInitialValueRef.current));

  useEffect(() => {
    const nextItems = normalizeInitialItems(initialValue?.items);
    const nextValue: CustomObjectTemplateFormValue = {
      title: initialValue?.title ?? '',
      items: nextItems,
    };
    const nextSnapshot = buildComparableSnapshot(nextValue);
    if (nextSnapshot !== initialSnapshotRef.current) {
      initialItemsRef.current = nextItems;
      initialTitleRef.current = nextValue.title;
      initialSnapshotRef.current = nextSnapshot;
      lastInitialValueRef.current = {
        title: nextValue.title,
        items: cloneItems(nextItems),
      };
      setTitle(nextValue.title);
      setItems(nextItems);
    }
  }, [initialValue]);

  useEffect(() => {
    if (!pendingFocus) return;
    const input = optionInputRefs.current[pendingFocus.uiId]?.[pendingFocus.index] ?? null;
    if (input) {
      input.focus();
      setPendingFocus(null);
    }
  }, [pendingFocus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!openDropdownId) return;
      const dropdown = dropdownRefs.current[openDropdownId];
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  useEffect(() => {
    if (!onDirtyChange) return;
    const snapshot = buildComparableSnapshot({ title, items });
    onDirtyChange(snapshot !== initialSnapshotRef.current);
  }, [title, items, onDirtyChange]);

  const isValidForSave = useMemo(() => isFormValid(title, items), [title, items]);

  const handleAddItem = () => {
    setItems((prev) => appendEmptyItem(prev));
  };

  const handleRemoveItem = (uiId: string) => {
    setItems((prev) => removeItemByUiId(prev, uiId));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over) return;
    setItems((prev) => reorderItemsByIds(prev, String(active.id), String(over.id)));
  };

  const handleSelectType = (uiId: string, optionLabel: string) => {
    let focusIndex: number | undefined;
    setItems((prev) => {
      const result = selectItemType({
        items: prev,
        uiId,
        optionLabel,
        companyMembers,
      });
      focusIndex = result.focusIndex;
      return result.items;
    });
    if (focusIndex != null) {
      setPendingFocus({ uiId, index: focusIndex });
    }
    setOpenDropdownId(null);
  };

  const handleAddOption = (uiId: string) => {
    let focusIndex: number | undefined;
    setItems((prev) => {
      const result = addOptionToItem(prev, uiId);
      focusIndex = result.focusIndex;
      return result.items;
    });
    if (focusIndex != null) {
      setPendingFocus({ uiId, index: focusIndex });
    }
  };

  const handleUpdateOption = (uiId: string, optionIndex: number, value: string) => {
    setItems((prev) => updateOptionChoiceContent(prev, uiId, optionIndex, value));
  };

  const handleRemoveOption = (uiId: string, optionIndex: number) => {
    setItems((prev) => removeOptionFromItem(prev, uiId, optionIndex));
  };

  const resetForm = useCallback(() => {
    const base = lastInitialValueRef.current;
    setTitle(base.title);
    setItems(cloneItems(base.items));
    setIsSaving(false);
  }, []);

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  const handleSave = async () => {
    if (!isValidForSave || isSaving) return;

    const deletedExistingItems = findDeletedExistingItems(initialItemsRef.current, items);

    if (deletedExistingItems.length > 0) {
      const confirmed = window.confirm(CONFIRM_SAVE_WITH_DELETION_MESSAGE);
      if (!confirmed) return;
    }
    setIsSaving(true);
    const currentValue: CustomObjectTemplateFormValue = { title, items };
    try {
      await onSubmit(currentValue);
      const snapshot = buildComparableSnapshot(currentValue);
      initialSnapshotRef.current = snapshot;
      lastInitialValueRef.current = {
        title: currentValue.title,
        items: cloneItems(currentValue.items),
      };
      initialItemsRef.current = cloneItems(currentValue.items);
      initialTitleRef.current = currentValue.title;
      onDirtyChange?.(false);
    } catch (error) {
      console.error('カスタム項目の保存に失敗しました:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Box className={styles.modalContent}>
        <Flex direction='column' gap='4' className={styles.section}>
          <Text className={styles.label}>テンプレートタイトル</Text>
          <AppInput
            placeholder='入力してください'
            value={title}
            onChange={(value) => setTitle(value)}
            hideIcon
            buttonType='square'
            inputClassName={styles.titleInput}
            containerClassName={styles.inputContainerBorderless}
          />
        </Flex>

        <Box className={styles.divider} />

        <Flex direction='column' gap='4' className={styles.itemsSection}>
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((item) => item.uiId)}>
              {items.map((item) => (
                <SortableItem key={item.uiId} id={item.uiId}>
                  <Box className={styles.itemCard}>
                    <Flex className={styles.itemHeader}>
                      <Flex align='center' gap='1'>
                        <DragHandle id={item.uiId} />
                        <AppInput
                          value={item.title}
                          onChange={(value) => {
                            setItems((prev) => updateItemTitle(prev, item.uiId, value));
                          }}
                          hideIcon
                          buttonType='square'
                          placeholder='項目タイトル'
                          inputClassName={styles.itemTitleInput}
                        />
                      </Flex>
                    </Flex>

                    <AppInput
                      placeholder='説明文を入力する'
                      value={item.description}
                      onChange={(value) => {
                        setItems((prev) => updateItemDescription(prev, item.uiId, value));
                      }}
                      hideIcon
                      buttonType='square'
                      inputClassName={styles.descriptionInput}
                      containerClassName={styles.underlineContainer}
                    />

                    <Box
                      className={`${styles.selectWrapper} ${
                        openDropdownId === item.uiId ? styles.open : ''
                      }`}
                    >
                      <Box
                        ref={(el) => {
                          dropdownRefs.current[item.uiId] = el;
                        }}
                        className={styles.dropdownContainer}
                      >
                        <button
                          type='button'
                          onClick={() =>
                            setOpenDropdownId((prev) => (prev === item.uiId ? null : item.uiId))
                          }
                          className={styles.typeSelect}
                        >
                          {item.type}
                        </button>
                        <span className='material-icons' translate='no' aria-hidden='true'>
                          keyboard_arrow_down
                        </span>

                        {openDropdownId === item.uiId && (
                          <Box className={styles.dropdownMenu}>
                            <Box className={styles.dropdownHeader}>
                              <span>選択してください</span>
                              <button
                                type='button'
                                onClick={() => setOpenDropdownId(null)}
                                className={styles.dropdownClose}
                              >
                                <span className='material-icons' translate='no' aria-hidden='true'>
                                  close
                                </span>
                              </button>
                            </Box>
                            <Box className={styles.dropdownDivider} />

                            {dropdownOptions.map((option, optionIndex) => {
                              if (option.category) {
                                return (
                                  <Box key={`category-${option.category || optionIndex}`}>
                                    {optionIndex > 0 && <Box className={styles.dropdownDivider} />}
                                    <Box className={styles.dropdownCategory}>{option.category}</Box>
                                  </Box>
                                );
                              }
                              return (
                                <button
                                  key={option.value}
                                  type='button'
                                  onClick={() => handleSelectType(item.uiId, option.label)}
                                  className={styles.dropdownItem}
                                >
                                  {option.icon && (
                                    <span
                                      className={
                                        option.iconVariant === 'outlined'
                                          ? 'material-icons-outlined'
                                          : 'material-icons'
                                      }
                                      translate='no'
                                      aria-hidden='true'
                                    >
                                      {option.icon}
                                    </span>
                                  )}
                                  <span>{option.label}</span>
                                </button>
                              );
                            })}
                          </Box>
                        )}
                      </Box>
                    </Box>

                    {(item.type === 'チェックボックス' || item.type === 'ラジオボタン') &&
                      item.options && (
                        <Box className={styles.optionsSection}>
                          {item.options.map((option, optionIndex) => (
                            <Flex
                              key={`${item.uiId}-option-${optionIndex}`}
                              className={styles.optionItem}
                            >
                              <span className='material-icons' translate='no' aria-hidden='true'>
                                {item.type === 'チェックボックス'
                                  ? 'check_box_outline_blank'
                                  : 'radio_button_unchecked'}
                              </span>
                              <input
                                type='text'
                                value={option.choiceContent}
                                onChange={(event) =>
                                  handleUpdateOption(
                                    item.uiId,
                                    optionIndex,
                                    event.currentTarget.value
                                  )
                                }
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    const isComposing = (event.nativeEvent as any)?.isComposing;
                                    if (isComposing) return;
                                    event.preventDefault();
                                    const hasEmpty = (item.options ?? []).some(
                                      (opt) => !(opt.choiceContent || '').trim()
                                    );
                                    if (!hasEmpty) {
                                      handleAddOption(item.uiId);
                                    }
                                  }
                                }}
                                placeholder='選択肢を入力する'
                                className={styles.optionInput}
                                ref={(el) => {
                                  if (!optionInputRefs.current[item.uiId]) {
                                    optionInputRefs.current[item.uiId] = [];
                                  }
                                  optionInputRefs.current[item.uiId][optionIndex] = el;
                                }}
                              />
                              <button
                                type='button'
                                onClick={() => handleRemoveOption(item.uiId, optionIndex)}
                                className={styles.optionRemoveButton}
                              >
                                <span className='material-icons' translate='no' aria-hidden='true'>
                                  close
                                </span>
                              </button>
                            </Flex>
                          ))}
                          <Button
                            variant='ghost'
                            onClick={() => handleAddOption(item.uiId)}
                            className={styles.addOptionButton}
                          >
                            <span className='material-icons' translate='no' aria-hidden='true'>
                              add
                            </span>
                            <Text className={styles.addOptionText}>選択肢を追加する</Text>
                          </Button>
                        </Box>
                      )}

                    {item.type === '担当者' && item.members && (
                      <Box className={styles.membersSection}>
                        {item.members.slice(0, 5).map((member) => (
                          <Box key={member.id} className={styles.memberItem}>
                            <Box className={styles.memberTag}>
                              <span className='material-icons' translate='no' aria-hidden='true'>
                                account_circle
                              </span>
                              <Text className={styles.memberName}>{member.name}</Text>
                            </Box>
                          </Box>
                        ))}
                        {item.members.length > 5 && (
                          <Text className={styles.moreMembersText}>
                            他{item.members.length - 5}名のメンバー
                          </Text>
                        )}
                      </Box>
                    )}

                    <Button
                      variant='ghost'
                      onClick={() => handleRemoveItem(item.uiId)}
                      className={styles.deleteButton}
                    >
                      <span className='material-icons' translate='no' aria-hidden='true'>
                        delete
                      </span>
                      <Text className={styles.deleteText}>削除する</Text>
                    </Button>
                  </Box>
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>

          <Button variant='soft' onClick={handleAddItem} className={styles.addButton}>
            <span className='material-icons' translate='no' aria-hidden='true'>
              add
            </span>
            <Text className={styles.addText}>項目を追加する</Text>
          </Button>
        </Flex>
      </Box>

      <Flex className={styles.footerButtons} justify='center' align='center' gap='3'>
        <Button variant='outline' onClick={handleCancel} className={styles.cancelButton}>
          {cancelButtonLabel}
        </Button>
        <Button
          onClick={handleSave}
          className={styles.saveButton}
          disabled={!isValidForSave || isSaving}
        >
          {isSaving ? loadingText : submitButtonLabel}
        </Button>
      </Flex>
    </>
  );
}

export default CustomObjectTemplateForm;

export type {
  CustomObjectTemplateFormProps,
  CustomObjectTemplateFormValue,
  CustomObjectTemplateInitialValue,
  CustomObjectTemplateItem,
} from './types';
