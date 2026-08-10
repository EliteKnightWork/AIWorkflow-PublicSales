import { redirect } from 'next/navigation';
import { ApiError } from '@/api/custom-fetch-instance';

export interface IErrorConfig {
  Error400Message?: string;
  Error401Message?: string;
  Error404Message?: string;
  Error500Message?: string;
  callback?: (code: number) => void;
}

export const useApiError = () => {
  const getApiErrorMessage = (e: unknown, config?: IErrorConfig) => {
    if (e instanceof ApiError) {
      if (e.response.status === 400) {
        return {
          text: config?.Error400Message ?? 'リクエストの値が不正です。再度お試しください',
          callback: () => config?.callback?.(400),
        };
      }

      if (e.response.status === 401) {
        return {
          text: config?.Error401Message ?? 'ログインが必要な処理があります。',
          callback: () => redirect('/login'),
        };
      }

      if (e.response.status === 404) {
        return {
          text: config?.Error404Message ?? 'リクエストしたURLが間違っています。',
          callback: () => config?.callback?.(404),
        };
      }

      if (e.response.status === 500) {
        return {
          text: config?.Error500Message ?? '想定外のエラーが発生しました。再度お試しください',
          callback: () => config?.callback?.(500),
        };
      }
    }
    return {
      text: '想定外のエラーが発生しました。再度お試しください。',
      callback: () => config?.callback?.(500),
    };
  };

  return {
    getApiErrorMessage,
  };
};
