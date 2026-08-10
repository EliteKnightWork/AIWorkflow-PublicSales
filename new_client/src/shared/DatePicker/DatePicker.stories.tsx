import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { DatePicker } from './';

const meta: Meta<typeof DatePicker> = {
  title: 'Shared/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => {
      return (
        <div style={{ width: '300px' }}>
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
    placeholder: '選択してください',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // 入力フィールドが存在することを確認
    const input = canvas.getByPlaceholderText(args.placeholder as string);
    await expect(input).toBeVisible();
  },
};

export const WithDefaultValue: Story = {
  args: {
    placeholder: '選択してください',
    selected: new Date('2024-01-01'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // デフォルト値が設定されていることを確認
    const input = canvas.getByRole('textbox');
    await expect(input).toHaveValue('2024/01/01');
  },
};

export const Controlled: Story = {
  args: {
    placeholder: '選択してください',
  },
  render: (args) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    return <DatePicker {...args} selected={selectedDate} onChange={setSelectedDate} />;
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText(args.placeholder as string);

    // 入力フィールドをクリック
    await userEvent.click(input);

    // カレンダーが表示されることを確認（日付を選択できる状態）
    const calendar = await canvas.findByRole('table');
    await expect(calendar).toBeVisible();
  },
};

export const Disabled: Story = {
  args: {
    placeholder: '選択してください',
    disabled: true,
    selected: new Date('2024-01-01'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');

    // 無効化されていることを確認
    await expect(input).toBeDisabled();
  },
};

export const WithMinMaxDate: Story = {
  args: {
    placeholder: '選択してください',
    minDate: new Date('2024-01-01'),
    maxDate: new Date('2024-12-31'),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText(args.placeholder as string);

    // 入力フィールドをクリック
    await userEvent.click(input);

    // カレンダーが表示されることを確認
    const calendar = await canvas.findByRole('table');
    await expect(calendar).toBeVisible();
  },
};

export const WithOnChange: Story = {
  args: {
    placeholder: '選択してください',
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText(args.placeholder as string);

    // 入力フィールドをクリック
    await userEvent.click(input);

    // カレンダーが表示されることを確認
    const calendar = await canvas.findByRole('table');
    await expect(calendar).toBeVisible();
  },
};
