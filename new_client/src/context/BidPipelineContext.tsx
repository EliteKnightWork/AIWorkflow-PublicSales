'use client';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { addBidPipeline, deleteBidPipeline } from '@/api/generated/endpoints/bid-pipelines';
import { useGetCurrentUser } from '@/api/generated/endpoints/users';
import type { BidPipeline } from '@/api/generated/models';
import ConfirmDeleteBidPipelineDialog from '@/app/_components/confirmDeleteBidPipelineDialog/ConfirmDeleteBidPipelineDialog';
import { useToast } from './ToastContext';

type BidPipelineContextType = {
  confirmDeleteBidPipelineInfo:
    | {
        pipelineId: string;
        callback: () => void;
        errorCallback: () => void;
      }
    | undefined;
  openConfirmDeleteBidPipelineDialog: (
    uuid: string,
    callback: () => void,
    errorCallback: () => void
  ) => void;
  closeConfirmDeleteBidPipelineDialog: () => void;
  handleAddBidPipeline: (uuid: string, callback: (res: BidPipeline) => void) => Promise<void>;
  handleRemoveBidPipeline: (uuid: string) => Promise<void>;
};

const BidPipelineContext = createContext<BidPipelineContextType | undefined>(undefined);

export const useBidPipeline = () => {
  const context = useContext(BidPipelineContext);
  if (!context) {
    throw new Error('useBidPipeline must be used within a BidPipelineProvider');
  }
  return context;
};

export const BidPipelineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [confirmDeleteBidPipelineInfo, setConfirmDeleteBidPipelineInfo] = useState<
    | {
        pipelineId: string;
        callback: () => void;
        errorCallback: () => void;
      }
    | undefined
  >(undefined);

  const openConfirmDeleteBidPipelineDialog = useCallback(
    (pipelineId: string, callback: () => void = () => {}, errorCallback: () => void = () => {}) => {
      setConfirmDeleteBidPipelineInfo({ pipelineId, callback, errorCallback });
    },
    []
  );

  const closeConfirmDeleteBidPipelineDialog = useCallback(() => {
    setConfirmDeleteBidPipelineInfo(undefined);
  }, []);

  const { enqueueToast } = useToast();
  const { data: currentUser } = useGetCurrentUser();

  const handleAddBidPipeline = useCallback(
    async (uuid: string, callback: (res: BidPipeline) => void) => {
      // 現在のユーザーを担当者として含める
      const assignedUserIds = currentUser?.id ? [currentUser.id] : [];

      addBidPipeline({
        project_uuid: uuid,
        assigned_user_ids: assignedUserIds,
      })
        .then((res) => {
          enqueueToast('案件管理に追加しました');
          callback(res);
        })
        .catch((e) => {
          enqueueToast('案件管理への追加に失敗しました');
          throw e;
        });
    },
    [enqueueToast, currentUser?.id]
  );

  const handleRemoveBidPipeline = useCallback(
    async (pipelineId: string) => {
      deleteBidPipeline(pipelineId)
        .then(() => {
          enqueueToast('案件管理から削除しました');
        })
        .catch((_) => {
          enqueueToast('案件管理からの削除に失敗しました');
        });
    },
    [enqueueToast]
  );

  const value = React.useMemo(
    () => ({
      confirmDeleteBidPipelineInfo,
      openConfirmDeleteBidPipelineDialog,
      closeConfirmDeleteBidPipelineDialog,
      handleAddBidPipeline,
      handleRemoveBidPipeline,
    }),
    [
      confirmDeleteBidPipelineInfo,
      openConfirmDeleteBidPipelineDialog,
      closeConfirmDeleteBidPipelineDialog,
      handleAddBidPipeline,
      handleRemoveBidPipeline,
    ]
  );

  return (
    <BidPipelineContext.Provider value={value}>
      <ConfirmDeleteBidPipelineDialog />
      {children}
    </BidPipelineContext.Provider>
  );
};
