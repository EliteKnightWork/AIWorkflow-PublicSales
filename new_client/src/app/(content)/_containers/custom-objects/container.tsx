'use client';

import { useState } from 'react';
import {
  useDeleteCustomObjectTemplate,
  useGetCustomObjectTemplates,
} from '@/api/generated/endpoints/custom-object-templates';
import AppOverlayModal from '@/components/appOverlayModal/AppOverlayModal';
import { CreateCustomObjectModalContent } from './_components/CreateCustomObjectModal';
import { EditCustomObjectModalContent } from './_components/EditCustomObjectModal';
import { CustomObjectsPresentational } from './presentational';

export const CustomObjectsContainer = () => {
  const { data, isLoading, error, refetch } = useGetCustomObjectTemplates();
  const deleteTemplateMutation = useDeleteCustomObjectTemplate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [isEditDirty, setIsEditDirty] = useState(false);

  const handleCreateNew = () => {
    setIsModalOpen(true);
  };

  const handleDeleteItem = (id: number) => {
    const template = data?.find((t) => t.id === id);
    if (!template) return;
    const ok = window.confirm(
      `「${template.title}」を削除します。\nこの項目を利用中の案件がある場合、項目を削除するとそれらのデータも同時に削除されます。本当に削除しますか？`
    );
    if (!ok) return;

    // そのまま削除を実行する（専用ダイアログは使わない）
    deleteTemplateMutation.mutate(
      { id: template.id },
      {
        onSuccess: () => {
          refetch();
        },
        onError: (error) => {
          console.error('削除に失敗しました:', error);
          // TODO: エラートーストを表示
        },
      }
    );
  };

  const handleEditItem = (id: number) => {
    setEditingTemplateId(id);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const confirmCloseEditModal = () => {
    if (
      !isEditDirty ||
      window.confirm('まだ編集内容を保存していません。カスタム項目の画面に戻っても良いですか？')
    ) {
      setEditingTemplateId(null);
      setIsEditDirty(false);
    }
  };

  const handleModalSave = (title: string, items: any[]) => {
    // TODO: API呼び出しでテンプレートを作成する
    console.log('テンプレートを作成:', { title, items });
    setIsModalOpen(false);
    refetch();
  };

  return (
    <>
      <CustomObjectsPresentational
        templates={data || []}
        isLoading={isLoading}
        error={error}
        onCreateNew={handleCreateNew}
        onEditItem={handleEditItem}
        onDeleteItem={handleDeleteItem}
      />
      <AppOverlayModal
        title='カスタム項目を新規作成する'
        contentComponent={
          <CreateCustomObjectModalContent onSave={handleModalSave} onCancel={handleModalClose} />
        }
        isOpen={isModalOpen}
        onClose={handleModalClose}
        modalWidth='920px'
      />
      <AppOverlayModal
        title='カスタム項目を編集する'
        contentComponent={
          editingTemplateId ? (
            <EditCustomObjectModalContent
              templateId={editingTemplateId}
              onSaved={() => {
                setEditingTemplateId(null);
                setIsEditDirty(false);
                refetch();
              }}
              onCancel={confirmCloseEditModal}
              onDirtyChange={setIsEditDirty}
            />
          ) : null
        }
        isOpen={!!editingTemplateId}
        onClose={confirmCloseEditModal}
        modalWidth='920px'
      />
    </>
  );
};
