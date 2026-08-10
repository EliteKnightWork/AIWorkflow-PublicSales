import { headers } from 'next/headers';

/**
 * Server-side device detection utility
 * Detects mobile devices based on User-Agent header
 */
export async function getIsServerSideMobile(): Promise<boolean> {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';

  // Check for common mobile user agents
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(userAgent);
}
