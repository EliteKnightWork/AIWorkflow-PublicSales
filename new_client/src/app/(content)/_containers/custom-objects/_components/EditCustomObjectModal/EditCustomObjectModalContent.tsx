'use client';

import { Box, Text } from '@radix-ui/themes';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useGetCompanyMembers } from '@/api/generated/endpoints/companies';
import {
  getGetCustomObjectTemplateQueryKey,
  getGetCustomObjectTemplatesQueryKey,
  useGetCustomObjectTemplate,
  useUpdateCustomObjectTemplate,
} from '@/api/generated/endpoints/custom-object-templates';
import type {
  CustomObjectTemplateFormValue,
  CustomObjectTemplateInitialValue,
} from '@/app/(content)/_components/customObjectTemplateForm/CustomObjectTemplateForm';
import CustomObjectTemplateForm from '@/app/(content)/_components/customObjectTemplateForm/CustomObjectTemplateForm';
import styles from '@/app/(content)/_components/customObjectTemplateForm/styles.module.css';
import {
  inputTypeToLabel,
  labelToInputType,
} from '@/app/(content)/_components/customObjectTemplateForm/typeLabelMapping';

type Props = {
  templateId: number;
  onSaved: () => void;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
};

export function EditCustomObjectModalContent({
  templateId,
  onSaved,
  onCancel,
  onDirtyChange,
}: Props) {
  const { data: companyMembersResponse } = useGetCompanyMembers();
  const companyMembers = companyMembersResponse?.members || [];

  const { data: templateDetail, isLoading } = useGetCustomObjectTemplate(templateId);
  const updateTemplateMutation = useUpdateCustomObjectTemplate();
  const queryClient = useQueryClient();

  const initialValue = useMemo<CustomObjectTemplateInitialValue | undefined>(() => {
    if (!templateDetail) return undefined;
    return {
      title: templateDetail.title ?? '',
      items: (templateDetail.customObjectTemplateItems || []).map((item, index) => ({
        uiId: item.id ? String(item.id) : `item-${index}`,
        id: item.id,
        title: item.title ?? '',
        description: item.description ?? '',
        type: inputTypeToLabel((item.inputType ?? '') as string),
        options: (item.customObjectTemplateItemValues || []).map((value) => ({
          id: value.id,
          choiceContent: value.choiceContent ?? '',
        })),
        order: (item as any).order ?? index,
      })),
    };
  }, [templateDetail]);

  const handleSubmit = async ({ title, items }: CustomObjectTemplateFormValue) => {
    const payloadItems = items.map((item, index) => {
      const inputType = labelToInputType(item.type);
      const base: any = {
        title: item.title,
        description: item.description,
        input_type: inputType,
        is_required: item.required,
        order: typeof item.order === 'number' ? item.order : index,
        custom_object_template_item_values: [] as any[],
      };
      if (item.id) base.id = item.id;
      if ((item.type === 'チェックボックス' || item.type === 'ラジオボタン') && item.options) {
        base.custom_object_template_item_values = item.options.map((option) => ({
          ...(option.id ? { id: option.id } : {}),
          choice_content: (option.choiceContent ?? '').trim(),
        }));
      }
      return base;
    });

    const updatedTemplate = await updateTemplateMutation.mutateAsync({
      id: templateId,
      data: {
        title,
        custom_object_template_items: payloadItems,
      },
    });

    queryClient.setQueryData(getGetCustomObjectTemplateQueryKey(templateId), updatedTemplate);
    queryClient.invalidateQueries({ queryKey: getGetCustomObjectTemplatesQueryKey() });

    onSaved();
  };

  if (isLoading || !templateDetail || !initialValue) {
    return (
      <Box className={styles.modalContent}>
        <Text>読み込み中...</Text>
      </Box>
    );
  }

  return (
    <CustomObjectTemplateForm
      companyMembers={companyMembers}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      initialValue={initialValue}
      onDirtyChange={onDirtyChange}
    />
  );
}

export default EditCustomObjectModalContent;
