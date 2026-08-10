import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { DateRangePicker } from './';

const meta: Meta<typeof DateRangePicker> = {
  title: 'Shared/DateRangePicker',
  component: DateRangePicker,
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
    placeholder: '選択してください',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // 開始日の入力フィールドが存在することを確認
    const startInputs = canvas.getAllByPlaceholderText(args.placeholder as string);
    await expect(startInputs[0]).toBeVisible();
    await expect(startInputs[1]).toBeVisible();
  },
};

export const WithDefaultValues: Story = {
  args: {
    placeholder: '選択してください',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // デフォルト値が設定されていることを確認
    const inputs = canvas.getAllByRole('textbox');
    await expect(inputs[0]).toHaveValue('2024/01/01');
    await expect(inputs[1]).toHaveValue('2024/01/31');
  },
};

export const Controlled: Story = {
  args: {
    placeholder: '選択してください',
  },
  render: (args) => {
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    return (
      <DateRangePicker
        {...args}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />
    );
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const inputs = canvas.getAllByPlaceholderText(args.placeholder as string);

    // 開始日をクリック
    await userEvent.click(inputs[0]);

    // カレンダーが表示されることを確認（日付を選択できる状態）
    const calendar = await canvas.findByRole('table');
    await expect(calendar).toBeVisible();
  },
};

export const Disabled: Story = {
  args: {
    placeholder: '選択してください',
    disabled: true,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const inputs = canvas.getAllByRole('textbox');

    // 無効化されていることを確認
    await expect(inputs[0]).toBeDisabled();
    await expect(inputs[1]).toBeDisabled();
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
    const inputs = canvas.getAllByPlaceholderText(args.placeholder as string);

    // 開始日をクリック
    await userEvent.click(inputs[0]);

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
    const inputs = canvas.getAllByPlaceholderText(args.placeholder as string);

    // 開始日をクリック
    await userEvent.click(inputs[0]);

    // カレンダーが表示されることを確認
    const calendar = await canvas.findByRole('table');
    await expect(calendar).toBeVisible();
  },
};
