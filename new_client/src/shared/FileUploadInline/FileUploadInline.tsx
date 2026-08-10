'use client';

import { Box } from '@radix-ui/themes';
import type { ComponentProps, RefObject } from 'react';
import { useRef, useState } from 'react';
import { FileUploadItem } from '@/shared/FileUpload/FileUpload';
import styles from './fileUploadInline.module.css';

export type FileUploadInlineProps = Omit<
  ComponentProps<'input'>,
  'ref' | 'type' | 'accept' | 'multiple' | 'disabled' | 'onChange' | 'className'
> & {
  /** アップロード済みファイル */
  file?: File | undefined;
  /** ファイル変更時のコールバック */
  onChange?: (file: File | undefined) => void;
  /** 入力要素のref */
  ref?: RefObject<HTMLInputElement | null>;
  /** 受け入れるファイルタイプ */
  accept?: string;
  /** 無効化 */
  disabled?: boolean;
  /** プレースホルダーテキスト */
  placeholder?: string;
  /** 削除ボタンを表示するか */
  showDeleteButton?: boolean;
  /** 追加クラス名 */
  className?: string;
};

export function FileUploadInline({
  file,
  onChange,
  ref,
  disabled = false,
  placeholder = 'ファイルをドラッグ&ドロップ',
  showDeleteButton = true,
  className,
  ...props
}: FileUploadInlineProps) {
  const internalRef = useRef<HTMLInputElement | null>(null);
  const inputRef = ref ?? internalRef;
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    setDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      onChange?.(droppedFiles[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.currentTarget.files ?? []);
    if (selectedFiles.length > 0) {
      onChange?.(selectedFiles[0]);
    }
    // 同一ファイル再選択に備え値をリセット
    e.currentTarget.value = '';
  };

  const openPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleRemoveFile = () => {
    if (disabled) return;
    onChange?.(undefined);
  };

  return (
    <Box className={`${styles.container} ${className ?? ''}`}>
      {file ? (
        <Box className={styles.fileItem}>
          <FileUploadItem
            fileName={file.name}
            onDelete={handleRemoveFile}
            showDeleteButton={showDeleteButton}
            disabled={disabled}
          />
        </Box>
      ) : (
        <Box
          className={`${styles.dropzone} ${dragging ? styles.dragging : ''} ${disabled ? styles.disabled : ''}`}
          onClick={openPicker}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          data-disabled={disabled ? 'true' : undefined}
        >
          <p className={styles.placeholder}>{placeholder}</p>
          <input
            ref={inputRef}
            type='file'
            multiple={false}
            disabled={disabled}
            onChange={handleInputChange}
            className={styles.hiddenInput}
            aria-hidden
            tabIndex={-1}
            {...props}
          />
        </Box>
      )}
    </Box>
  );
}
