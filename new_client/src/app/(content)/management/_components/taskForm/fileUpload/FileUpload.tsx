'use client';

import { Box, Flex } from '@radix-ui/themes';
import type React from 'react';
import { useState } from 'react';
import styles from './styles.module.css';

const MAX_FILE_SIZE = 1024 * 1024 * 1024;

type Props = {
  titleNode: React.ReactNode;
  onFileAdd: (files: File[]) => void;
  multiple?: boolean;
};

export default function FileUpload({ titleNode, onFileAdd, multiple = false }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      let hasLargeFile = false;

      const addFiles: File[] = [];

      const files = Array.from(e.dataTransfer.files);

      if (files.length > 5) {
        setError('1度にアップロードできるファイルは5つです');
        return;
      }

      for (const file of files) {
        if (file.size <= MAX_FILE_SIZE) {
          addFiles.push(file);
        } else {
          hasLargeFile = true;
        }
      }

      onFileAdd(addFiles);

      if (hasLargeFile) {
        setError('1GBを超えるファイルはアップロードできません');
      } else {
        setError(null);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      let hasLargeFile = false;
      const addFiles: File[] = [];

      const files = Array.from(e.target.files);

      if (files.length > 5) {
        setError('1度にアップロードできるファイルは5つです');
        return;
      }

      for (const file of files) {
        if (file.size <= MAX_FILE_SIZE) {
          addFiles.push(file);
        } else {
          hasLargeFile = true;
        }
      }
      onFileAdd(addFiles);

      if (hasLargeFile) {
        setError('1GBを超えるファイルはアップロードできません');
      } else {
        setError(null);
      }
    }
  };

  return (
    <div className={styles.fileUploadContainer}>
      <Flex direction='row' justify='between' align='center'>
        {titleNode}
        {/* アップロードボタンをドロップゾーンの上に配置 */}
        <label className={styles.fileUploadButton}>
          アップロード
          <span className={`material-icons ${styles.uploadIcon}`}>upload_2</span>
          <input type='file' multiple={multiple} hidden onChange={handleFileSelect} />
        </label>
      </Flex>

      {/* ドロップゾーン */}
      <Box
        className={`${styles.fileDropzone} ${isDragging ? styles.dragging : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className={styles.fileEmptyState}>
          <div className={styles.fileDropzoneText}>ここにファイルをドラッグ&amp;ドロップ</div>
        </div>
      </Box>

      {/* エラーメッセージ */}
      {error && <div className={styles.fileErrorText}>{error}</div>}
    </div>
  );
}
