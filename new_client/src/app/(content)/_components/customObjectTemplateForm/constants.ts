import type { DropdownOption } from './types';

export const dropdownOptions: DropdownOption[] = [
  { category: 'カスタム', value: '', label: '' },
  { value: 'checkbox', label: 'チェックボックス', icon: 'check_box' },
  { value: 'radio', label: 'ラジオボタン', icon: 'radio_button_checked' },
  { category: 'データ連携', value: '', label: '' },
  { value: 'person', label: '担当者', icon: 'account_circle' },
  { category: 'その他', value: '', label: '' },
  { value: 'free_text', label: 'フリーテキスト(改行なし)', icon: 'edit' },
  { value: 'free_text_multiline', label: 'フリーテキスト(改行あり)', icon: 'notes' },
  { value: 'number', label: '数値', icon: 'pin', iconVariant: 'outlined' },
  { value: 'calendar', label: 'カレンダー', icon: 'calendar_today' },
  { value: 'url', label: 'URL', icon: 'link' },
];

export const CONFIRM_SAVE_WITH_DELETION_MESSAGE =
  '編集内容に項目の削除が含まれています。該当の項目を利用中の案件がある場合、編集内容を保存するとそれらのデータも同時に削除されます。編集を保存してもよろしいですか？';
