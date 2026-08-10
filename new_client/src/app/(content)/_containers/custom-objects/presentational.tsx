'use client';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import type { GetCustomObjectTemplates200Item } from '@/api/generated/models';
import LoadingSpinner from '@/components/loadingSpinner/LoadingSpinner';
import styles from './styles.module.css';

type Props = {
  templates: GetCustomObjectTemplates200Item[];
  isLoading: boolean;
  error: unknown;
  onCreateNew: () => void;
  onEditItem: (id: number) => void;
  onDeleteItem: (id: number) => void;
};

export const CustomObjectsPresentational = ({
  templates,
  isLoading,
  error,
  onCreateNew,
  onEditItem,
  onDeleteItem,
}: Props) => {
  if (isLoading) {
    return (
      <Flex justify='center' align='center' style={{ minHeight: '200px' }}>
        <LoadingSpinner size={60} />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box className={styles.container}>
        <Text>エラーが発生しました</Text>
      </Box>
    );
  }

  return (
    <Box className={styles.container}>
      <Flex direction='column' gap='4' className={styles.content}>
        <Flex justify='between' align='center' className={styles.header}>
          <Text className={styles.title}>カスタム項目</Text>
          <Button className={styles.createButton} onClick={onCreateNew} variant='soft'>
            <span className='material-icons' translate='no' aria-hidden='true'>
              add
            </span>
            <Text className={styles.createButtonText}>カスタム項目を新規作成する</Text>
          </Button>
        </Flex>

        {templates.length === 0 ? (
          <Flex className={styles.emptyState} justify='center' align='center'>
            <Text className={styles.emptyText}>カスタム項目がありません</Text>
          </Flex>
        ) : (
          <Box className={styles.listContainer}>
            {templates.map((template) => (
              <Box
                key={template.id}
                className={styles.listItem}
                onClick={() => onEditItem(template.id)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onEditItem(template.id);
                }}
              >
                <Flex justify='between' align='center'>
                  <Text className={styles.itemTitle}>{template.title}</Text>
                  <Button
                    variant='ghost'
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(template.id);
                    }}
                    className={styles.deleteButton}
                  >
                    <span className='material-icons' translate='no' aria-hidden='true'>
                      delete
                    </span>
                  </Button>
                </Flex>
              </Box>
            ))}
          </Box>
        )}
      </Flex>
    </Box>
  );
};
