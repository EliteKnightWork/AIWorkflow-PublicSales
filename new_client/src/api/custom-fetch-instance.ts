import { getAccessToken } from '@auth0/nextjs-auth0';
import { redirect } from 'next/navigation';

// APIエラー用のカスタムエラークラス
export class ApiError<E = unknown> extends Error {
  constructor(
    data: E,
    headers: Headers,
    status: number,
    statusText: string,
    url: string,
    response: Response
  ) {
    super(`API Error: ${status} ${statusText} at ${url}`);
    this.data = data;
    this.headers = headers;
    this.status = status;
    this.statusText = statusText;
    this.url = url;
    this.response = response;
  }

  data?: E;
  headers: Headers;
  status: number;
  statusText: string;
  url: string;
  response: Response;
}

export type ErrorType<Error> = ApiError<Error>;

const getUrl = (contextUrl: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const url = new URL(contextUrl, baseUrl);

  return url.toString();
};

const parseBody = async <T>(response: Response): Promise<T | undefined> => {
  if ([204, 205, 304].includes(response.status) || !response.body) {
    return undefined;
  }

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';

  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }
  if (contentType.includes('application/pdf')) {
    return (await response.blob()) as T;
  }

  return (await response.text()) as T;
};

/**
 * Orval の fetch クライアント用 mutator。
 * 署名は (url, options) を受け取り、Promise<T> を返す形にします。
 */
export const customFetchInstance = async <T>(
  url: string,
  opt: RequestInit & {
    params?: Record<string, string>;
    responseType?: string;
  }
): Promise<T> => {
  const options = {
    ...opt,
    credentials: opt.credentials || 'include', // Cookie 同送
    redirect: opt.redirect || 'manual', // リダイレクト抑止
  };

  const targetUrl = getUrl(url);

  // クライアントサイドであればアクセストークンを付与
  if (typeof window !== 'undefined') {
    try {
      const accessToken = await getAccessToken();
      if (accessToken) {
        options.headers = {
          ...opt.headers,
          Authorization: `Bearer ${accessToken}`,
        };
      }
    } catch (_error) {
      redirect('/login');
    }
  }

  const response = await fetch(targetUrl, options);
  const data = await parseBody<T>(response);

  // 成功時の処理
  if (response.ok) {
    return data as T;
  }

  // クライアントサイドであればリダイレクト処理
  if (typeof window !== 'undefined') {
    if (response.status === 401) {
      redirect('/login');
    }
  }

  // エラー時の処理
  throw new ApiError(
    data,
    response.headers,
    response.status,
    response.statusText,
    response.url,
    response
  );
};

export default customFetchInstance;
