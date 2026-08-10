import { UpdateCompanyProjectBodyProjectSecurityQualificationsItem } from '@/api/generated/models';

export const UNNECESSARY_SECURITY_ITEM = '不要';
export const SECURITY_SELECTABLE_ITEMS = Object.values(
  UpdateCompanyProjectBodyProjectSecurityQualificationsItem
).filter(
  (v) => v !== UNNECESSARY_SECURITY_ITEM
) as UpdateCompanyProjectBodyProjectSecurityQualificationsItem[];
