import { CompanyAttachmentsUpdatePayloadUpsertItemFileType } from '@/api/generated/models';

export const FILE_TYPE_OPTIONS = [
  {
    value: CompanyAttachmentsUpdatePayloadUpsertItemFileType.certificate_of_registered_matters,
    label: '登記簿',
  },
  {
    value: CompanyAttachmentsUpdatePayloadUpsertItemFileType.financial_statements,
    label: '財務諸表',
  },
  {
    value: CompanyAttachmentsUpdatePayloadUpsertItemFileType.tax_payment_certificate,
    label: '納税証明書',
  },
  {
    value: CompanyAttachmentsUpdatePayloadUpsertItemFileType.list_of_executives,
    label: '役員名簿',
  },
  {
    value: CompanyAttachmentsUpdatePayloadUpsertItemFileType.permits_and_licenses,
    label: '許認可',
  },
  { value: CompanyAttachmentsUpdatePayloadUpsertItemFileType.others, label: 'その他' },
];
