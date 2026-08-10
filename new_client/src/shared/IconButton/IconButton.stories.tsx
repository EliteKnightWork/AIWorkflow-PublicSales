import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { IconButton } from './index';

const meta: Meta<typeof IconButton> = {
  title: 'Shared/IconButton',
  component: IconButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    onClick: fn(),
    children: (
      <span className='material-icons' translate='no' aria-hidden='true'>
        bookmark_outline
      </span>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    size: 'xl',
    variant: 'primary',
    shape: 'round',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // ボタンが存在
    const button = await canvas.findByRole('button');

    // クリックでイベント発火
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const Secondary: Story = {
  args: {
    size: 'large',
    variant: 'secondary',
    shape: 'round',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // ボタンが存在
    const button = await canvas.findByRole('button');

    // クリックでイベント発火
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const Tertiary: Story = {
  args: {
    size: 'medium',
    variant: 'tertiary',
    shape: 'round',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // ボタンが存在
    const button = await canvas.findByRole('button');

    // クリックでイベント発火
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const Default: Story = {
  args: {
    size: 'small',
    variant: 'default',
    shape: 'round',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // ボタンが存在
    const button = await canvas.findByRole('button');

    // クリックでイベント発火
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    variant: 'default',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // ボタンが存在
    const button = await canvas.findByRole('button');

    // disabled属性が設定されている
    await expect(button).toBeDisabled();

    // クリックしても発火しない
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(0);
  },
};

export const Square: Story = {
  args: {
    size: 'medium',
    variant: 'primary',
    shape: 'square',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // ボタンが存在
    const button = await canvas.findByRole('button');

    // クリックでイベント発火
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const SizeXl: Story = {
  args: {
    size: 'xl',
    variant: 'primary',
    shape: 'round',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // ボタンが存在
    const button = await canvas.findByRole('button');

    // クリックでイベント発火
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const SizeLarge: Story = {
  args: {
    size: 'large',
    variant: 'primary',
    shape: 'round',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // ボタンが存在
    const button = await canvas.findByRole('button');

    // クリックでイベント発火
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const SizeMedium: Story = {
  args: {
    size: 'medium',
    variant: 'primary',
    shape: 'round',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // ボタンが存在
    const button = await canvas.findByRole('button');

    // クリックでイベント発火
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const SizeSmall: Story = {
  args: {
    size: 'small',
    variant: 'primary',
    shape: 'round',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // ボタンが存在
    const button = await canvas.findByRole('button');

    // クリックでイベント発火
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const SizeXs: Story = {
  args: {
    size: 'xs',
    variant: 'primary',
    shape: 'round',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // ボタンが存在
    const button = await canvas.findByRole('button');

    // クリックでイベント発火
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};
