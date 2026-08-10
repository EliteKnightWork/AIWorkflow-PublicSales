'use client';

import { useGetCompanyMembers } from '@/api/generated/endpoints/companies';
import { useCreateCustomObjectTemplate } from '@/api/generated/endpoints/custom-object-templates';
import type { CustomObjectTemplateFormValue } from '@/app/(content)/_components/customObjectTemplateForm/CustomObjectTemplateForm';
import CustomObjectTemplateForm from '@/app/(content)/_components/customObjectTemplateForm/CustomObjectTemplateForm';
import { labelToInputType } from '@/app/(content)/_components/customObjectTemplateForm/typeLabelMapping';

type Props = {
  onSave: (title: string, items: CustomObjectTemplateFormValue['items']) => void;
  onCancel: () => void;
};

export function CreateCustomObjectModalContent({ onSave, onCancel }: Props) {
  const { data: companyMembersResponse } = useGetCompanyMembers();
  const companyMembers = companyMembersResponse?.members || [];

  const createTemplateMutation = useCreateCustomObjectTemplate();

  const handleSubmit = async ({ title, items }: CustomObjectTemplateFormValue) => {
    const customObjectTemplateItems = items.map((item, index) => {
      const inputType = labelToInputType(item.type);
      const base: any = {
        title: item.title,
        description: item.description,
        input_type: inputType,
        order: typeof item.order === 'number' ? item.order : index,
        custom_object_template_item_values: [] as any[],
      };

      if ((item.type === 'チェックボックス' || item.type === 'ラジオボタン') && item.options) {
        base.custom_object_template_item_values = item.options.map((option) => ({
          choice_content: option.choiceContent,
        }));
      }

      return base;
    });

    const createResponse = await createTemplateMutation.mutateAsync({
      data: {
        title,
        custom_object_template_items: customObjectTemplateItems,
      },
    });

    if (!createResponse?.id) {
      throw new Error('テンプレートIDが取得できませんでした');
    }

    onSave(title, items);
    onCancel();
  };

  return (
    <CustomObjectTemplateForm
      companyMembers={companyMembers}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    />
  );
}

export default CreateCustomObjectModalContent;
