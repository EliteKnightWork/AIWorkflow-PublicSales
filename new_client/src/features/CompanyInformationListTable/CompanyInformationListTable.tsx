'use client';

import { Box, Skeleton } from '@radix-ui/themes';
import type { CompanyInformationResponse } from '@/api/generated/models';
import { ListTable } from '@/entities/ListTable';
import { FormButton } from '@/shared/FormButton';
import { WithLabel } from '@/shared/WithLabel';
import { formatDateJa } from '@/utils/dateUtils';
import { formatPeople } from '@/utils/peopleUtils';
import { formatPrice } from '@/utils/priceUtils';
import { FILE_TYPE_OPTIONS } from '../CompanyInformationForm/constants';
import styles from './companyInformationListTable.module.css';

export type CompanyInformationListTableProps = {
  /** 会社情報のレスポンスデータ。undefined の場合は Skeleton を表示 */
  data?: CompanyInformationResponse;
  /** ローディング状態。true の場合は Skeleton を表示 */
  isLoading?: boolean;
  /** 編集ボタンのクリックハンドラ */
  onEditClick?: () => void;
};

/**
 * 会社情報をリスト形式で表示するコンポーネント
 */
export default function CompanyInformationListTable({
  data,
  isLoading: isLoadingProp,
  onEditClick,
}: CompanyInformationListTableProps) {
  const isLoading = isLoadingProp ?? data === undefined;

  // Skeletonコンポーネント
  const SkeletonText = () => <Skeleton className={styles.skeleton} />;

  const companyInfo = data?.companyInformation;
  const offices = data?.offices ?? [];
  const attachments = data?.attachments ?? [];

  // ListTableのitemsを構築
  const items = [
    {
      heading: '法人番号',
      content: isLoading ? <SkeletonText /> : (companyInfo?.corporateNumber ?? null),
    },
    {
      heading: '会社名',
      content: isLoading ? <SkeletonText /> : (companyInfo?.companyName ?? null),
    },
    {
      heading: '郵便番号',
      content: isLoading ? <SkeletonText /> : (companyInfo?.postalCode ?? null),
    },
    {
      heading: '住所',
      content: isLoading ? <SkeletonText /> : (companyInfo?.address ?? null),
    },
    {
      heading: '代表者名',
      content: isLoading ? <SkeletonText /> : (companyInfo?.director ?? null),
    },
    {
      heading: '電話番号',
      content: isLoading ? <SkeletonText /> : (companyInfo?.telNum ?? null),
    },
    {
      heading: 'FAX',
      content: isLoading ? <SkeletonText /> : (companyInfo?.faxNum ?? null),
    },
    {
      heading: '資本金',
      content: isLoading ? (
        <SkeletonText />
      ) : companyInfo?.capital !== null && companyInfo?.capital !== undefined ? (
        formatPrice(companyInfo.capital)
      ) : null,
    },
    {
      heading: '従業員数',
      content: isLoading ? (
        <SkeletonText />
      ) : companyInfo?.employeesNum !== null && companyInfo?.employeesNum !== undefined ? (
        formatPeople(companyInfo.employeesNum)
      ) : null,
    },
    {
      heading: '業種',
      content: isLoading ? <SkeletonText /> : (companyInfo?.industryType ?? null),
    },
    {
      heading: '売上高',
      content: isLoading ? (
        <SkeletonText />
      ) : companyInfo?.sales !== null && companyInfo?.sales !== undefined ? (
        formatPrice(companyInfo.sales)
      ) : null,
    },
    {
      heading: '設立年月日',
      content: isLoading ? (
        <SkeletonText />
      ) : companyInfo?.establishedAt ? (
        formatDateJa(companyInfo.establishedAt)
      ) : null,
    },
    {
      heading: '事業所情報',
      content: isLoading ? (
        <SkeletonText />
      ) : offices.length > 0 ? (
        <div className={styles.officeList}>
          {offices.map((office) => (
            <div key={office.id} className={styles.officeItem}>
              <div className={styles.officeName}>{office.name}</div>
              <div className={styles.officeAddress}>{office.address}</div>
            </div>
          ))}
        </div>
      ) : null,
    },
    {
      heading: '関連ファイル',
      content: isLoading ? (
        <SkeletonText />
      ) : attachments.length > 0 ? (
        <div className={styles.attachmentList}>
          {attachments.map((attachment) => (
            <div key={attachment.id} className={styles.attachmentItem}>
              <div className={styles.attachmentFileType}>
                {FILE_TYPE_OPTIONS.find((option) => option.value === attachment.fileType)?.label}
              </div>
              <a
                href={attachment.url}
                target='_blank'
                rel='noopener noreferrer'
                className={styles.attachmentLink}
              >
                {attachment.name}
              </a>
            </div>
          ))}
        </div>
      ) : null,
    },
  ];

  return (
    <Box className={styles.container}>
      <WithLabel
        label='基本情報'
        actions={
          onEditClick && (
            <FormButton size='small' border onClick={onEditClick} disabled={isLoading}>
              基本情報を編集
              <span className='material-icons' translate='no' aria-hidden='true'>
                edit
              </span>
            </FormButton>
          )
        }
      >
        <ListTable items={items} />
      </WithLabel>
    </Box>
  );
}
