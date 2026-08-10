import { cookies } from 'next/headers';

/**
 * Cookieを取得する（サーバーサイド専用）
 * @param name Cookie名
 * @returns Cookie値 or undefined
 */
export async function getCookie(name: string): Promise<string | undefined> {
  const cookieStore = await cookies();
  const value = cookieStore.get(name)?.value;
  return value;
}
