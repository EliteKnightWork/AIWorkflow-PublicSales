import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import Select, { SelectGroup, SelectItem, SelectItemText, SelectLabel } from './Select';

const meta: Meta<typeof Select> = {
  title: 'Shared/Select',
  component: Select,
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
    placeholder: '未選択',
  },
  render: (args) => (
    <Select {...args}>
      <SelectGroup>
        <SelectItem value='option1'>
          <SelectItemText>オプション1</SelectItemText>
        </SelectItem>
        <SelectItem value='option2'>
          <SelectItemText>オプション2</SelectItemText>
        </SelectItem>
        <SelectItem value='option3'>
          <SelectItemText>オプション3</SelectItemText>
        </SelectItem>
      </SelectGroup>
    </Select>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole('combobox');
    await expect(trigger).toBeVisible();
    await userEvent.click(trigger);

    const body = within(document.body);
    await body.findByText('オプション1');
  },
};

export const WithDefaultValue: Story = {
  args: {
    placeholder: '未選択',
    defaultValue: 'option2',
  },
  render: (args) => (
    <Select {...args}>
      <SelectGroup>
        <SelectItem value='option1'>
          <SelectItemText>オプション1</SelectItemText>
        </SelectItem>
        <SelectItem value='option2'>
          <SelectItemText>オプション2</SelectItemText>
        </SelectItem>
        <SelectItem value='option3'>
          <SelectItemText>オプション3</SelectItemText>
        </SelectItem>
      </SelectGroup>
    </Select>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole('combobox');
    await expect(trigger).toHaveTextContent('オプション2');
  },
};

export const Controlled: Story = {
  args: {
    placeholder: '未選択',
  },
  render: (args) => {
    const [value, setValue] = useState<string>('');
    return (
      <Select {...args} value={value} onChange={(value) => setValue(value)}>
        <SelectGroup>
          <SelectItem value='option1'>
            <SelectItemText>オプション1</SelectItemText>
          </SelectItem>
          <SelectItem value='option2'>
            <SelectItemText>オプション2</SelectItemText>
          </SelectItem>
          <SelectItem value='option3'>
            <SelectItemText>オプション3</SelectItemText>
          </SelectItem>
        </SelectGroup>
      </Select>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole('combobox');
    await userEvent.click(trigger);
    const body = within(document.body);
    const option2 = await body.findByText('オプション2');
    await userEvent.click(option2);
    await expect(trigger).toHaveTextContent('オプション2');
  },
};

export const WithLabel: Story = {
  args: {
    placeholder: '未選択',
  },
  render: (args) => (
    <Select {...args}>
      <SelectGroup>
        <SelectLabel>カテゴリ1</SelectLabel>
        <SelectItem value='option1'>
          <SelectItemText>オプション1</SelectItemText>
        </SelectItem>
        <SelectItem value='option2'>
          <SelectItemText>オプション2</SelectItemText>
        </SelectItem>
        <SelectLabel>カテゴリ2</SelectLabel>
        <SelectItem value='option3'>
          <SelectItemText>オプション3</SelectItemText>
        </SelectItem>
      </SelectGroup>
    </Select>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole('combobox');
    await userEvent.click(trigger);
    const body = within(document.body);
    await body.findByText('カテゴリ1');
  },
};

export const Disabled: Story = {
  args: {
    placeholder: '未選択',
    disabled: true,
  },
  render: (args) => (
    <Select {...args}>
      <SelectGroup>
        <SelectItem value='option1'>
          <SelectItemText>オプション1</SelectItemText>
        </SelectItem>
        <SelectItem value='option2'>
          <SelectItemText>オプション2</SelectItemText>
        </SelectItem>
      </SelectGroup>
    </Select>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole('combobox');
    await expect(trigger).toBeDisabled();
  },
};
