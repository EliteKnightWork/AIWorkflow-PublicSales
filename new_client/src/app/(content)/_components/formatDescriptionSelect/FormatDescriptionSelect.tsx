'use client';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Box, Button, Flex, Spinner, Text } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import {
  getBusinessDescriptionFormats,
  useDeleteBusinessDescriptionFormat,
} from '@/api/generated/endpoints/business-description-formats';
import type { BusinessDescriptionFormat } from '@/api/generated/models/businessDescriptionFormat';
import { useToast } from '@/context/ToastContext';
import styles from './styles.module.css';

type Props = {
  onSelectDescription: (description: string) => void;
  onFormatDeleted?: () => void;
};

export const FormatDescriptionSelect = ({ onSelectDescription, onFormatDeleted }: Props) => {
  const { enqueueToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formats, setFormats] = useState<BusinessDescriptionFormat[]>([]);

  useEffect(() => {
    if (isOpen && formats.length === 0) {
      setIsLoading(true);
      getBusinessDescriptionFormats()
        .then((res) => {
          setFormats(res.businessDescriptionFormats ?? []);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, formats.length]);

  const { mutate: deleteBusinessDescriptionFormat } = useDeleteBusinessDescriptionFormat();

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
  };

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger asChild className={styles.roundSelectTrigger}>
        <Button
          variant='outline'
          className={styles.roundSelectTriggerButton}
          onClick={handleTriggerClick}
        >
          <Text>フォーマットを挿入</Text>
          <span className={`material-icons ${styles.sideMenuIconHelp}`}>filter_alt</span>
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={styles.dropdownContent}
          sideOffset={5}
          onInteractOutside={() => setIsOpen(false)}
        >
          {isLoading ? (
            <Flex justify={'center'} align={'center'} width={'100%'}>
              <Spinner size={'3'} />
            </Flex>
          ) : formats.length === 0 ? (
            <Box>
              <Text>フォーマットがありません</Text>
            </Box>
          ) : (
            formats.map((format) => (
              <DropdownMenu.CheckboxItem key={format.id} className={styles.checkboxItem}>
                <Flex direction='column' align={'center'} className={styles.checkboxItemFlex}>
                  <Box className={styles.deleteFormatButtonBox}>
                    <Button
                      className={styles.deleteFormatButton}
                      onClick={() => {
                        if (window.confirm('本当に削除しますか？')) {
                          deleteBusinessDescriptionFormat(
                            { id: format.id as number },
                            {
                              onSuccess: () => {
                                setFormats(formats.filter((f) => f.id !== format.id));
                                enqueueToast('フォーマットを削除しました', 'success');
                                if (onFormatDeleted) {
                                  console.log('onFormatDeleted');
                                  onFormatDeleted();
                                }
                              },
                              onError: (_error) => {
                                enqueueToast('フォーマットの削除に失敗しました', 'error');
                              },
                            }
                          );
                        }
                      }}
                    >
                      <span className={'material-icons'}>delete</span>
                      削除する
                    </Button>
                  </Box>
                  <Flex
                    direction='row'
                    justify='between'
                    align={'center'}
                    className={styles.descriptionItem}
                    onClick={() => {
                      onSelectDescription(format.description as string);
                    }}
                  >
                    <Box>
                      {format.description.split('\n').map((line, index) => (
                        <span key={`${line}-${index.toString()}`}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </Box>
                    <span className={'material-icons'}>chevron_right</span>
                  </Flex>
                </Flex>
              </DropdownMenu.CheckboxItem>
            ))
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
