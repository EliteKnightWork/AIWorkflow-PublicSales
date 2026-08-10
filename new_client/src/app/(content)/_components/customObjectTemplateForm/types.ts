import type { User } from '@/api/generated/models';

export type MemberSummary = { id: string; name: string };

export type CustomObjectTemplateOption = { id?: number; choiceContent: string };

export type DropdownOption = {
  value: string;
  label: string;
  icon?: string;
  iconVariant?: 'filled' | 'outlined';
  category?: string;
};

export type CustomObjectTemplateItem = {
  uiId: string;
  id?: number;
  title: string;
  description: string;
  type: string;
  required: boolean;
  options?: CustomObjectTemplateOption[];
  members?: MemberSummary[];
  order?: number;
};

export type CustomObjectTemplateFormValue = {
  title: string;
  items: CustomObjectTemplateItem[];
};

export type CustomObjectTemplateInitialValue = {
  title?: string;
  items?: Array<Partial<CustomObjectTemplateItem>>;
};

export type CustomObjectTemplateFormProps = {
  companyMembers: User[];
  onSubmit: (value: CustomObjectTemplateFormValue) => Promise<void> | void;
  onCancel: () => void;
  initialValue?: CustomObjectTemplateInitialValue;
  onDirtyChange?: (dirty: boolean) => void;
  submitButtonLabel?: string;
  cancelButtonLabel?: string;
  loadingText?: string;
};
