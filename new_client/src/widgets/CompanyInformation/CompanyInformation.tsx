'use client';

import { Box } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { updateCompanyInformation } from '@/api/generated/endpoints/company-information';
import type {
  CompanyInformationResponse,
  UpdateCompanyInformationBody,
} from '@/api/generated/models';
import { useToast } from '@/context/ToastContext';
import CompanyInformationForm from '@/features/CompanyInformationForm/CompanyInformationForm';
import CompanyInformationListTable from '@/features/CompanyInformationListTable/CompanyInformationListTable';
import OverlayModal from '@/shared/OverlayModal/OverlayModal';
import styles from './companyInformation.module.css';

export type CompanyInformationProps = {
  /** 会社情報のレスポンスデータ。undefined の場合は Skeleton を表示 */
  data: CompanyInformationResponse;
};

/**
 * 会社情報を表示・編集するウィジェットコンポーネント
 * CompanyInformationListTable、OverlayModal、CompanyInformationFormを統合
 */
export default function CompanyInformation({ data }: CompanyInformationProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { enqueueToast } = useToast();

  const handleEditClick = () => {
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (values: UpdateCompanyInformationBody) => {
    try {
      await updateCompanyInformation(values);
      enqueueToast('会社情報を更新しました', 'success');
      setIsModalOpen(false);
      router.refresh();
    } catch {
      enqueueToast('会社情報の更新に失敗しました', 'error');
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <Box className={styles.container}>
      <CompanyInformationListTable data={data} onEditClick={handleEditClick} />
      <OverlayModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title='基本情報'
        maxContentWidth='720px'
        height='90vh'
      >
        <CompanyInformationForm
          initialValue={data ?? null}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
        />
      </OverlayModal>
    </Box>
  );
}
