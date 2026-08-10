import {
  CompanyAttachmentsUpdatePayloadUpsertItemFileType,
  type CompanyInformationResponse,
} from '@/api/generated/models';
import { formatDateSlash } from '@/utils/dateUtils';
import type { UpdateCompanyInformationFormSchema } from './schemas';

export const responseToFormValues = (
  response?: CompanyInformationResponse | null
): UpdateCompanyInformationFormSchema => {
  // 初期状態で1行目を表示するために、未設定時は空の行を追加
  const offices = response?.offices?.length
    ? response.offices
    : [{ id: undefined, name: '', address: '' }];

  const attachments = response?.attachments?.length
    ? response.attachments
    : [
        {
          id: undefined,
          fileType:
            CompanyAttachmentsUpdatePayloadUpsertItemFileType.certificate_of_registered_matters,
          file: undefined,
        },
      ];

  const establishedAt = response?.companyInformation.establishedAt
    ? formatDateSlash(response?.companyInformation.establishedAt)
    : undefined;

  return {
    companyInformation: {
      name: response?.companyInformation.companyName,
      corporateNumber: response?.companyInformation.corporateNumber,
      postalCode: response?.companyInformation.postalCode,
      address: response?.companyInformation.address,
      director: response?.companyInformation.director,
      telNum: response?.companyInformation.telNum,
      faxNum: response?.companyInformation.faxNum,
      capital: response?.companyInformation.capital,
      employeesNum: response?.companyInformation.employeesNum,
      industryType: response?.companyInformation.industryType,
      sales: response?.companyInformation.sales,
      establishedAt: establishedAt,
    },
    offices: {
      deleteIds: undefined,
      upsert: offices.map((office) => ({
        id: office.id,
        name: office.name,
        address: office.address,
      })),
    },
    attachments: {
      deleteIds: undefined,
      upsert: attachments.map((attachment) => ({
        id: attachment.id,
        fileType: attachment.fileType,
        file: undefined,
      })),
    },
  };
};
