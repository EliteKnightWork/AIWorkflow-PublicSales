import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { FormButton } from './index';

const meta: Meta<typeof FormButton> = {
  title: 'Shared/FormButton',
  component: FormButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    onClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Medium: Story = {
  args: {
    size: 'medium',
    children: 'ミディアムサイズ',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // ボタンが存在
    const button = await canvas.findByRole('button', { name: args.children as string });

    // クリックでイベント発火
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const Small: Story = {
  args: {
    size: 'small',
    children: 'スモールサイズ',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // ボタンが存在
    const button = await canvas.findByRole('button', { name: args.children as string });

    // クリックでイベント発火
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const WithBorder: Story = {
  args: {
    size: 'small',
    border: true,
    children: '枠線付きボタン',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // ボタンが存在
    const button = await canvas.findByRole('button', { name: args.children as string });

    // クリックでイベント発火
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        アイコン付きボタン
        <span className='material-icons' translate='no' aria-hidden='true'>
          filter_alt
        </span>
      </>
    ),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // ボタンが存在
    const button = await canvas.findByRole('button', { name: /アイコン付きボタン/ });

    // クリックでイベント発火
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};
