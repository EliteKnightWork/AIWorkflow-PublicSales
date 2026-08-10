/**
 * メールアドレスのバリデーション
 */
export const validateEmail = (email: string): string => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) ? '' : 'メールアドレスの形式が正しくありません';
};

/**
 * Slack Webhook URLのバリデーション
 */
export const validateWebhookUrl = (url: string): string => {
  const webhookRegex =
    /^https:\/\/hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[a-zA-Z0-9]+$/;
  return webhookRegex.test(url) ? '' : 'Webhook URLの形式が正しくありません';
};
