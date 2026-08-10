import { Flex } from '@radix-ui/themes';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from './index';

const meta: Meta<typeof Button> = {
  title: 'Shared/Button',
  component: Button,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    onClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    size: 'xl',
    variant: 'primary',
    children: 'プライマリーボタン',
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

export const Secondary: Story = {
  args: {
    size: 'large',
    variant: 'secondary',
    children: 'セカンダリーボタン',
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

export const Tertiary: Story = {
  args: {
    size: 'medium',
    variant: 'tertiary',
    children: 'サードボタン',
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

export const Default: Story = {
  args: {
    size: 'small',
    variant: 'default',
    children: 'デフォルトボタン',
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

export const Disable: Story = {
  args: {
    disabled: true,
    children: '無効化ボタン',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // ボタンが存在
    const button = await canvas.findByRole('button', { name: args.children as string });

    // クリックしても発火しない
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(0);
  },
};

export const WithIcon: Story = {
  args: {
    variant: 'primary',
    children: (
      <Flex justify='between' width='100%' align='center' gap='0.5rem'>
        <span className='material-icons' translate='no' aria-hidden='true'>
          bookmark
        </span>
        アイコン付きボタン
        <span className='material-icons' translate='no' aria-hidden='true'>
          bookmark
        </span>
      </Flex>
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
