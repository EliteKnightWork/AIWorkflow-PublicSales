import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { TextField } from '@/shared/TextField';
import WithError from './WithError';

const meta: Meta<typeof WithError> = {
  title: 'Shared/WithError',
  component: WithError,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
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

export const WithErrorMessage: Story = {
  args: {
    error: 'この項目は必須です',
    children: <TextField placeholder='メールアドレスを入力' />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // TextField が存在
    const textField = await canvas.findByPlaceholderText('メールアドレスを入力');
    await expect(textField).toBeInTheDocument();

    // エラーメッセージが存在
    const errorMessage = await canvas.findByText('この項目は必須です');
    await expect(errorMessage).toBeInTheDocument();
  },
};

export const WithoutErrorMessage: Story = {
  args: {
    children: <TextField placeholder='メールアドレスを入力' />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // TextField が存在
    const textField = await canvas.findByPlaceholderText('メールアドレスを入力');
    await expect(textField).toBeInTheDocument();

    // エラーメッセージが存在しない
    const errorMessage = canvas.queryByText('この項目は必須です');
    await expect(errorMessage).not.toBeInTheDocument();
  },
};

export const WithLongErrorMessage: Story = {
  args: {
    error: 'パスワードは8文字以上、英数字と記号を含む必要があります',
    children: <TextField type='password' placeholder='パスワードを入力' />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // TextField が存在
    const textField = await canvas.findByPlaceholderText('パスワードを入力');
    await expect(textField).toBeInTheDocument();

    // エラーメッセージが存在
    const errorMessage = await canvas.findByText(
      'パスワードは8文字以上、英数字と記号を含む必要があります'
    );
    await expect(errorMessage).toBeInTheDocument();
  },
};

export const WithSimpleContent: Story = {
  args: {
    error: 'エラーが発生しました',
    children: <div>コンテンツエリア</div>,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // コンテンツが存在
    const content = await canvas.findByText('コンテンツエリア');
    await expect(content).toBeInTheDocument();

    // エラーメッセージが存在
    const errorMessage = await canvas.findByText('エラーが発生しました');
    await expect(errorMessage).toBeInTheDocument();
  },
};
