'use client';

import { Box, Button, Flex, IconButton, Text, TextArea } from '@radix-ui/themes';
import { useEffect, useMemo, useState } from 'react';
import {
  addCompanyProjectAttachment,
  deleteCompanyProjectAttachment,
} from '@/api/generated/endpoints/company-project-attachments';
import { getProject } from '@/api/generated/endpoints/projects';
import type {
  ProcedureType as ApiProcedureType,
  Attachment,
  BidPipeline,
  BidPipelineStatus,
  Project,
  UpdateCompanyProjectBody,
  UpdateCompanyProjectBodyProjectSecurityQualificationsItem,
  User,
} from '@/api/generated/models';
import { AppDatePicker } from '@/app/(content)/_components/datePicker/AppDatePicker';
import { ChipList } from '@/app/(content)/management/_components/chipList/ChipList';
import { getPipelineStatusColors } from '@/app/(content)/management/types';
import { SearchFilterQualificationsList } from '@/app/(content)/mypage/_components/searchFilterQualificationsList/SearchFilterQualificationsList';
import type { ParticipateQualificationSearchParams } from '@/app/(content)/mypage/types';
import { convertParamsToChips } from '@/app/(content)/mypage/utils';
import { ProcedureList } from '@/app/(content)/projects/_containers/project-search/types';
import AppOverlayModal from '@/components/appOverlayModal/AppOverlayModal';
import { AppCheckbox } from '@/components/checkbox/AppCheckbox';
import LoadingSpinner from '@/components/loadingSpinner/LoadingSpinner';
import { AppRadio } from '@/components/radiobutton/AppRadio';
import { useToast } from '@/context/ToastContext';
import { useParticipateQualifications } from '@/hooks/useParticipateQualifications';
import { convertDateToYYYYMMDD } from '@/utils/dateUtils';
import { prefecturesWithRegionList } from '@/utils/regionUtils';
import FileUpload from '../taskForm/fileUpload/FileUpload';
import { TaskFormMultiSelect } from '../taskForm/select/TaskFormMultiSelect';
import { TaskFormSelect } from '../taskForm/select/TaskFormSelect';
import { SECURITY_SELECTABLE_ITEMS } from './constants';
import { NotifyTitleRequiredDialog } from './notifyCreateErrorDialog';
import { PipelineEditFilterableSelect } from './select/PipelineEditFilterableSelect';
import { PipelineEditSelect } from './select/PipelineEditSelect';
import styles from './styles.module.css';

export type PipelineEditForm = {
  pipeline?: BidPipeline;
  project?: UpdateCompanyProjectBody;
};

type Props = {
  pipeline?: BidPipeline;
  users: User[];
  statuses: BidPipelineStatus[];
  onClose?: () => void;
  onBack?: () => void;
  onSubmit?: (form: PipelineEditForm) => Promise<void> | void;
  selectRef?: React.RefObject<HTMLDivElement>;
};

// 編集用の入札案件フォーム
export default function PipelineEditCard({
  pipeline,
  users,
  statuses,
  onClose,
  onBack,
  onSubmit,
  selectRef,
}: Props) {
  const [project, setProject] = useState<Project | undefined>(undefined);
  // サーバーに存在する添付ファイル（初期表示時にproject.attachmentsを反映）
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  // ローカルでアップロード中のファイル（進行中表示用）
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNotifyErrorDialog, setShowNotifyErrorDialog] = useState(false);

  const [form, setForm] = useState<PipelineEditForm>({});

  const [isQualificationsListModalOpen, setIsQualificationsListModalOpen] = useState(false);
  const [chipStrings, setChipStrings] = useState<string[]>([]);
  const { enqueueToast } = useToast();

  // fetch project for selected pipeline
  useEffect(() => {
    if (pipeline?.project?.uuid) {
      try {
        getProject(pipeline.project.uuid).then((res) => setProject(res));
      } catch {
        onClose?.();
        enqueueToast('案件情報の取得に失敗しました', 'error');
      }
    }
  }, [pipeline?.project?.uuid]);

  // initialize form from fetched project/pipeline
  useEffect(() => {
    if (!project || !pipeline) return;

    setForm({
      pipeline: pipeline,
      project: {
        title: project.title,
        procedureType: (project.procedureType as ApiProcedureType) ?? undefined,
        organizationName: project.organizationName,
        publicationDate: project.publicationDate,
        applicationDocumentDeadlineDate: project.applicationDocumentDeadlineDate,
        proposalDocumentDeadlineDate: project.proposalDocumentDeadlineDate ?? undefined,
        biddingDeadlineDate: project.biddingDeadlineDate,
        plannedPrice: project.plannedPrice,
        isExperienceRequired: project.isExperienceRequired,
        isOfficeRequired: project.isOfficeRequired,
        prefectures: project.prefectures,
        projectSecurityQualifications: (project.projectSecurityQualifications ??
          []) as UpdateCompanyProjectBodyProjectSecurityQualificationsItem[],
        participateQualificationGradeIds:
          project.participateQualificationGrades?.map((g) => g.id) ?? [],
        summary: project.summary ?? undefined,
      },
    });
    // 初期表示の添付ファイル反映
    setAttachments(project.attachments ?? []);
  }, [project, pipeline]);

  // Chips display for participate qualifications
  const { data: qualificationsForChips } = useParticipateQualifications({
    gradeIds: form.project?.participateQualificationGradeIds,
  });

  useEffect(() => {
    const params: ParticipateQualificationSearchParams = {
      participateQualificationGradeIds: form.project?.participateQualificationGradeIds,
    } as ParticipateQualificationSearchParams;
    const chips = convertParamsToChips(params, qualificationsForChips || []);
    setChipStrings(chips);
  }, [form.project?.participateQualificationGradeIds, qualificationsForChips]);

  const prefectureItems = useMemo(
    () =>
      prefecturesWithRegionList
        .flatMap((g) => g.prefectures)
        .map((p) => ({ id: p.name, value: p.name })),
    []
  );

  const selectedStatusDisplay = useMemo(() => {
    const currentStatusId = form.pipeline?.status?.id ?? pipeline?.status?.id;
    const s = statuses.find((st) => st.id === currentStatusId);
    return { id: s?.id?.toString() ?? '', value: s?.name ?? '-' };
  }, [form.pipeline?.status?.id, pipeline?.status?.id, statuses]);

  // 日付の依存関係（Project#check_date に準拠）
  const publicationDateObj = useMemo(
    () => (form.project?.publicationDate ? new Date(form.project.publicationDate) : undefined),
    [form.project?.publicationDate]
  );
  const applicationDeadlineDateObj = useMemo(
    () =>
      form.project?.applicationDocumentDeadlineDate
        ? new Date(form.project.applicationDocumentDeadlineDate)
        : undefined,
    [form.project?.applicationDocumentDeadlineDate]
  );
  const proposalDeadlineDateObj = useMemo(
    () =>
      form.project?.proposalDocumentDeadlineDate
        ? new Date(form.project.proposalDocumentDeadlineDate)
        : undefined,
    [form.project?.proposalDocumentDeadlineDate]
  );
  const biddingDeadlineDateObj = useMemo(
    () =>
      form.project?.biddingDeadlineDate ? new Date(form.project.biddingDeadlineDate) : undefined,
    [form.project?.biddingDeadlineDate]
  );
  // application >= publication（publication がある場合）
  const applicationMinDate = publicationDateObj;
  // proposal >= application（なければ publication）
  const proposalMinDate = useMemo(
    () => applicationDeadlineDateObj ?? publicationDateObj,
    [applicationDeadlineDateObj, publicationDateObj]
  );
  // bidding >= max(publication, application, proposal) のうち存在するもの
  const biddingMinDate = useMemo(() => {
    const candidates = [
      publicationDateObj,
      applicationDeadlineDateObj,
      proposalDeadlineDateObj,
    ].filter(Boolean) as Date[];
    if (candidates.length === 0) return undefined;
    const maxTime = Math.max(...candidates.map((d) => d.getTime()));
    return new Date(maxTime);
  }, [publicationDateObj, applicationDeadlineDateObj, proposalDeadlineDateObj]);

  // 逆方向の制約も付与して、どの順序でも入力可能にする
  // publication の上限は（存在する場合）application/proposal/bidding の最小値
  const publicationMaxDate = useMemo(() => {
    const candidates = [
      applicationDeadlineDateObj,
      proposalDeadlineDateObj,
      biddingDeadlineDateObj,
    ].filter(Boolean) as Date[];
    if (candidates.length === 0) return undefined;
    const minTime = Math.min(...candidates.map((d) => d.getTime()));
    return new Date(minTime);
  }, [applicationDeadlineDateObj, proposalDeadlineDateObj, biddingDeadlineDateObj]);
  // application の上限は（存在する場合）proposal/bidding の最小値
  const applicationMaxDate = useMemo(() => {
    const candidates = [proposalDeadlineDateObj, biddingDeadlineDateObj].filter(Boolean) as Date[];
    if (candidates.length === 0) return undefined;
    const minTime = Math.min(...candidates.map((d) => d.getTime()));
    return new Date(minTime);
  }, [proposalDeadlineDateObj, biddingDeadlineDateObj]);
  // proposal の上限は（存在する場合）bidding
  const proposalMaxDate = biddingDeadlineDateObj;

  const handleSubmit = async () => {
    if (!form.project?.title || form.project.title.trim().length === 0) {
      setShowNotifyErrorDialog(true);
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit?.({ ...form, project: { ...form.project } });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 添付ファイルの追加（即時アップロード）
  const handleAddAttachments = async (files: File[]) => {
    const companyProjectId = project?.companyProjectId;
    if (!companyProjectId) return;

    // 既存のアップロード中リストに追加して表示（重複除外）
    const newFiles = files.filter(
      (nf) =>
        !uploadingFiles.some(
          (ef) => ef.name === nf.name && ef.size === nf.size && ef.lastModified === nf.lastModified
        )
    );
    if (newFiles.length === 0) return;
    setUploadingFiles((prev) => [...prev, ...newFiles]);

    try {
      const results = await Promise.allSettled(
        newFiles.map((file) =>
          addCompanyProjectAttachment(companyProjectId, {
            'attachment[file]': file,
          })
            .then((res) => {
              enqueueToast(`ファイル名${file.name}を追加しました`, 'success');
              return res;
            })
            .catch((e) => {
              enqueueToast(`ファイル名${file.name}の追加に失敗しました`, 'error');
              throw e;
            })
        )
      );

      const successful = results
        .filter((r): r is PromiseFulfilledResult<Attachment> => r.status === 'fulfilled')
        .map((r) => r.value);

      if (successful.length > 0) {
        setAttachments((prev) => [...prev, ...successful]);
      }

      const failedCount = results.filter((r) => r.status === 'rejected').length;
      if (failedCount > 0 && successful.length > 0) {
        enqueueToast(
          `${newFiles.length}個中${successful.length}個のファイルを追加しました。${failedCount}個は失敗しました。`,
          'info'
        );
      } else if (failedCount === newFiles.length) {
        enqueueToast('すべてのファイルのアップロードに失敗しました', 'error');
      }
    } finally {
      // 表示からアップロード中のファイルを除去
      setUploadingFiles((prev) => prev.filter((f) => !newFiles.includes(f)));
    }
  };

  // 添付ファイルの削除（即時削除）
  const handleDeleteAttachment = async (attachment: Attachment) => {
    const companyProjectId = project?.companyProjectId;
    if (!companyProjectId || !attachment.id) return;

    // 楽観的更新
    const prev = attachments;
    setAttachments((list) => list.filter((a) => a.id !== attachment.id));

    try {
      await deleteCompanyProjectAttachment(companyProjectId, Number(attachment.id));
      enqueueToast('ファイルを削除しました', 'success');
    } catch {
      // 失敗時は元に戻す
      setAttachments(prev);
      enqueueToast('ファイル削除に失敗しました', 'error');
    }
  };

  if (!project || !pipeline || isSubmitting) {
    return (
      <Box className={styles.loadingBox}>
        <LoadingSpinner />
      </Box>
    );
  }

  return (
    <Box className={styles.content}>
      <NotifyTitleRequiredDialog
        isOpen={showNotifyErrorDialog}
        onClose={() => setShowNotifyErrorDialog(false)}
        modalRef={selectRef}
      />
      {/* Header area */}
      <Flex align='center' justify='between' className={styles.taskTitleArea} gap='4'>
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

        <input
          className={styles.taskTitleInput}
          placeholder='タイトルを入力'
          value={form.project?.title ?? ''}
          onChange={(e) =>
            setForm({ ...form, project: { ...form.project, title: e.target.value } })
          }
        />
        <Flex align='center' gap='3'>
          <IconButton radius='full' variant='soft' onClick={onClose}>
            <span className='material-icons' translate='no' aria-hidden='true'>
              close
            </span>
          </IconButton>
        </Flex>
      </Flex>

      {/* Status */}
      <Flex direction='column' gap='4'>
        <Box className={styles.formTitle}>案件ステータス</Box>
        <TaskFormSelect
          triggerNode={
            <Box>
              <Box
                className={`${styles.selectedTab} ${styles.selectedStatusTab}`}
                style={{
                  color: getPipelineStatusColors(
                    statuses.find((st) => st.id?.toString() === selectedStatusDisplay.id)?.stage ??
                      ''
                  ).color,
                  border: `1px solid ${
                    getPipelineStatusColors(
                      statuses.find((st) => st.id?.toString() === selectedStatusDisplay.id)
                        ?.stage ?? ''
                    ).borderColor
                  }`,
                }}
              >
                {selectedStatusDisplay.value}
              </Box>
            </Box>
          }
          items={statuses.map((st) => ({ id: st.id?.toString() ?? '', value: st.name ?? '' }))}
          selectedItem={selectedStatusDisplay}
          onSelect={(item) => {
            setForm({
              ...form,
              pipeline: { ...form.pipeline, status: { id: Number(item.id), name: item.value } },
            });
          }}
          selectRef={selectRef}
        />
      </Flex>

      {/* Assignees */}
      <Flex direction='column' gap='4'>
        <Box className={styles.formTitle}>担当者</Box>
        <TaskFormMultiSelect
          triggerNode={
            <Box>
              {form.pipeline?.assignedUsers && form.pipeline.assignedUsers.length > 0 ? (
                <Flex direction='row' gap='1' wrap='wrap'>
                  {form.pipeline.assignedUsers.map((assignedUser) => {
                    const user = users.find((u) => u.id === assignedUser.id);
                    return (
                      <Box
                        key={user?.id}
                        className={`${styles.selectedTab} ${styles.selectedAssignedUserTab}`}
                      >
                        {user?.name ?? user?.email ?? '-'}
                      </Box>
                    );
                  })}
                </Flex>
              ) : (
                '担当者を選択'
              )}
            </Box>
          }
          items={users.map((u) => ({ id: u.id?.toString() ?? '', value: u.name ?? u.email ?? '' }))}
          selectedIds={(form.pipeline?.assignedUsers ?? []).map((au) => au.id?.toString() ?? '')}
          onSelectionChange={(ids) => {
            const selected = ids
              .map((id) => users.find((u) => u.id?.toString() === id)?.id)
              .filter(Boolean) as number[];
            setForm({
              ...form,
              pipeline: {
                ...form.pipeline,
                assignedUsers: users.filter((u) => selected.includes(u.id ?? -1)),
              },
            });
          }}
          selectRef={selectRef}
          maxSelection={2}
        />
      </Flex>

      {/* Prefecture */}
      <Flex direction='column' gap='4'>
        <Box className={styles.formTitle}>都道府県</Box>
        <PipelineEditFilterableSelect
          options={prefectureItems}
          placeholder='未入力'
          selectedId={form.project?.prefectures?.[0] || null}
          onChange={(item) =>
            setForm({ ...form, project: { ...form.project, prefectures: item ? [item] : [] } })
          }
        />
      </Flex>

      {/* Procedure Type (simple dropdown, no search) */}
      <Flex direction='column' gap='4'>
        <Box className={styles.formTitle}>入札方式</Box>
        <PipelineEditSelect
          options={ProcedureList.map((pt) => ({ id: pt, value: pt }))}
          placeholder='未入力'
          selectedId={form.project?.procedureType ?? null}
          onChange={(id) =>
            setForm({
              ...form,
              project: {
                ...form.project,
                procedureType: (ProcedureList.find((p) => p === id) ?? null) as ApiProcedureType,
              },
            })
          }
        />
      </Flex>

      {/* Organization */}
      <Flex direction='column' gap='4'>
        <Box className={styles.formTitle}>発注機関</Box>
        <input
          className={styles.input}
          placeholder='発注機関名を入力'
          value={form.project?.organizationName ?? ''}
          onChange={(e) =>
            setForm({ ...form, project: { ...form.project, organizationName: e.target.value } })
          }
        />
      </Flex>

      {/* Dates */}
      <Flex direction='column' gap='4'>
        <Box className={styles.formTitle}>公告日</Box>
        <AppDatePicker
          inputClassName={styles.input}
          value={form.project?.publicationDate ? new Date(form.project.publicationDate) : undefined}
          maxDate={publicationMaxDate}
          onChange={(date) =>
            setForm({
              ...form,
              project: {
                ...form.project,
                publicationDate: date ? convertDateToYYYYMMDD(date) : undefined,
              },
            })
          }
        />
      </Flex>

      <Flex direction='column' gap='4'>
        <Flex justify='between' align='center'>
          <Box className={styles.formTitle}>参加申し込み期日</Box>
          {/* カレンダー連携のUIは参照実装に倣い、ここでは割愛 */}
        </Flex>
        <AppDatePicker
          inputClassName={styles.input}
          value={
            form.project?.applicationDocumentDeadlineDate
              ? new Date(form.project.applicationDocumentDeadlineDate)
              : undefined
          }
          minDate={applicationMinDate}
          maxDate={applicationMaxDate}
          onChange={(date) =>
            setForm({
              ...form,
              project: {
                ...form.project,
                applicationDocumentDeadlineDate: date ? convertDateToYYYYMMDD(date) : undefined,
              },
            })
          }
        />
      </Flex>

      <Flex direction='column' gap='4'>
        <Flex justify='between' align='center'>
          <Box className={styles.formTitle}>提案書期日</Box>
        </Flex>
        <AppDatePicker
          inputClassName={styles.input}
          value={
            form.project?.proposalDocumentDeadlineDate
              ? new Date(form.project.proposalDocumentDeadlineDate)
              : undefined
          }
          minDate={proposalMinDate}
          maxDate={proposalMaxDate}
          onChange={(date) =>
            setForm({
              ...form,
              project: {
                ...form.project,
                proposalDocumentDeadlineDate: date ? convertDateToYYYYMMDD(date) : undefined,
              },
            })
          }
        />
      </Flex>

      <Flex direction='column' gap='4'>
        <Box className={styles.formTitle}>入札日</Box>
        <AppDatePicker
          inputClassName={styles.input}
          value={
            form.project?.biddingDeadlineDate
              ? new Date(form.project.biddingDeadlineDate)
              : undefined
          }
          minDate={biddingMinDate}
          onChange={(date) =>
            setForm({
              ...form,
              project: {
                ...form.project,
                biddingDeadlineDate: date ? convertDateToYYYYMMDD(date) : undefined,
              },
            })
          }
        />
      </Flex>

      {/* Price */}
      <Flex direction='column' gap='4'>
        <Box className={styles.formTitle}>予定価格</Box>
        <input
          className={styles.input}
          placeholder='入力してください'
          type='number'
          min={0}
          value={form.project?.plannedPrice?.toString() ?? ''}
          onChange={(e) =>
            setForm({
              ...form,
              project: {
                ...form.project,
                plannedPrice: e.target.value ? Number(e.target.value) : undefined,
              },
            })
          }
        />
      </Flex>

      {/* Participate Qualifications */}
      <Flex direction='column' gap='3'>
        <Box className={styles.formTitle}>入札参加資格</Box>
        <Box
          className={`${styles.input} ${styles.qualificationsBox}`}
          onClick={() => setIsQualificationsListModalOpen(true)}
        >
          {chipStrings.length > 0 ? (
            <ChipList inputChips={chipStrings} />
          ) : (
            <span className={styles.placeholderText}>入力してください</span>
          )}
          <span className={`material-icons ${styles.arrowIcon}`}>keyboard_arrow_down</span>
        </Box>
      </Flex>

      {/* Experience (Radio) */}
      <Flex direction='column' gap='3'>
        <Box className={styles.formTitle}>実績</Box>
        <Flex direction='row' wrap='wrap' gap='12px'>
          {[
            { value: true, label: 'あり' },
            { value: false, label: 'なし' },
          ].map((opt) => (
            <AppRadio
              key={opt.value.toString()}
              name='experienceRequired'
              value={opt.value.toString()}
              label={opt.label}
              inputClassName={styles.input}
              checked={form.project?.isExperienceRequired === opt.value}
              onChange={() =>
                setForm({ ...form, project: { ...form.project, isExperienceRequired: opt.value } })
              }
              onClick={() =>
                setForm({
                  ...form,
                  project: {
                    ...form.project,
                    isExperienceRequired:
                      form.project?.isExperienceRequired === opt.value ? undefined : opt.value,
                  },
                })
              }
            />
          ))}
        </Flex>
      </Flex>

      {/* Office requirement (Radio) */}
      <Flex direction='column' gap='3'>
        <Box className={styles.formTitle}>事業所要件</Box>
        <Flex direction='row' wrap='wrap' gap='12px'>
          {[
            { value: true, label: 'あり' },
            { value: false, label: 'なし' },
          ].map((opt) => (
            <AppRadio
              key={opt.value.toString()}
              name='officeRequired'
              value={opt.value.toString()}
              label={opt.label}
              inputClassName={styles.input}
              checked={form.project?.isOfficeRequired === opt.value}
              onChange={() =>
                setForm({ ...form, project: { ...form.project, isOfficeRequired: opt.value } })
              }
              onClick={() =>
                setForm({
                  ...form,
                  project: {
                    ...form.project,
                    isOfficeRequired:
                      form.project?.isOfficeRequired === opt.value ? undefined : opt.value,
                  },
                })
              }
            />
          ))}
        </Flex>
      </Flex>

      {/* Security qualifications */}
      <Flex direction='column' gap='3'>
        <Box className={styles.formTitle}>情報セキュリティ</Box>
        <Flex direction='row' gap='3' wrap='wrap'>
          {SECURITY_SELECTABLE_ITEMS.map((q) => {
            const current = new Set(form.project?.projectSecurityQualifications ?? []);
            const checked = current.has(q);
            return (
              <AppCheckbox
                key={q}
                label={q}
                checked={checked}
                parentBoxClassName={styles.checkBoxParentBox}
                parentBoxCheckedClassName={styles.checkBoxParentBoxChecked}
                checkBoxCheckedClassName={styles.checkBoxChecked}
                checkedTextClassName={styles.checkBoxCheckedText}
                onChange={(isChecked) => {
                  const set = new Set(form.project?.projectSecurityQualifications ?? []);
                  if (isChecked) {
                    set.add(q);
                  } else {
                    set.delete(q);
                  }
                  setForm({
                    ...form,
                    project: {
                      ...form.project,
                      projectSecurityQualifications: Array.from(set),
                    },
                  });
                }}
              />
            );
          })}
        </Flex>
      </Flex>

      {/* Summary */}
      <Flex direction='column' gap='4'>
        <Box className={styles.formTitle}>サマリ</Box>
        <TextArea
          className={`${styles.input} ${styles.inputTextArea}`}
          value={form.project?.summary ?? ''}
          onChange={(e) =>
            setForm({ ...form, project: { ...form.project, summary: e.target.value } })
          }
          resize='vertical'
        />
      </Flex>

      {/* Attachments */}
      <Flex id='pipeline-edit-upload-section' direction='column' gap='4'>
        <FileUpload
          multiple={true}
          titleNode={<Box className={styles.formTitle}>資料</Box>}
          onFileAdd={handleAddAttachments}
        />

        <Box className={styles.fileList}>
          {/* 既存の添付ファイル */}
          {attachments.map((attachment) => (
            <Flex
              className={styles.fileItem}
              key={`${attachment.id ?? attachment.url ?? attachment.name}`}
              gap='2'
            >
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
                  if (attachment.url) {
                    window.open(attachment.url, '_blank');
                  }
                }}
                aria-label='open-file'
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
                onClick={() => handleDeleteAttachment(attachment)}
                aria-label='remove-file'
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
          ))}

          {/* アップロード中のファイル表示 */}
          {uploadingFiles.map((file) => (
            <Flex
              className={styles.fileItem}
              key={`${file.name}-${file.lastModified}-${file.size}`}
              gap='2'
            >
              <span
                className={`material-icons ${styles.downloadIcon}`}
                translate='no'
                aria-hidden='true'
              >
                download_2
              </span>
              <Text className={styles.fileTitle}>{file.name}（アップロード中...）</Text>
            </Flex>
          ))}
        </Box>
      </Flex>

      {/* Submit Button */}
      <Button className={styles.saveButton} onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? '登録中...' : '登録する'}
      </Button>

      {/* 入札参加資格モーダル */}
      <AppOverlayModal
        title={'入札参加資格を選択'}
        modalHeight={'82%'}
        modalWidth={'80vw'}
        contentComponent={
          <SearchFilterQualificationsList
            types={[]}
            prefectures={[]}
            qualificationIds={[]}
            hideNoQualification={true}
            gradeIds={form.project?.participateQualificationGradeIds}
            onSelect={(selectedParams: ParticipateQualificationSearchParams) => {
              setForm({
                ...form,
                project: {
                  ...form.project,
                  participateQualificationGradeIds:
                    selectedParams.participateQualificationGradeIds ?? undefined,
                },
              });
              setIsQualificationsListModalOpen(false);
            }}
            onCancel={() => setIsQualificationsListModalOpen(false)}
            selectableTypes={['grade']}
          />
        }
        isOpen={isQualificationsListModalOpen}
        onClose={() => setIsQualificationsListModalOpen(false)}
      />
    </Box>
  );
}
