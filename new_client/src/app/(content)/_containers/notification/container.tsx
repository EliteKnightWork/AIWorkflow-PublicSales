'use client';
import { useEffect, useState } from 'react';
import {
  useGetV1SettingsNotificationTimerSetting,
  usePutV1SettingsNotificationTimerSetting,
} from '@/api/generated/endpoints/default';
import {
  useGetEmailNotificationMethod,
  useGetNotificationMethod,
  useGetSlackNotificationMethod,
  useUpdateNotificationMethod,
} from '@/api/generated/endpoints/notification-methods';
import {
  GetEmailNotificationMethodNotificationType,
  GetNotificationMethodNotificationType,
  GetSlackNotificationMethodNotificationType,
  GetV1SettingsNotificationTimerSettingNotificationType,
  PutV1SettingsNotificationTimerSettingBodyNotificationType,
  UpdateNotificationMethodBodyNotificationType,
} from '@/api/generated/models';
import { useSearchFilterPreset } from '@/context/SearchFilterPresetContext';
import { useToast } from '@/context/ToastContext';
import { useApiError } from '@/hooks/useApiError';
import { ProjectType } from '../../projects/types';
import { DeliveryRouteType } from '../setting-modal/types';
import { NotificationPresentational } from './presentational';

export const NotificationContainer = () => {
  // 1. Hooks
  const { enqueueToast } = useToast();
  const { getApiErrorMessage } = useApiError();
  const { presets: allPresets, refreshPresets } = useSearchFilterPreset();

  // 2. State
  const [types, setTypes] = useState<DeliveryRouteType[]>([]);
  const [email, setEmail] = useState('');
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [sortedTimeSettings, setSortedTimeSettings] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 3. Data Fetching Queries
  const {
    data: currentNotificationMethod,
    isLoading: isLoadingNotificationMethod,
    refetch: refetchNotificationMethod,
  } = useGetNotificationMethod({
    notification_type: GetNotificationMethodNotificationType.new_project,
  });

  const {
    data: timerSettings,
    isLoading: isLoadingTimerSettings,
    refetch: refetchTimerSettings,
  } = useGetV1SettingsNotificationTimerSetting(
    { notification_type: GetV1SettingsNotificationTimerSettingNotificationType.new_project },
    {
      query: {
        enabled: true,
        retry: false,
      },
    }
  );

  const {
    data: emailNotificationMethod,
    isLoading: isLoadingEmailMethod,
    refetch: refetchEmailMethod,
  } = useGetEmailNotificationMethod(
    {
      notification_type: GetEmailNotificationMethodNotificationType.new_project,
    },
    {
      query: {
        enabled: currentNotificationMethod?.values?.includes(DeliveryRouteType.Email),
        retry: false,
      },
    }
  );

  const {
    data: slackNotificationMethod,
    isLoading: isLoadingSlackMethod,
    refetch: refetchSlackMethod,
  } = useGetSlackNotificationMethod(
    {
      notification_type: GetSlackNotificationMethodNotificationType.new_project,
    },
    {
      query: {
        enabled: currentNotificationMethod?.values?.includes(DeliveryRouteType.Slack),
        retry: false,
      },
    }
  );

  // 4. Loading State
  const isLoading =
    isLoadingNotificationMethod ||
    (isLoadingEmailMethod &&
      currentNotificationMethod?.values?.includes(DeliveryRouteType.Email)) ||
    (isLoadingSlackMethod &&
      currentNotificationMethod?.values?.includes(DeliveryRouteType.Slack)) ||
    isLoadingTimerSettings;

  // 5. Data Update Mutations
  const { mutate: updateTimerSettings } = usePutV1SettingsNotificationTimerSetting({
    mutation: {
      onSuccess: async () => {
        await refetchTimerSettings();
      },
      onError: (error) => {
        const message = getApiErrorMessage(error);
        enqueueToast(message.text, 'error');
      },
    },
  });

  const { mutate: updateNotificationMethod } = useUpdateNotificationMethod({
    mutation: {
      onSuccess: async () => {
        await refreshNotificationData();
        enqueueToast('配信設定を更新しました', 'success');
      },
      onError: (error) => {
        const message = getApiErrorMessage(error);
        enqueueToast(message.text, 'error');
      },
    },
  });

  // 6. Data Refresh Function
  const refreshNotificationData = async () => {
    await Promise.all([
      refetchNotificationMethod(),
      refetchEmailMethod(),
      refetchSlackMethod(),
      refetchTimerSettings(),
    ]);
  };

  // 7. Event Handlers
  const onChangeRouteType = async ({
    types: newTypes,
    email: newEmail,
    slackWebhookUrl: newSlackWebhookUrl,
  }: {
    types: DeliveryRouteType[];
    email?: string;
    slackWebhookUrl?: string;
  }) => {
    const typesToSave = newTypes.length === 0 ? [DeliveryRouteType.None] : newTypes;
    const data = {
      types: typesToSave,
      notification_type: UpdateNotificationMethodBodyNotificationType.new_project,
      ...(typesToSave.includes(DeliveryRouteType.Email) && { email: newEmail ?? email }),
      ...(typesToSave.includes(DeliveryRouteType.Slack) && {
        slackWebhookUrl: newSlackWebhookUrl ?? slackWebhookUrl,
      }),
    };

    setTypes(typesToSave);
    await updateNotificationMethod({ data });
  };

  const onUpdateTimerSettings = async (hours: number[], isShowingToast?: boolean) => {
    await updateTimerSettings({
      data: {
        notification_type: PutV1SettingsNotificationTimerSettingBodyNotificationType.new_project,
        hours,
      },
    });

    if (isShowingToast) {
      enqueueToast('配信時間を更新しました', 'success');
    }
  };

  const onModalClose = async () => {
    setIsModalOpen(false);
    await refreshPresets();
  };

  // 8. Effects
  useEffect(() => {
    if (!isLoading) {
      // 通知方法の初期設定
      if (currentNotificationMethod?.values) {
        setTypes(currentNotificationMethod.values);
      }

      // メールとSlackの初期設定
      if (emailNotificationMethod?.email) {
        setEmail(emailNotificationMethod.email);
      }
      if (slackNotificationMethod?.webhookUrl) {
        setSlackWebhookUrl(slackNotificationMethod.webhookUrl);
      }

      // タイマー設定の初期設定
      if (timerSettings?.hours) {
        setSortedTimeSettings(
          [...timerSettings.hours].sort((a, b) => {
            if (a === 0) return 1;
            if (b === 0) return -1;
            return a - b;
          })
        );
      } else {
        setSortedTimeSettings([9]);
      }
    }
  }, [
    isLoading,
    currentNotificationMethod,
    emailNotificationMethod,
    slackNotificationMethod,
    timerSettings,
  ]);

  // 9. Render
  return (
    <NotificationPresentational
      types={types}
      onChangeRouteType={onChangeRouteType}
      email={email}
      setEmail={setEmail}
      slackWebhookUrl={slackWebhookUrl}
      setSlackWebhookUrl={setSlackWebhookUrl}
      filterPresets={allPresets.filter((preset) => preset.projectType === ProjectType.PROJECT)}
      isModalOpen={isModalOpen}
      onModalOpen={() => setIsModalOpen(true)}
      onModalClose={onModalClose}
      isLoading={isLoading}
      initialTimeSettings={sortedTimeSettings}
      onUpdateTimerSettings={onUpdateTimerSettings}
      onRequestReload={refreshNotificationData}
    />
  );
};
