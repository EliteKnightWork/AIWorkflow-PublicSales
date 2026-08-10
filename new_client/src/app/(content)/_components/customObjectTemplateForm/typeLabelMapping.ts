const inputTypeToLabelMap: Record<string, string> = {
  checkbox: 'チェックボックス',
  radio: 'ラジオボタン',
  person: '担当者',
  free_text: 'フリーテキスト(改行なし)',
  free_text_multiline: 'フリーテキスト(改行あり)',
  calendar: 'カレンダー',
  url: 'URL',
  number: '数値',
};

const labelToInputTypeMap: Record<string, string> = Object.fromEntries(
  Object.entries(inputTypeToLabelMap).map(([inputType, label]) => [label, inputType])
);

export const inputTypeToLabel = (inputType: string): string => {
  return inputTypeToLabelMap[inputType] ?? inputType;
};

export const labelToInputType = (label: string): string => {
  return labelToInputTypeMap[label] ?? label;
};
