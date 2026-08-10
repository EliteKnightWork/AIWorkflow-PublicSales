import { ParticipateQualification } from "./participateQualification";

export interface Project {
  /** 入札日 */
  biddingDeadlineDate?: string;
  /** 入札説明会日 */
  briefingSessionDate?: string;
  /** 公告文 */
  description?: string;
  /** 応募書類提出期日 */
  applicationDocumentDeadlineDate?: string;
  /** 提案書提出期日 */
  proposalDocumentDeadlineDate?: string;
  manualInputId: boolean;
  /** 事業所の有無 */
  isExperienceRequired: boolean;
  /** 事業所の有無 */
  isOfficeRequired?: boolean;
  /** 等級 */
  grades?: string[];
  /** セキュリティ要件 */
  projectSecurityQualifications?: string[];
  /** 取得元での識別キー */
  key: string;
  /** 発注機関名 */
  organizationName?: string;
  /** サイトURL */
  externalDocumentUri?: string;
  /** 地域リスト */
  prefectures: string[];
  /** 入札方式 */
  procedureType?: string;
  /** 公告日 */
  publicationDate?: string;
  /** 予定価格 */
  plannedPrice?: number;
  /** スクリーンショット */
  screenshots?: FileList | null;
  /** 公告情報の添付ファイル */
  attachments?: FileList | null;
  /** 取得元サイトの識別子 */
  source: string;
  /** 入札案件名 */
  title: string;
  /** 入札参加資格の等級 */
  participateQualificationGrades?: ParticipateQualification[];
  /** 入札参加資格の等級ID（登録・更新用） */
  participateQualificationGradeIds?: string[];
}
