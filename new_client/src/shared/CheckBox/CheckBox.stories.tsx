import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CheckBox } from './index';

const meta: Meta<typeof CheckBox> = {
  title: 'Shared/CheckBox',
  component: CheckBox,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    onCheckedChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: '未選択',
  },
  render: (args) => {
    const [checked, setChecked] = useState(false);
    return (
      <CheckBox
        {...args}
        checked={checked}
        onCheckedChange={(checked) => {
          setChecked(checked === true);
          args.onCheckedChange?.(checked);
        }}
      />
    );
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const checkbox = await canvas.findByRole('checkbox');
    await userEvent.click(checkbox);
    await expect(args.onCheckedChange).toHaveBeenCalled();
  },
};

export const Checked: Story = {
  args: {
    label: '選択済み',
  },
  render: (args) => {
    const [checked, setChecked] = useState(true);
    return (
      <CheckBox
        {...args}
        checked={checked}
        onCheckedChange={(checked) => {
          setChecked(checked === true);
          args.onCheckedChange?.(checked);
        }}
      />
    );
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const checkbox = await canvas.findByRole('checkbox');
    await userEvent.click(checkbox);
    await expect(args.onCheckedChange).toHaveBeenCalled();
  },
};

export const Disabled: Story = {
  args: {
    label: '無効化',
    disabled: true,
  },
  render: (args) => {
    return <CheckBox {...args} checked={false} />;
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const checkbox = await canvas.findByRole('checkbox');
    expect(checkbox).toBeDisabled();
    await userEvent.click(checkbox);
    await expect(args.onCheckedChange).not.toHaveBeenCalled();
  },
};
