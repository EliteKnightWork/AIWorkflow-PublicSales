import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { SidemenuButton } from './index';

const meta: Meta<typeof SidemenuButton> = {
  title: 'Shared/SidemenuButton',
  component: SidemenuButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    onClick: fn(),
  },
  decorators: [
    (Story) => {
      return (
        <div style={{ width: '240px' }}>
          <Story />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'default',
    leftIcon: (
      <span className='material-icons' translate='no' aria-hidden='true'>
        home
      </span>
    ),
    children: 'マイページ',
    rightIcon: (
      <span
        className='material-icons'
        translate='no'
        aria-hidden='true'
        style={{ fontSize: '16px' }}
      >
        help_outline
      </span>
    ),
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
    variant: 'secondary',
    leftIcon: (
      <span className='material-icons' translate='no' aria-hidden='true'>
        home
      </span>
    ),
    children: 'マイページ',
    rightIcon: (
      <span
        className='material-icons'
        translate='no'
        aria-hidden='true'
        style={{ fontSize: '16px' }}
      >
        help_outline
      </span>
    ),
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

export const WithIcons: Story = {
  args: {
    variant: 'default',
    leftIcon: (
      <span className='material-icons' translate='no' aria-hidden='true'>
        home
      </span>
    ),
    children: 'マイページ',
    rightIcon: (
      <span
        className='material-icons'
        translate='no'
        aria-hidden='true'
        style={{ fontSize: '16px' }}
      >
        help_outline
      </span>
    ),
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

export const WithoutIcons: Story = {
  args: {
    variant: 'default',
    children: 'マイページ',
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

export const WithLeftIconOnly: Story = {
  args: {
    variant: 'default',
    leftIcon: (
      <span className='material-icons' translate='no' aria-hidden='true'>
        home
      </span>
    ),
    children: 'マイページ',
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

export const WithRightIconOnly: Story = {
  args: {
    variant: 'default',
    children: 'マイページ',
    rightIcon: (
      <span
        className='material-icons'
        translate='no'
        aria-hidden='true'
        style={{ fontSize: '16px' }}
      >
        help_outline
      </span>
    ),
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

export const Disabled: Story = {
  args: {
    variant: 'default',
    disabled: true,
    leftIcon: (
      <span className='material-icons' translate='no' aria-hidden='true'>
        home
      </span>
    ),
    children: 'マイページ',
    rightIcon: (
      <span
        className='material-icons'
        translate='no'
        aria-hidden='true'
        style={{ fontSize: '16px' }}
      >
        help_outline
      </span>
    ),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // ボタンが存在し、無効化されている
    const button = await canvas.findByRole('button', { name: args.children as string });
    expect(button).toBeDisabled();

    // クリックしても発火しない
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(0);
  },
};

export const DisabledSecondary: Story = {
  args: {
    variant: 'secondary',
    disabled: true,
    leftIcon: (
      <span className='material-icons' translate='no' aria-hidden='true'>
        home
      </span>
    ),
    children: 'マイページ',
    rightIcon: (
      <span
        className='material-icons'
        translate='no'
        aria-hidden='true'
        style={{ fontSize: '16px' }}
      >
        help_outline
      </span>
    ),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // ボタンが存在し、無効化されている
    const button = await canvas.findByRole('button', { name: args.children as string });
    expect(button).toBeDisabled();

    // クリックしても発火しない
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(0);
  },
};
