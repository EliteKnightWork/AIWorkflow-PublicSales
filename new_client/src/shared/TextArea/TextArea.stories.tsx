import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { TextArea } from './';

const meta: Meta<typeof TextArea> = {
  title: 'Shared/TextArea',
  component: TextArea,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => {
      return (
        <div style={{ width: '600px' }}>
          <Story />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    placeholder: '入力してください',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // 存在確認
    const textarea = await canvas.findByPlaceholderText(args.placeholder as string);

    // 入力可能
    await userEvent.type(textarea, 'テキスト入力\n複数行の入力');
    await expect(textarea).toHaveValue('テキスト入力\n複数行の入力');

    // 削除可能
    await userEvent.clear(textarea);
    await expect(textarea).toHaveValue('');
  },
};

export const WithDefaultValue: Story = {
  args: {
    placeholder: '入力してください',
    defaultValue: 'デフォルト値\n複数行のテキスト',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // デフォルト値確認
    const textarea = await canvas.findByPlaceholderText(args.placeholder as string);
    await expect(textarea).toHaveValue(args.defaultValue as string);

    // 変更可能
    const newText = '新しい値\n複数行';
    await userEvent.clear(textarea);
    await userEvent.type(textarea, newText);
    await expect(textarea).toHaveValue(newText);
  },
};

export const Controlled: Story = {
  args: {
    placeholder: '入力してください',
  },
  render: (args) => {
    const [value, setValue] = useState('');
    return (
      <TextArea
        {...args}
        value={value}
        onChange={(e) => setValue(e.currentTarget.value.toLocaleLowerCase())}
      />
    );
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const textarea = await canvas.findByPlaceholderText(args.placeholder as string);
    await userEvent.type(textarea, 'ABCDE');
    await expect(textarea).toHaveValue('abcde');
  },
};

export const WithRows: Story = {
  args: {
    placeholder: '複数行の入力',
    rows: 5,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // 存在確認
    const textarea = await canvas.findByPlaceholderText(args.placeholder as string);
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveAttribute('rows', '5');
  },
};
