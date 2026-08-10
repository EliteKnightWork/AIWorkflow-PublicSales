'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Box, Flex, Text } from '@radix-ui/themes';
import type { ComponentProps, ReactNode } from 'react';
import { IconButton } from '../IconButton';
import styles from './overlayModal.module.css';

export type OverlayModalProps = Omit<
  ComponentProps<typeof Dialog.Root>,
  'defaultOpen' | 'open' | 'onOpenChange' | 'children'
> & {
  /** デフォルトで開くかどうか */
  defaultOpen?: boolean;
  /** 開いているかどうか */
  open?: boolean;
  /** 開いたり閉じたりするときのコールバック */
  onOpenChange?: (open: boolean) => void;
  /** トリガー */
  trigger?: ReactNode;
  /** タイトル */
  title: ReactNode;
  /** コンテンツの最大幅 */
  maxContentWidth?: string;
  /** 表示領域の高さ */
  height?: string;
  /** オーバーレイのクラス名 */
  overlayClassName?: string;
  /** コンテンツのクラス名 */
  contentClassName?: string;
  /** モーダルのコンテンツ */
  children: ReactNode;
};

/**
 * 下から迫り上がるシンプルなオーバーレイモーダルコンポーネント
 */
export default function OverlayModal({
  children,
  trigger,
  title,
  maxContentWidth = '720px',
  height = '90vh',
  overlayClassName,
  contentClassName,
  ...props
}: OverlayModalProps) {
  return (
    <Dialog.Root {...props}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className={[styles.overlay, overlayClassName].filter(Boolean).join(' ')} />
        <Dialog.Content
          className={[styles.content, contentClassName].filter(Boolean).join(' ')}
          style={{ height }}
        >
          <Box className={styles.header}>
            <Flex maxWidth={maxContentWidth} justify={'between'} align={'center'} width={'100%'}>
              <Dialog.Title asChild>
                <Text className={styles.title}>{title}</Text>
              </Dialog.Title>
              <Dialog.Close asChild>
                <IconButton size='medium' variant='default' shape='square' aria-label='閉じる'>
                  <span className='material-icons' translate='no' aria-hidden='true'>
                    close
                  </span>
                </IconButton>
              </Dialog.Close>
            </Flex>
          </Box>
          <Box className={styles.contentInner}>
            <Box maxWidth={maxContentWidth} width={'100%'}>
              {children}
            </Box>
          </Box>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
