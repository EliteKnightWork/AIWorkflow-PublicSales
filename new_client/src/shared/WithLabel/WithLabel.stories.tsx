import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { TextField } from '@/shared/TextField';
import { FormButton } from '../FormButton';
import WithLabel from './WithLabel';

const meta: Meta<typeof WithLabel> = {
  title: 'Shared/WithLabel',
  component: WithLabel,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    label: 'ラベル',
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

export const WithTextField: Story = {
  args: {
    label: 'メールアドレス',
    children: <TextField placeholder='メールアドレスを入力' />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ラベルテキストが存在
    const label = await canvas.findByText('メールアドレス');
    await expect(label).toBeInTheDocument();

    // TextField が存在
    const textField = await canvas.findByPlaceholderText('メールアドレスを入力');
    await expect(textField).toBeInTheDocument();
  },
};

export const WithTextFieldAndButton: Story = {
  args: {
    label: 'プロジェクト名',
    actions: (
      <FormButton size='small' onClick={fn()}>
        編集
      </FormButton>
    ),
    children: <TextField placeholder='プロジェクト名を入力' />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ラベルテキストが存在
    const label = await canvas.findByText('プロジェクト名');
    await expect(label).toBeInTheDocument();

    // TextField が存在
    const textField = await canvas.findByPlaceholderText('プロジェクト名を入力');
    await expect(textField).toBeInTheDocument();

    // ボタンが存在し、クリック可能
    const button = await canvas.findByRole('button', { name: '編集' });
    await expect(button).toBeInTheDocument();
    await userEvent.click(button);
  },
};

export const WithMultipleActions: Story = {
  args: {
    label: 'ファイル',
    actions: [
      <FormButton key='edit' size='small' onClick={fn()}>
        編集
      </FormButton>,
      <FormButton key='delete' size='small' onClick={fn()}>
        削除
      </FormButton>,
    ],
    children: <TextField placeholder='ファイル名を入力' />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ラベルテキストが存在
    const label = await canvas.findByText('ファイル');
    await expect(label).toBeInTheDocument();

    // TextField が存在
    const textField = await canvas.findByPlaceholderText('ファイル名を入力');
    await expect(textField).toBeInTheDocument();

    // 複数のボタンが存在
    const editButton = await canvas.findByRole('button', { name: '編集' });
    const deleteButton = await canvas.findByRole('button', { name: '削除' });
    await expect(editButton).toBeInTheDocument();
    await expect(deleteButton).toBeInTheDocument();
  },
};

export const WithButtonOnly: Story = {
  args: {
    label: 'アクション',
    actions: (
      <FormButton size='small' onClick={fn()}>
        実行
      </FormButton>
    ),
    children: <div>コンテンツエリア</div>,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ラベルテキストが存在
    const label = await canvas.findByText('アクション');
    await expect(label).toBeInTheDocument();

    // コンテンツが存在
    const content = await canvas.findByText('コンテンツエリア');
    await expect(content).toBeInTheDocument();

    // ボタンが存在
    const button = await canvas.findByRole('button', { name: '実行' });
    await expect(button).toBeInTheDocument();
  },
};

export const WithoutActions: Story = {
  args: {
    label: '説明',
    children: <TextField placeholder='説明を入力してください' />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ラベルテキストが存在
    const label = await canvas.findByText('説明');
    await expect(label).toBeInTheDocument();

    // TextField が存在
    const textField = await canvas.findByPlaceholderText('説明を入力してください');
    await expect(textField).toBeInTheDocument();

    // アクションエリアが存在しない（または空）
    const buttons = canvas.queryAllByRole('button');
    await expect(buttons).toHaveLength(0);
  },
};
