import { Text } from '@radix-ui/themes';
import { Menubar } from 'radix-ui';
import { useState } from 'react';
import type { BidPipelineTask } from '@/api/generated/models';
import { TaskDeleteDialog } from '../taskDeleteDialog/TaskDeleteDialog';
import styles from './styles.module.css';

type Props = {
  task: BidPipelineTask;
  deleteTask: (task: BidPipelineTask) => Promise<void>;
  modalRef?: React.RefObject<HTMLDivElement>;
};

export const TaskOptionMenuBar = ({ task, deleteTask, modalRef }: Props) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteClick = (e?: Event) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setIsDeleteDialogOpen(true);
  };

  return (
    <>
      <Menubar.Root className={styles.menuRoot}>
        <Menubar.Menu>
          <Menubar.Trigger
            className={`${styles.menuTrigger} menu-trigger`}
            onClick={(e) => {
              // クリックイベントが親要素に伝播するのを防止
              e.stopPropagation();
            }}
          >
            <span className='material-icons' translate='no' aria-hidden='true'>
              more_horiz
            </span>
          </Menubar.Trigger>
          <Menubar.Portal>
            <Menubar.Content
              className={`${styles.menuContent} menu-content`}
              align='end'
              sideOffset={5}
              alignOffset={-3}
              ref={modalRef}
            >
              {/* <Menubar.Item
                    className={styles.menuItem}
                    onSelect={() => {
                      duplicateTask(task.id);
                    }}
                  >
                    <Text>複製する</Text>
                  </Menubar.Item> */}
              <Menubar.Item className={styles.menuItem} onSelect={handleDeleteClick}>
                <Text className={styles.deleteText}>削除する</Text>
              </Menubar.Item>
            </Menubar.Content>
          </Menubar.Portal>
        </Menubar.Menu>
      </Menubar.Root>

      <TaskDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={async () => {
          await deleteTask(task);
          setIsDeleteDialogOpen(false);
        }}
        task={task}
        modalRef={modalRef}
      />
    </>
  );
};
