'use client';

import { Box, Flex, Text } from '@radix-ui/themes';
import { useQueryClient } from '@tanstack/react-query';
import { ja } from 'date-fns/locale';
import { useState } from 'react';
import { registerLocale } from 'react-datepicker';
import {
  getGetBidPipelineCustomObjectsQueryKey,
  useGetBidPipelineCustomObjects,
} from '@/api/generated/endpoints/bid-pipelines';
import { useGetCompanyMembers } from '@/api/generated/endpoints/companies';
import { useUpdateCustomObjectItems } from '@/api/generated/endpoints/custom-object-items';
import type {
  CustomObject,
  CustomObjectItem,
  UpdateCustomObjectItemsBody,
} from '@/api/generated/models';
import AppTooltip from '@/app/_components/tooltip/AppTooltip';
import {
  CustomObjectCalendarField,
  CustomObjectCheckboxGroup,
  CustomObjectFreeTextField,
  CustomObjectFreeTextMultilineField,
  CustomObjectNumberField,
  CustomObjectPersonSelect,
  CustomObjectRadioGroup,
  CustomObjectUrlField,
} from '@/app/(content)/_components/customObjectInputs';
import styles from './styles.module.css';

type Props = {
  pipelineId?: number;
};

export default function CustomObjectSection({ pipelineId }: Props) {
  registerLocale('ja', ja as any);
  const { data: companyMembersRes } = useGetCompanyMembers({});
  const companyMembers = companyMembersRes?.members ?? [];
  const {
    data: customObjects,
    isLoading,
    error,
  } = useGetBidPipelineCustomObjects(pipelineId || 0, {
    query: {
      enabled: !!pipelineId,
    },
  });

  const { mutate: mutateUpdateCustomObjectItems } = useUpdateCustomObjectItems();
  const queryClient = useQueryClient();

  const [expandedObjects, setExpandedObjects] = useState<Set<number>>(new Set());
  const [calendarValues, setCalendarValues] = useState<Record<number, Date | undefined>>({});
  const [personValues, setPersonValues] = useState<Record<number, string | undefined>>({});
  const [checkboxValues, setCheckboxValues] = useState<Record<number, boolean>>({});
  const [radioValues, setRadioValues] = useState<Record<string, string | undefined>>({});
  const [invalidUrlMap, setInvalidUrlMap] = useState<Record<number, boolean>>({});
  const [invalidNumberMap, setInvalidNumberMap] = useState<Record<number, boolean>>({});

  const isValidHttpUrl = (value: string): boolean => {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_e) {
      return false;
    }
  };

  const renderLabel = (title: string, description?: string | null) => (
    <Box className={styles.formLabelContainer}>
      <Box className={styles.formLabel}>{title}</Box>
      {description ? (
        <AppTooltip
          triggerChildren={
            <span className={`material-icons ${styles.tooltipIcon}`}>help_outline</span>
          }
          content={
            <Box className={styles.tooltip}>
              <Text>{description}</Text>
            </Box>
          }
        />
      ) : null}
    </Box>
  );

  const toggleObjectExpansion = (objectId: number) => {
    setExpandedObjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(objectId)) {
        newSet.delete(objectId);
      } else {
        newSet.add(objectId);
      }
      return newSet;
    });
  };

  const getTemplateItemValueId = (item: CustomObjectItem) =>
    (item as unknown as { customObjectTemplateItemValueId?: number })
      .customObjectTemplateItemValueId as number | undefined;

  const buildAndSendUpdate = (
    customObjectId: number,
    payloadItems: UpdateCustomObjectItemsBody['custom_object_items']
  ) => {
    if (!payloadItems || payloadItems.length === 0) return;
    const data: UpdateCustomObjectItemsBody = { custom_object_items: payloadItems };
    mutateUpdateCustomObjectItems(
      { customObjectId, data },
      {
        onSuccess: () => {
          if (pipelineId) {
            queryClient.invalidateQueries({
              queryKey: getGetBidPipelineCustomObjectsQueryKey(pipelineId),
            });
          }
        },
      }
    );
  };

  const renderFormItem = (customObjectId: number, items: CustomObjectItem[]) => {
    if (items.length === 0) return null;

    // 最初のアイテムからメタデータを取得（同じIDのアイテムは同じメタデータを持つはず）
    const { inputType, title } = items[0];

    switch (inputType) {
      case 'free_text':
        return (
          <CustomObjectFreeTextField
            items={items}
            label={renderLabel(title, items[0]?.description)}
            customObjectId={customObjectId}
            getTemplateItemValueId={getTemplateItemValueId}
            buildAndSendUpdate={buildAndSendUpdate}
          />
        );

      case 'free_text_multiline':
        return (
          <CustomObjectFreeTextMultilineField
            items={items}
            label={renderLabel(title, items[0]?.description)}
            customObjectId={customObjectId}
            getTemplateItemValueId={getTemplateItemValueId}
            buildAndSendUpdate={buildAndSendUpdate}
          />
        );

      case 'checkbox':
        return (
          <CustomObjectCheckboxGroup
            items={items}
            label={renderLabel(title, items[0]?.description)}
            customObjectId={customObjectId}
            checkboxValues={checkboxValues}
            setCheckboxValues={setCheckboxValues}
            getTemplateItemValueId={getTemplateItemValueId}
            buildAndSendUpdate={buildAndSendUpdate}
          />
        );

      case 'radio':
        return (
          <CustomObjectRadioGroup
            items={items}
            label={renderLabel(title, items[0]?.description)}
            customObjectId={customObjectId}
            radioValues={radioValues}
            setRadioValues={setRadioValues}
            getTemplateItemValueId={getTemplateItemValueId}
            buildAndSendUpdate={buildAndSendUpdate}
          />
        );

      case 'person':
        return (
          <CustomObjectPersonSelect
            items={items}
            label={renderLabel(title, items[0]?.description)}
            customObjectId={customObjectId}
            companyMembers={companyMembers}
            personValues={personValues}
            setPersonValues={setPersonValues}
            getTemplateItemValueId={getTemplateItemValueId}
            buildAndSendUpdate={buildAndSendUpdate}
          />
        );

      case 'calendar':
        return (
          <CustomObjectCalendarField
            items={items}
            label={renderLabel(title, items[0]?.description)}
            customObjectId={customObjectId}
            calendarValues={calendarValues}
            setCalendarValues={setCalendarValues}
            getTemplateItemValueId={getTemplateItemValueId}
            buildAndSendUpdate={buildAndSendUpdate}
          />
        );

      case 'number':
        return (
          <CustomObjectNumberField
            items={items}
            label={renderLabel(title, items[0]?.description)}
            customObjectId={customObjectId}
            getTemplateItemValueId={getTemplateItemValueId}
            buildAndSendUpdate={buildAndSendUpdate}
            invalidNumberMap={invalidNumberMap}
            setInvalidNumberMap={setInvalidNumberMap}
          />
        );

      case 'url':
        return (
          <CustomObjectUrlField
            items={items}
            label={renderLabel(title, items[0]?.description)}
            customObjectId={customObjectId}
            invalidUrlMap={invalidUrlMap}
            setInvalidUrlMap={setInvalidUrlMap}
            isValidHttpUrl={isValidHttpUrl}
            getTemplateItemValueId={getTemplateItemValueId}
            buildAndSendUpdate={buildAndSendUpdate}
          />
        );

      default:
        return null;
    }
  };

  if (!pipelineId) {
    return null;
  }

  if (isLoading) {
    return (
      <Flex direction='column' gap='4'>
        <Box className={styles.sectionTitle}>カスタム項目</Box>
        <Box className={styles.loadingText}>読み込み中...</Box>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex direction='column' gap='4'>
        <Box className={styles.sectionTitle}>カスタム項目</Box>
        <Box className={styles.errorText}>カスタム項目の読み込みに失敗しました</Box>
      </Flex>
    );
  }

  if (!customObjects || customObjects.length === 0) {
    return (
      <Flex direction='column' gap='4'>
        <Box className={styles.sectionTitle}>カスタム項目</Box>
        <Box className={styles.customObjectContainer}>
          <Box className={styles.emptyText}>
            カスタム項目がみつかりませんでした😞
            <br />
            設定 ＞ カスタム項目からカスタム項目を追加してみませんか？
          </Box>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex direction='column' gap='4'>
      <Box className={styles.sectionTitle}>カスタム項目</Box>
      <Box className={styles.customObjectList}>
        {(customObjects ?? []).map((customObject: CustomObject) => {
          const isExpanded = expandedObjects.has(customObject.id);
          return (
            <Box key={customObject.id} className={styles.customObjectContainer}>
              <button
                type='button'
                className={`${styles.customObjectTrigger} ${isExpanded ? styles.expandedCustomObjectTrigger : ''}`}
                onClick={() => toggleObjectExpansion(customObject.id)}
              >
                <Flex justify='between' align='center' width='100%'>
                  <Box className={styles.customObjectTitle}>{customObject.title}</Box>
                  <span
                    className='material-icons'
                    style={{
                      color: '#868a94',
                      fontSize: '24px',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    keyboard_arrow_down
                  </span>
                </Flex>
              </button>
              {isExpanded && (
                <Box className={styles.customObjectContent}>
                  {customObject.customObjectItems &&
                    customObject.customObjectItems.length > 0 &&
                    (() => {
                      // custom_object_itemsをcustomObjectTemplateItemIdでグループ化
                      const groupedItems = customObject.customObjectItems.reduce(
                        (acc, item) => {
                          const key = (item as any).customObjectTemplateItemId as number;
                          if (!acc[key]) {
                            acc[key] = [];
                          }
                          acc[key].push(item);
                          return acc;
                        },
                        {} as Record<number, CustomObjectItem[]>
                      );

                      // グループ化されたアイテムを order でソートして表示
                      const sortedGroups = Object.entries(groupedItems).sort((a, b) => {
                        const aOrder = (a[1][0] as any)?.order ?? Number.MAX_SAFE_INTEGER;
                        const bOrder = (b[1][0] as any)?.order ?? Number.MAX_SAFE_INTEGER;
                        return aOrder - bOrder;
                      });
                      return sortedGroups.map(([templateItemId, items]) => (
                        <Box key={templateItemId}>{renderFormItem(customObject.id, items)}</Box>
                      ));
                    })()}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Flex>
  );
}
