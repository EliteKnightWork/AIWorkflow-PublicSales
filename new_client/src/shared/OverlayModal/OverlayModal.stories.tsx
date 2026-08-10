import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from '../Button';
import { OverlayModal } from './index';

const meta: Meta<typeof OverlayModal> = {
  title: 'Shared/OverlayModal',
  component: OverlayModal,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: {
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: false,
    title: 'モーダルタイトル',
  },
  render: (args) => {
    const [open, setOpen] = useState(args.open ?? false);
    return (
      <div style={{ padding: '20px' }}>
        <Button onClick={() => setOpen(true)}>モーダルを開く</Button>
        <OverlayModal
          {...args}
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            args.onOpenChange?.(isOpen);
          }}
        >
          <div>
            <p style={{ marginBottom: '16px', fontSize: '14px', lineHeight: '1.6' }}>
              これはシンプルなオーバーレイモーダルのコンテンツです。
              下から迫り上がるアニメーションで表示されます。
            </p>
            <Button onClick={() => setOpen(false)}>閉じる</Button>
          </div>
        </OverlayModal>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // モーダルを開くボタンをクリック
    const openButton = await canvas.findByRole('button', { name: /モーダルを開く/ });
    await userEvent.click(openButton);

    // モーダルが開いたことを確認
    const body = within(document.body);
    const modalContent = await body.findByText('モーダルタイトル');
    await expect(modalContent).toBeVisible();

    // 閉じるボタンをクリック
    const closeButton = await body.findAllByRole('button', { name: /閉じる/ });
    await userEvent.click(closeButton[1]);

    // モーダルが閉じたことを確認
    await expect(body.queryByText('モーダルタイトル')).toBeNull();
  },
};

export const WithLongContent: Story = {
  args: {
    open: false,
    title: '長いコンテンツのモーダル',
  },
  render: (args) => {
    const [open, setOpen] = useState(args.open ?? false);
    const numbers = Array.from({ length: 20 }, (_, i) => i + 1);
    return (
      <div style={{ padding: '20px' }}>
        <Button onClick={() => setOpen(true)}>長いコンテンツのモーダルを開く</Button>
        <OverlayModal
          {...args}
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            args.onOpenChange?.(isOpen);
          }}
        >
          <div>
            {numbers.map((number) => (
              <p key={number} style={{ marginBottom: '16px', fontSize: '14px', lineHeight: '1.6' }}>
                これは長いコンテンツの例です。スクロール可能なモーダルの動作を確認できます。
                コンテンツが長い場合、モーダル内でスクロールできるようになっています。
                {number}段落目のテキストです。
              </p>
            ))}
            <Button onClick={() => setOpen(false)}>閉じる</Button>
          </div>
        </OverlayModal>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // モーダルを開くボタンをクリック
    const openButton = await canvas.findByRole('button', {
      name: /長いコンテンツのモーダルを開く/,
    });
    await userEvent.click(openButton);

    // モーダルが開いたことを確認
    const body = within(document.body);
    const modalContent = await body.findByText('長いコンテンツのモーダル');
    await expect(modalContent).toBeVisible();
  },
};

export const InitiallyOpen: Story = {
  args: {
    open: true,
    title: '初期状態で開いているモーダル',
  },
  render: (args) => {
    const [open, setOpen] = useState(args.open ?? true);
    return (
      <div style={{ padding: '20px' }}>
        <OverlayModal
          {...args}
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            args.onOpenChange?.(isOpen);
          }}
        >
          <div>
            <p style={{ marginBottom: '16px', fontSize: '14px', lineHeight: '1.6' }}>
              このモーダルは初期状態で開いています。
            </p>
            <Button onClick={() => setOpen(false)}>閉じる</Button>
          </div>
        </OverlayModal>
      </div>
    );
  },
  play: async () => {
    const body = within(document.body);

    // モーダルが開いていることを確認
    const modalContent = await body.findByText('初期状態で開いているモーダル');
    await expect(modalContent).toBeVisible();
  },
};

export const WithMaxContentWidth: Story = {
  args: {
    open: false,
    title: '保存条件',
    maxContentWidth: '720px',
  },
  render: (args) => {
    const [open, setOpen] = useState(args.open ?? false);
    return (
      <div style={{ padding: '20px' }}>
        <Button onClick={() => setOpen(true)}>最大幅720pxのモーダルを開く</Button>
        <OverlayModal
          {...args}
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            args.onOpenChange?.(isOpen);
          }}
        >
          <div>
            <p style={{ marginBottom: '16px', fontSize: '14px', lineHeight: '1.6' }}>
              このモーダルのコンテンツは最大幅720pxに制限されています。
              Figmaデザインに合わせた設定です。
            </p>
            <Button onClick={() => setOpen(false)}>閉じる</Button>
          </div>
        </OverlayModal>
      </div>
    );
  },
  play: async () => {
    const body = within(document.body);
    const modalContent = await body.findByText('最大幅720pxのモーダルを開く');
    await expect(modalContent).toBeVisible();
  },
};

export const WithCustomHeight: Story = {
  args: {
    open: false,
    title: 'カスタム高さのモーダル',
    height: '80vh',
  },
  render: (args) => {
    const [open, setOpen] = useState(args.open ?? false);
    return (
      <div style={{ padding: '20px' }}>
        <Button onClick={() => setOpen(true)}>高さ80vhのモーダルを開く</Button>
        <OverlayModal
          {...args}
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            args.onOpenChange?.(isOpen);
          }}
        >
          <div>
            <p style={{ marginBottom: '16px', fontSize: '14px', lineHeight: '1.6' }}>
              このモーダルの高さは80vhに設定されています。
            </p>
            <Button onClick={() => setOpen(false)}>閉じる</Button>
          </div>
        </OverlayModal>
      </div>
    );
  },
  play: async () => {
    const body = within(document.body);
    const modalContent = await body.findByText('高さ80vhのモーダルを開く');
    await expect(modalContent).toBeVisible();
  },
};
