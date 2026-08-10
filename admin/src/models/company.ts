/**
 * 機能識別キー
 */
export type CompanyFeatureKey = typeof CompanyFeatureKey[keyof typeof CompanyFeatureKey];
export const CompanyFeatureKey = {
  ai_chat: 'ai_chat',
  proposal_document_create: 'proposal_document_create',
} as const;

export interface Feature {
  id: number;
  key: CompanyFeatureKey;
  description: string;
}

export interface Company {
  /** 会社ID */
  id: string;
  /** 会社名 */
  name: string;
  /** 機能一覧 */
  features: Feature[];
  /** トライアル契約かどうか */
  isTrial: boolean;
}
