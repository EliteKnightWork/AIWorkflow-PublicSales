import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { TextField } from './';

const meta: Meta<typeof TextField> = {
  title: 'Shared/TextField',
  component: TextField,
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
    const input = await canvas.findByPlaceholderText(args.placeholder as string);

    // 入力可能
    await userEvent.type(input, 'テキスト入力');
    await expect(input).toHaveValue('テキスト入力');

    // 削除可能
    await userEvent.clear(input);
    await expect(input).toHaveValue('');
  },
};

export const WithDefaultValue: Story = {
  args: {
    placeholder: '入力してください',
    defaultValue: 'デフォルト値',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // デフォルト値確認
    const input = await canvas.findByDisplayValue(args.defaultValue as string);
    await expect(input).toHaveValue(args.defaultValue as string);

    // 変更可能
    const newText = '新しい値';
    await userEvent.clear(input);
    await userEvent.type(input, newText);
    await expect(input).toHaveValue(newText);
  },
};

export const Controlled: Story = {
  args: {
    placeholder: '入力してください',
  },
  render: (args) => {
    const [value, setValue] = useState('');
    return (
      <TextField
        {...args}
        value={value}
        onChange={(e) => setValue(e.currentTarget.value.toLocaleLowerCase())}
      />
    );
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByPlaceholderText(args.placeholder as string);
    await userEvent.type(input, 'ABCDE');
    await expect(input).toHaveValue('abcde');
  },
};

export const WithIcons: Story = {
  args: {
    placeholder: '検索ワードを入力',
    leftIcon: (
      <span className='material-icons' translate='no' aria-hidden='true'>
        search
      </span>
    ),
    rightIcon: (
      <span className='material-icons' translate='no' aria-hidden='true'>
        more_horiz
      </span>
    ),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // 存在確認
    const input = await canvas.findByPlaceholderText(args.placeholder as string);
    await expect(input).toBeVisible();
  },
};
