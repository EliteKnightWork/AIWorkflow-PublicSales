'use client';

import { Box } from '@radix-ui/themes';
import { type ComponentProps, type RefObject, useRef, useState } from 'react';
import { IconButton } from '../IconButton';
import styles from './fileUpload.module.css';

export type FileUploadItemProps = {
  /** ファイルオブジェクト */
  fileName?: string;
  /** 削除時のコールバック */
  onDelete?: () => void;
  /** 削除ボタンを表示するか */
  showDeleteButton?: boolean;
  /** 無効化 */
  disabled?: boolean;
  /** 追加クラス名 */
  className?: string;
};

/**
 * ファイルアップロードアイテムコンポーネント
 */
export function FileUploadItem({
  fileName,
  onDelete,
  showDeleteButton = true,
  disabled = false,
  className,
}: FileUploadItemProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <Box className={`${styles.fileItem} ${className ?? ''}`}>
      <Box className={styles.fileInfo}>
        <span className={`material-icons ${styles.fileIcon}`} translate='no' aria-hidden='true'>
          download
        </span>
        <p className={styles.fileName} title={fileName}>
          {fileName}
        </p>
      </Box>
      {showDeleteButton && (
        <IconButton
          size={'xl'}
          shape='square'
          onClick={handleDelete}
          aria-label='ファイルを削除'
          disabled={disabled}
        >
          <span className='material-icons' translate='no' aria-hidden='true'>
            close
          </span>
        </IconButton>
      )}
    </Box>
  );
}

export type FileUploadProps = Omit<
  ComponentProps<'input'>,
  'ref' | 'type' | 'accept' | 'multiple' | 'disabled' | 'onChange' | 'className'
> & {
  /** アップロード済みファイルのリスト */
  files?: File[];
  /** ファイル変更時のコールバック */
  onChange?: (files: File[]) => void;
  /** 入力要素のref */
  ref?: RefObject<HTMLInputElement | null>;
  /** 受け入れるファイルタイプ */
  accept?: string;
  /** 複数ファイル選択を許可 */
  multiple?: boolean;
  /** 無効化 */
  disabled?: boolean;
  /** プレースホルダーテキスト */
  placeholder?: string;
  /** 追加クラス名 */
  className?: string;
  /** ファイルリスト表示 */
  showFileList?: boolean;
};

export default function FileUpload({
  files = [],
  onChange,
  ref,
  multiple = false,
  disabled = false,
  placeholder = 'ここにファイルをドラッグ&ドロップ',
  className,
  showFileList = true,
  ...props
}: FileUploadProps) {
  const internalRef = useRef<HTMLInputElement | null>(null);
  const inputRef = ref ?? internalRef;
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    setDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      if (multiple) {
        onChange?.([...files, ...droppedFiles]);
      } else {
        onChange?.(droppedFiles.slice(0, 1));
      }
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
      if (multiple) {
        onChange?.([...files, ...selectedFiles]);
      } else {
        onChange?.(selectedFiles.slice(0, 1));
      }
    }
    // 同一ファイル再選択に備え値をリセット
    e.currentTarget.value = '';
  };

  const openPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleRemoveFile = (index: number) => {
    if (disabled) return;
    const newFiles = files.filter((_, i) => i !== index);
    onChange?.(newFiles);
  };

  const showList = showFileList && files.length > 0;

  return (
    <Box className={`${styles.container} ${className ?? ''}`}>
      {/* ドラッグ&ドロップエリア */}
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
          multiple={multiple}
          disabled={disabled}
          onChange={handleInputChange}
          className={styles.hiddenInput}
          aria-hidden
          tabIndex={-1}
          {...props}
        />
      </Box>

      {/* ファイルリスト */}
      {showList && (
        <Box className={styles.fileList}>
          {files.map((file, index) => (
            <FileUploadItem
              key={file.name}
              fileName={file.name}
              onDelete={() => handleRemoveFile(index)}
              showDeleteButton={true}
              disabled={disabled}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
