// lib/getForwardedFor.ts
import { headers } from 'next/headers';

/**
 * サーバーサイドでユーザーIPを取得して
 * X-Forwarded-For ヘッダ用に整形する
 */
export async function getForwardedFor(): Promise<string> {
  const h = await headers();
  const clientIp = h.get('x-real-ip') || h.get('x-forwarded-for') || 'unknown';

  const existingXff = h.get('x-forwarded-for');
  return existingXff ? `${existingXff}, ${clientIp}` : clientIp;
}
