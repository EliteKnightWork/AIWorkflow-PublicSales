import Script from 'next/script';
import { getCurrentUser } from '@/api/generated/endpoints/users';
import { getServerAccessToken } from '@/lib/getServerAccessToken';

/**
 * サーバーサイドでユーザーIDを取得する
 * @returns ユーザーID（取得失敗時はnull）
 */
async function fetchUserId(): Promise<number | null> {
  try {
    const accessToken = await getServerAccessToken(true);

    if (!accessToken) {
      return null;
    }

    const userData = await getCurrentUser({
      headers: {
        ...accessToken,
      },
    });

    return userData.id ?? null;
  } catch (error) {
    // 本番環境ではエラーログを出力しない（認証エラーは正常系の可能性がある）
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to fetch user data:', error);
    }
    return null;
  }
}

/**
 * Google Tag Managerにuser_idを送信するコンポーネント
 * GTMの初期化前にdataLayerにuser_idをプッシュするため、
 * strategy='beforeInteractive'を使用してGTMより先に実行されるようにする
 */
const GAUserIdTracker = async () => {
  const userId = await fetchUserId();

  if (!userId) {
    return null;
  }

  // XSS対策: userIdをJSON.stringifyで安全にエスケープ
  // 数値でも文字列として扱う（GTMのuser_idは文字列が一般的）
  const safeUserId = JSON.stringify(userId.toString());

  // GTMの初期化前にdataLayerにuser_idをプッシュする
  // beforeInteractiveを使用することで、GTMコンポーネントより先に実行される
  const dataLayerScript = `
    (function() {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        'user_id': ${safeUserId}
      });
    })();
  `;

  return (
    <Script id='ga-user-id-script' strategy='beforeInteractive'>
      {dataLayerScript}
    </Script>
  );
};

export default GAUserIdTracker;
