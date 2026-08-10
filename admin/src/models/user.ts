export interface User {
  /** ユーザーID */
  id: string;
  /** ユーザー名 */
  name: string;
  /** メールアドレス */
  email: string;
  /** パスワード */
  password?: string;
  /** 会社ID */
  companyId: string;
}
