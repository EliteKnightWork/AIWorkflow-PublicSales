'use client';

import { Box, Button, Flex, IconButton, Text, TextArea } from '@radix-ui/themes';
import { ja } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { useAddBidPipelineTaskCalendarEvent } from '@/api/generated/endpoints/bid-pipeline-task-calendar-events';
import {
  type AddBidPipelineTaskBody,
  type BidPipeline,
  BidPipelineStatusStage,
  type BidPipelineTask,
  type BidPipelineTaskAttachment,
  type BidPipelineTaskStatus,
  Provider,
  type User,
} from '@/api/generated/models';
import { TaskFormSelect } from './select/TaskFormSelect';
import styles from './styles.module.css';
import 'react-datepicker/dist/react-datepicker.css';
import { useGetCurrentUser } from '@/api/generated/endpoints/users';
import AppTooltip from '@/app/_components/tooltip/AppTooltip';
import { SettingModal } from '@/app/(content)/_containers/setting-modal';
import { useManagementContext } from '../../_context/ManagementContext';
import {
  getDaysUntilDeadline,
  getTaskStatus,
  pipelineTaskStatusColorList,
  TaskStatus,
} from '../../types';
import { TaskOptionMenuBar } from '../taskOptionMenu/TaskOptionMenu';
import FileUpload from './fileUpload/FileUpload';
import { NotifyCreateErrorDialog } from './notifyCreateErrorDialog';

type Props = {
  pipelines: BidPipeline[];
  users: User[];
  statuses: BidPipelineTaskStatus[];
  onClose: () => void;
  isChatSideBarOpen: boolean;
  onBack?: () => void;
  onSubmit?: (pipelineId: string, body: AddBidPipelineTaskBody) => Promise<void>;
  initTask?: BidPipelineTask;
  initPipeline?: BidPipeline;
  deleteTask?: (task: BidPipelineTask) => Promise<void>;
  onUpdateTitle?: (title: string) => void;
  onUpdatePipeline?: (pipeline: BidPipeline) => void;
  onUpdateStatus?: (statusId: string) => void;
  onUpdateAssignedUser?: (assignedUserIds: number[]) => void;
  onUpdateDueDate?: (dueDate: string) => void;
  onUpdateDescription?: (description: string) => void;
  onAddAttachment?: (files: File[]) => void;
  onDeleteAttachment?: (attachment: BidPipelineTaskAttachment) => void;
  modalRef?: React.RefObject<HTMLDivElement>;
};

export default function TaskForm({
  pipelines,
  users,
  statuses,
  onSubmit,
  onClose,
  isChatSideBarOpen,
  onBack,
  onUpdateTitle,
  initTask,
  initPipeline,
  deleteTask,
  onUpdatePipeline,
  onUpdateStatus,
  onUpdateAssignedUser,
  onUpdateDueDate,
  onUpdateDescription,
  onAddAttachment,
  onDeleteAttachment,
  modalRef,
}: Props) {
  registerLocale('ja', ja as any);
  const { pipelineTaskData, onUpdateTask } = useManagementContext();
  const [selectedPipeline, setSelectedPipeline] = useState<BidPipeline | null>(null);
  const [showNotifyErrorDialog, setShowNotifyErrorDialog] = useState(false);
  const [taskFormBody, setTaskFormBody] = useState<AddBidPipelineTaskBody>({});
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [onRegister, setOnRegister] = useState(false);
  const [isOpenSettingModal, setIsOpenSettingModal] = useState(false);
  const { data: currentUser } = useGetCurrentUser();
  const { mutate: addCalendarEvent, isPending: isAddingCalendarEvent } =
    useAddBidPipelineTaskCalendarEvent();

  const targetTask = initTask
    ? pipelineTaskData.list.flatMap((list) => list.projects).find((task) => task.id === initTask.id)
    : undefined;

  // Google OAuth2認証の状態を確認
  const isButtonDisabledDueToGoogleAuth = !currentUser?.authorizedProviders?.includes(
    Provider.google_oauth2
  );

  const isButtonDisabledDueToMicrosoftAuth = !currentUser?.authorizedProviders?.includes(
    Provider.microsoft_graph
  );

  const isButtonDisabledDueToAuth =
    isButtonDisabledDueToGoogleAuth && isButtonDisabledDueToMicrosoftAuth;

  const isButtonDisabledDueToAssignedUser = !initTask?.assignedUsers?.some(
    (user) => user.id === currentUser?.id
  );

  const isButtonDisabled = isButtonDisabledDueToAuth || isButtonDisabledDueToAssignedUser;

  useEffect(() => {
    if (initTask) {
      setTaskFormBody({
        title: initTask.title,
        bid_pipeline_task_status_id: initTask.status?.id ?? 0,
        assigned_user_ids:
          (initTask.assignedUsers
            ?.filter((user) => !!user.id)
            .map((user) => user.id) as number[]) ?? [],
        dueDate: initTask.dueDate ?? '',
        description: initTask.description ?? '',
      });

      setSelectedPipeline(
        pipelines.find((pipeline) => pipeline.id === initTask.pipeline?.pipelineId) ?? null
      );
    } else {
      if (initPipeline) {
        setSelectedPipeline(initPipeline);
      }
    }
  }, [initTask, initPipeline, pipelines]);

  const onClickSaveButton = async () => {
    if (!selectedPipeline || !selectedPipeline.id) {
      // 対象の案件を選んでいない
      setShowNotifyErrorDialog(true);
      return;
    }
    if (!taskFormBody.title || taskFormBody.title.length === 0) {
      // タイトルが空
      setShowNotifyErrorDialog(true);
      return;
    }

    setOnRegister(true);

    try {
      const formBody = {
        ...taskFormBody,
        attachments_attributes: attachedFiles,
      };

      await onSubmit?.(selectedPipeline.id.toString(), formBody);
    } finally {
      setOnRegister(false);
    }
  };

  const onClickRegisterCalendarButton = () => {
    if (
      !initTask ||
      !initTask.id ||
      !taskFormBody.dueDate ||
      !initTask.pipeline?.pipelineId ||
      !targetTask
    ) {
      return;
    }

    const dueDate = new Date(taskFormBody.dueDate);

    addCalendarEvent(
      {
        bidPipelineId: initTask.pipeline.pipelineId.toString(),
        taskId: initTask.id.toString(),
        data: {
          startDateTime: dueDate.toISOString(),
          allDay: true,
        },
      },
      {
        onSuccess: () => {
          onUpdateTask({
            ...targetTask,
            eventCreated: true,
          });
        },
      }
    );
  };

  return (
    <>
      <SettingModal
        isOpen={isOpenSettingModal}
        onClose={() => {
          setIsOpenSettingModal(false);
        }}
      />
      <NotifyCreateErrorDialog
        isOpen={showNotifyErrorDialog}
        onClose={() => setShowNotifyErrorDialog(false)}
        modalRef={modalRef}
      />
      <Box className={styles.content}>
        {!initTask && !onRegister && (
          <Button
            className={
              styles.saveButton +
              (isChatSideBarOpen
                ? ` ${styles.saveButtonChatSideBarOpen}`
                : ` ${styles.saveButtonChatSideBarClosed}`)
            }
            onClick={onClickSaveButton}
          >
            保存
          </Button>
        )}
        <Flex align='center' justify='between' className={styles.taskTitleArea} gap='4'>
          {initTask && (
            <IconButton radius='full' variant='soft' onClick={onBack}>
              <span
                className='material-icons'
                translate='no'
                aria-hidden='true'
                style={{ color: 'var(--text-color-tertiary)' }}
              >
                chevron_left
              </span>
            </IconButton>
          )}

          <input
            className={styles.taskTitleInput}
            placeholder='タイトルを入力'
            value={taskFormBody.title ?? ''}
            onChange={(e) => {
              setTaskFormBody({ ...taskFormBody, title: e.target.value });
            }}
            onBlur={(e) => {
              onUpdateTitle?.(e.target.value);
            }}
          />
          {initTask && (
            <TaskOptionMenuBar
              task={initTask}
              deleteTask={async (task) => await deleteTask?.(task)}
              modalRef={modalRef}
            />
          )}
          <IconButton radius='full' variant='soft' onClick={onClose}>
            <span
              className='material-icons'
              translate='no'
              aria-hidden='true'
              style={{ color: 'var(--text-color-tertiary)' }}
            >
              close
            </span>
          </IconButton>
        </Flex>

        {initTask &&
          initTask.status?.name !== '完了' &&
          (getTaskStatus(initTask) === TaskStatus.ERROR ? (
            <Flex className={styles.taskErrorArea} justify={'start'} gap='2' align='center'>
              <span className='material-icons' translate='no' aria-hidden='true'>
                info
              </span>
              このタスクはタスク期日まで残り{getDaysUntilDeadline(initTask.dueDate)}日です
            </Flex>
          ) : (
            getTaskStatus(initTask) === TaskStatus.WARNING && (
              <Flex className={styles.taskWarningArea} justify={'start'} gap='2' align='center'>
                <span className='material-icons' translate='no' aria-hidden='true'>
                  warning
                </span>
                このタスクはタスク期日まで残り{getDaysUntilDeadline(initTask.dueDate)}日です
              </Flex>
            )
          ))}

        <Flex direction='column' gap='4'>
          <Box className={styles.formTitle}>対象の案件</Box>
          <TaskFormSelect
            disabled={!!initTask}
            triggerNode={
              <Box>
                {selectedPipeline ? (
                  <Box className={`${styles.selectedTab} ${styles.selectedPipelineTab}`}>
                    {selectedPipeline.project?.title}
                  </Box>
                ) : (
                  '案件を選択'
                )}
              </Box>
            }
            items={pipelines
              .filter((pipeline) => pipeline.status?.stage !== BidPipelineStatusStage.done)
              .map((pipeline) => ({
                id: pipeline.id?.toString() ?? '',
                value: pipeline.project?.title ?? '',
              }))}
            selectedItem={
              selectedPipeline
                ? {
                    id: selectedPipeline.id?.toString() ?? '',
                    value: selectedPipeline.project?.title ?? '',
                  }
                : null
            }
            onSelect={(item) => {
              if (selectedPipeline?.id?.toString() === item.id) {
                return;
              }

              const pipeline = pipelines.find((pipeline) => pipeline.id?.toString() === item.id);

              if (pipeline) {
                setSelectedPipeline(pipeline);
                onUpdatePipeline?.(pipeline);
              }
            }}
            selectRef={modalRef}
          />
        </Flex>

        <Flex direction='column' gap='4'>
          <Box className={styles.formTitle}>タスク進捗</Box>
          <TaskFormSelect
            triggerNode={
              <Box>
                {taskFormBody.bid_pipeline_task_status_id ? (
                  <Box
                    className={`${styles.selectedTab} ${styles.selectedStatusTab}`}
                    style={{
                      color:
                        pipelineTaskStatusColorList.find(
                          (color) =>
                            statuses.find((status) => status.name === color.id)?.id ===
                            taskFormBody.bid_pipeline_task_status_id
                        )?.color ?? 'var(--bg-color-tag-text-active)',
                      border: `1px solid ${
                        pipelineTaskStatusColorList.find(
                          (color) =>
                            statuses.find((status) => status.name === color.id)?.id ===
                            taskFormBody.bid_pipeline_task_status_id
                        )?.borderColor ?? 'var(--color-secondary)'
                      }`,
                    }}
                  >
                    {statuses.find(
                      (status) => status.id === taskFormBody.bid_pipeline_task_status_id
                    )?.name ??
                      statuses.find(
                        (status) => status.id === taskFormBody.bid_pipeline_task_status_id
                      )?.name ??
                      '-'}
                  </Box>
                ) : (
                  'タスク進捗を選択'
                )}
              </Box>
            }
            items={statuses.map((status) => ({
              id: status.id?.toString() ?? '',
              value: status.name ?? '',
            }))}
            selectedItem={
              taskFormBody.bid_pipeline_task_status_id
                ? {
                    id:
                      statuses
                        .find(
                          (status) =>
                            status.id?.toString() === taskFormBody.bid_pipeline_task_status_id
                        )
                        ?.id?.toString() ?? '',
                    value:
                      statuses.find(
                        (status) =>
                          status.id?.toString() === taskFormBody.bid_pipeline_task_status_id
                      )?.name ?? '',
                  }
                : null
            }
            onSelect={(item) => {
              if (taskFormBody.bid_pipeline_task_status_id?.toString() === item.id) {
                return;
              }

              setTaskFormBody({
                ...taskFormBody,
                bid_pipeline_task_status_id:
                  statuses.find((status) => status.id?.toString() === item.id)?.id ?? undefined,
              });
              if (statuses.find((status) => status.id?.toString() === item.id)?.id) {
                onUpdateStatus?.(
                  statuses.find((status) => status.id?.toString() === item.id)?.id?.toString() ?? ''
                );
              }
            }}
            selectRef={modalRef}
          />
        </Flex>

        <Flex direction='column' gap='4'>
          <Box className={styles.formTitle}>タスク担当者</Box>
          <TaskFormSelect
            triggerNode={
              <Box>
                {taskFormBody.assigned_user_ids ? (
                  <Box className={`${styles.selectedTab} ${styles.selectedAssignedUserTab}`}>
                    {users.find(
                      (user) => !!user.id && taskFormBody.assigned_user_ids?.includes(user.id)
                    )?.name ??
                      users.find(
                        (user) => !!user.id && taskFormBody.assigned_user_ids?.includes(user.id)
                      )?.email ??
                      '-'}
                  </Box>
                ) : (
                  '担当者を選択'
                )}
              </Box>
            }
            items={users.map((user) => ({
              id: user.id?.toString() ?? '',
              value: user.name ?? user.email ?? '',
            }))}
            selectedItem={
              taskFormBody.assigned_user_ids
                ? {
                    id:
                      taskFormBody.assigned_user_ids
                        .find((id) => users.find((user) => user.id === id)?.id?.toString())
                        ?.toString() ?? '',
                    value:
                      taskFormBody.assigned_user_ids
                        .find(
                          (id) =>
                            users.find((user) => user.id === id)?.name ??
                            users.find((user) => user.id === id)?.email
                        )
                        ?.toString() ?? '',
                  }
                : null
            }
            onSelect={(item) => {
              setTaskFormBody({
                ...taskFormBody,
                assigned_user_ids: [Number(item.id)],
              });
              onUpdateAssignedUser?.([Number(item.id)]);
            }}
            selectRef={modalRef}
          />
        </Flex>

        <Flex direction='column' gap='4'>
          <Flex direction='row' gap='2' justify='between'>
            <Box className={styles.formTitle}>期日</Box>
            {taskFormBody.dueDate &&
              (isButtonDisabled ? (
                <AppTooltip
                  triggerChildren={
                    <Button className={styles.registerButton} disabled={true} onClick={() => {}}>
                      <span className='material-icons' translate='no' aria-hidden='true'>
                        calendar_today
                      </span>
                      登録する
                    </Button>
                  }
                  content={
                    <Flex direction='column' gap='3'>
                      <Text weight='medium'>カレンダー連携機能を使うためには：</Text>
                      <Flex direction='column' gap='2' style={{ paddingLeft: '16px' }}>
                        {isButtonDisabledDueToAuth && (
                          <Flex direction='row' gap='2' align='center'>
                            <Text>•</Text>
                            <Text
                              className={styles.accountSettingLink}
                              onClick={() => {
                                setIsOpenSettingModal(true);
                              }}
                              style={{ cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              アカウント設定
                            </Text>
                            <Text>へ移動して、Google/Microsoftアカウントと連携する</Text>
                          </Flex>
                        )}
                        {isButtonDisabledDueToAssignedUser && (
                          <Flex direction='row' gap='2' align='center'>
                            <Text>•</Text>
                            <Text>タスクの担当者を自分に設定する</Text>
                          </Flex>
                        )}
                      </Flex>
                    </Flex>
                  }
                />
              ) : (
                <Button
                  className={styles.registerButton}
                  disabled={
                    !taskFormBody.dueDate || targetTask?.eventCreated || isAddingCalendarEvent
                  }
                  onClick={onClickRegisterCalendarButton}
                >
                  <span className='material-icons' translate='no' aria-hidden='true'>
                    calendar_today
                  </span>
                  {targetTask?.eventCreated
                    ? '登録済み'
                    : isAddingCalendarEvent
                      ? '登録中...'
                      : '登録する'}
                </Button>
              ))}
          </Flex>
          <DatePicker
            className={styles.taskDatePicker}
            selected={taskFormBody.dueDate ? new Date(taskFormBody.dueDate) : null}
            onChange={(date) => {
              // 日付をyyyy-mm-dd形式の文字列に変換
              const formattedDate = date
                ? `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
                : '';
              setTaskFormBody({ ...taskFormBody, dueDate: formattedDate });
              onUpdateDueDate?.(formattedDate);
            }}
            dateFormat='yyyy/MM/dd'
            placeholderText='日付を選択'
            locale='ja'
            minDate={new Date()} // 過去日付を選択できないようにする
            customInput={<input className={styles.taskDatePicker} />}
          />
        </Flex>

        <Flex direction='column' gap='4'>
          <Box className={styles.formTitle}>詳細</Box>
          <TextArea
            className={styles.taskDescriptionTextArea}
            value={taskFormBody.description ?? ''}
            onChange={(e) => {
              if (taskFormBody.description !== e.target.value) {
                setTaskFormBody({ ...taskFormBody, description: e.target.value });
              }
            }}
            onBlur={(e) => {
              if (initTask?.description !== e.target.value) {
                onUpdateDescription?.(e.target.value);
              }
            }}
            resize='vertical'
          />
        </Flex>

        <Flex direction='column' gap='4'>
          <FileUpload
            titleNode={<Box className={styles.formTitle}>添付ファイル</Box>}
            onFileAdd={(files: File[]) => {
              if (!initTask) {
                // 新しく追加されるファイルから既存のattachedFilesに存在するファイルを除外する
                const newFiles = files.filter(
                  (newFile) =>
                    !attachedFiles.some(
                      (existingFile) =>
                        existingFile.name === newFile.name &&
                        existingFile.size === newFile.size &&
                        existingFile.lastModified === newFile.lastModified
                    )
                );

                // タスクの新規作成なので、formにつめる
                setAttachedFiles([...attachedFiles, ...newFiles]);
                return;
              }
              if (!initTask.pipeline?.pipelineId) {
                return;
              }
              // 編集なので、ファイルを追加する
              onAddAttachment?.(files);
            }}
          />

          <Box className={styles.fileList}>
            {initTask?.attachments?.map((attachment) => {
              return (
                <Flex className={styles.fileItem} key={attachment.id} gap='2'>
                  <span
                    className={`material-icons ${styles.downloadIcon}`}
                    translate='no'
                    aria-hidden='true'
                  >
                    download_2
                  </span>
                  <Text className={styles.fileTitle}>{attachment.name}</Text>
                  <IconButton
                    radius='full'
                    variant='soft'
                    onClick={() => {
                      window.open(attachment.url, '_blank');
                    }}
                  >
                    <span
                      className={`material-icons ${styles.attachmentLinkIcon}`}
                      translate='no'
                      aria-hidden='true'
                    >
                      open_in_new
                    </span>
                  </IconButton>
                  <IconButton
                    radius='full'
                    variant='soft'
                    onClick={() => {
                      onDeleteAttachment?.(attachment);
                    }}
                  >
                    <span
                      className={`material-icons ${styles.attachmentLinkIcon}`}
                      translate='no'
                      aria-hidden='true'
                    >
                      close
                    </span>
                  </IconButton>
                </Flex>
              );
            })}
            {attachedFiles.map((file) => {
              return (
                <Flex
                  className={styles.fileItem}
                  key={file.name + file.lastModified + file.size}
                  gap='2'
                >
                  <span
                    className={`material-icons ${styles.downloadIcon}`}
                    translate='no'
                    aria-hidden='true'
                  >
                    download_2
                  </span>
                  <Text className={styles.fileTitle}>{file.name}</Text>
                  <IconButton
                    radius='full'
                    variant='soft'
                    onClick={() => {
                      setAttachedFiles(attachedFiles.filter((f) => f.name !== file.name));
                    }}
                  >
                    <span
                      className={`material-icons ${styles.attachmentLinkIcon}`}
                      translate='no'
                      aria-hidden='true'
                    >
                      close
                    </span>
                  </IconButton>
                </Flex>
              );
            })}
          </Box>
        </Flex>
      </Box>
    </>
  );
}
