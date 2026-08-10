'use client';
import { Box, Flex, Text } from '@radix-ui/themes';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useGetMyCompany, useUpdateMyCompany } from '@/api/generated/endpoints/companies';
import { useGetCurrentUser, useUpdateCurrentUser } from '@/api/generated/endpoints/users';
import { Provider } from '@/api/generated/models';
import AppTooltip from '@/app/_components/tooltip/AppTooltip';
import AppInput from '@/components/appInput/AppInput';
import { useToast } from '@/context/ToastContext';
import { useApiError } from '@/hooks/useApiError';
import styles from './styles.module.css';

export default function MyInfo() {
  const { enqueueToast } = useToast();
  const { getApiErrorMessage } = useApiError();

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');

  const { data: user, refetch: refetchUser } = useGetCurrentUser();
  const { data: company, refetch: refectchCompany } = useGetMyCompany();

  const { mutate: updateCompany } = useUpdateMyCompany({
    mutation: {
      onSuccess: () => {
        enqueueToast('会社情報を更新しました', 'success');
      },
      onError: (error) => {
        const message = getApiErrorMessage(error);
        enqueueToast(message.text, 'error');
      },
    },
  });

  const { mutate: updateUser } = useUpdateCurrentUser({
    mutation: {
      onSuccess: () => {
        enqueueToast('ユーザー情報を更新しました', 'success');
      },
      onError: (error) => {
        const message = getApiErrorMessage(error);
        enqueueToast(message.text, 'error');
      },
    },
  });

  const isButtonDisabledDueToGoogleAuth = !user?.authorizedProviders?.includes(
    Provider.google_oauth2
  );

  const isButtonDisabledDueToMicrosoftAuth = !user?.authorizedProviders?.includes(
    Provider.microsoft_graph
  );
  useEffect(() => {
    refetchUser();
    refectchCompany();
  }, []);

  useEffect(() => {
    setName(user?.name || '');
    setCompanyName(company?.name || '');
  }, [user, company]);

  return (
    <Box className={styles.myInfoArea}>
      <Flex direction={'column'}>
        <Text className={styles.InfoFormTitle}>名前</Text>
        <AppInput
          value={name}
          hideIcon
          buttonType={'square'}
          onChange={(value) => setName(value)}
          onBlur={() => {
            if (name === user?.name) return;
            updateUser({ data: { name: name } });
          }}
          inputClassName={styles.infoInput}
        />
        <Text className={styles.InfoFormTitle}>会社名</Text>
        <AppInput
          value={companyName}
          hideIcon
          buttonType={'square'}
          onChange={(value) => setCompanyName(value)}
          onBlur={() => {
            if (companyName === company?.name) return;
            updateCompany({ data: { name: companyName } });
          }}
          inputClassName={styles.infoInput}
        />
        <Text className={styles.InfoFormTitle}>メールアドレス</Text>
        <Text className={styles.InfoFormEmail}>{user?.email || ''}</Text>

        <Flex className={styles.accountSettingSection}>
          <Text className={styles.title}>アカウント連携</Text>
          <AppTooltip
            triggerChildren={
              <span className={`material-icons ${styles.tooltipIcon}`}>help_outline</span>
            }
            content={
              <Box className={styles.tooltip}>
                <Text>
                  案件管理画面からカレンダーに登録できるようになります。
                  <br />
                  Labid に登録しているメールアドレスと同じメールアドレスで連携してください。
                </Text>
              </Box>
            }
          />
        </Flex>
        {!isButtonDisabledDueToGoogleAuth ? (
          <Box className={styles.providerBox}>
            <Text>Googleと連携済み</Text>
          </Box>
        ) : !isButtonDisabledDueToMicrosoftAuth ? (
          <Box className={styles.providerBox}>
            <Text>Microsoftと連携済み</Text>
          </Box>
        ) : (
          <Flex className={styles.providerContainer}>
            {/* Google Sign-In Button */}
            <button
              type='button'
              className={styles.googleSignInButton}
              onClick={() => {
                // 認証開始フラグを設定
                localStorage.setItem('authentication_started', 'true');
                window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/auth/google_oauth2`;
              }}
            >
              <Image
                src='/images/google-logo.png'
                alt='Google'
                width={20}
                height={20}
                className={styles.providerLogoGoogle}
              />
              <span className={styles.buttonText}>Sign in with Google</span>
            </button>
            {/* Microsoft Sign-In Button */}
            <button
              type='button'
              className={styles.microsoftSignInButton}
              onClick={() => {
                // 認証開始フラグを設定
                localStorage.setItem('authentication_started', 'true');
                window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/auth/microsoft_graph`;
              }}
            >
              <Image
                src='/images/microsoft-logo.png'
                alt='Microsoft'
                width={20}
                height={20}
                className={styles.providerLogoMicrosoft}
              />
              <span className={styles.buttonText}>Sign in with Microsoft</span>
            </button>
          </Flex>
        )}
      </Flex>
    </Box>
  );
}
