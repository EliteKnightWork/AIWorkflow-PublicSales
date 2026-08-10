import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn, within } from 'storybook/test';
import FileUploadInline from './index';

const meta: Meta<typeof FileUploadInline> = {
  title: 'Shared/FileUploadInline',
  component: FileUploadInline,
  tags: ['autodocs'],
  args: {
    onChange: fn(),
  },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const placeholder = await canvas.findByText('ファイルをドラッグ&ドロップ');
    await expect(placeholder).toBeVisible();
  },
};

export const WithFile: Story = {
  args: {
    file: new File(['content'], 'ファイル名が入る.pdf', { type: 'application/pdf' }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fileName = await canvas.findByText('ファイル名が入る.pdf');
    await expect(fileName).toBeVisible();
  },
};

export const Controlled: Story = {
  render: (args) => {
    const [file, setFile] = useState<File | undefined>(
      new File(['content'], 'サンプルファイル.pdf', { type: 'application/pdf' })
    );
    return (
      <FileUploadInline
        {...args}
        file={file}
        onChange={(newFile) => {
          setFile(newFile);
          args.onChange?.(newFile);
        }}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fileName = await canvas.findByText('サンプルファイル.pdf');
    await expect(fileName).toBeVisible();
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const placeholder = await canvas.findByText('ファイルをドラッグ&ドロップ');
    await expect(placeholder).toBeVisible();

    const dropzone = placeholder.closest('[data-disabled]');
    await expect(dropzone).toHaveAttribute('data-disabled', 'true');
  },
};

export const WithAccept: Story = {
  args: {
    accept: 'image/*',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const placeholder = await canvas.findByText('ファイルをドラッグ&ドロップ');
    await expect(placeholder).toBeVisible();

    const input = canvasElement.querySelector('input[type="file"]');
    await expect(input).toHaveAttribute('accept', 'image/*');
  },
};

export const WithoutDeleteButton: Story = {
  args: {
    file: new File(['content'], 'ファイル名が入る.pdf', { type: 'application/pdf' }),
    showDeleteButton: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fileName = await canvas.findByText('ファイル名が入る.pdf');
    await expect(fileName).toBeVisible();

    const deleteButton = canvas.queryByRole('button', { name: 'ファイルを削除' });
    expect(deleteButton).not.toBeInTheDocument();
  },
};
