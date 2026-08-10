import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import FileUpload from './FileUpload';

const meta: Meta<typeof FileUpload> = {
  title: 'Shared/FileUpload',
  component: FileUpload,
  tags: ['autodocs'],
  args: {
    placeholder: 'ここにファイルをドラッグ&ドロップ',
    onChange: fn(),
  },
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => {
      return (
        <div style={{ width: '704px' }}>
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
    const placeholder = await canvas.findByText('ここにファイルをドラッグ&ドロップ');
    await expect(placeholder).toBeVisible();
  },
};

export const WithFiles: Story = {
  args: {
    files: [
      new File(['content1'], 'ファイル名が入る.pdf', { type: 'application/pdf' }),
      new File(['content2'], 'ファイル名が入る.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }),
      new File(['content3'], 'ファイル名が入る.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const placeholder = await canvas.findByText('ここにファイルをドラッグ&ドロップ');
    await expect(placeholder).toBeVisible();

    const file1 = await canvas.findByText('ファイル名が入る.pdf');
    await expect(file1).toBeVisible();

    const file2 = await canvas.findByText('ファイル名が入る.docx');
    await expect(file2).toBeVisible();

    const file3 = await canvas.findByText('ファイル名が入る.xlsx');
    await expect(file3).toBeVisible();
  },
};

export const Multiple: Story = {
  args: {
    multiple: true,
  },
  render: (args) => {
    const [files, setFiles] = useState<File[]>([]);
    return (
      <FileUpload
        {...args}
        files={files}
        onChange={(newFiles) => {
          setFiles(newFiles);
          args.onChange?.(newFiles);
        }}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const placeholder = await canvas.findByText('ここにファイルをドラッグ&ドロップ');
    await expect(placeholder).toBeVisible();
  },
};

export const Controlled: Story = {
  render: (args) => {
    const [files, setFiles] = useState<File[]>([
      new File(['content'], 'サンプルファイル.pdf', { type: 'application/pdf' }),
    ]);
    return (
      <FileUpload
        {...args}
        files={files}
        onChange={(newFiles) => {
          setFiles(newFiles);
          args.onChange?.(newFiles);
        }}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const file = await canvas.findByText('サンプルファイル.pdf');
    await expect(file).toBeVisible();

    const removeButtons = canvas.getAllByLabelText('ファイルを削除');
    await expect(removeButtons.length).toBeGreaterThan(0);

    await userEvent.click(removeButtons[0]);
    await expect(file).not.toBeInTheDocument();
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    files: [new File(['content'], 'ファイル名が入る.pdf', { type: 'application/pdf' })],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const placeholder = await canvas.findByText('ここにファイルをドラッグ&ドロップ');
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
    const placeholder = await canvas.findByText('ここにファイルをドラッグ&ドロップ');
    await expect(placeholder).toBeVisible();
  },
};
