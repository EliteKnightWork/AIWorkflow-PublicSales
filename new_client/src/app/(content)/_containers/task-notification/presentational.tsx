'use client';
import { Box, Flex, Text } from '@radix-ui/themes';
import { useEffect, useRef, useState } from 'react';
import type { SearchFilterPreset } from '@/api/generated/models';
import AppTooltip from '@/app/_components/tooltip/AppTooltip';
import AppOverlayModal from '@/components/appOverlayModal/AppOverlayModal';
import LoadingSpinner from '@/components/loadingSpinner/LoadingSpinner';
import { formatTime } from '@/utils/timeUtils';
import { DeliverySettings } from '../../_components/deliverySettings/DeliverySettings';
import { SearchFilterPresetList } from '../../mypage/_components/searchFilterPresetList/searchFilterPresetList';
import { DeliveryRouteType } from '../setting-modal/types';
import styles from './styles.module.css';

type Props = {
  types: DeliveryRouteType[];
  onChangeRouteType: (params: {
    types: DeliveryRouteType[];
    email?: string;
    slackWebhookUrl?: string;
  }) => void;
  email: string;
  setEmail: (email: string) => void;
  slackWebhookUrl: string;
  setSlackWebhookUrl: (url: string) => void;
  filterPresets: SearchFilterPreset[];
  isModalOpen: boolean;
  onModalOpen: () => void;
  onModalClose: () => Promise<void>;
  isLoading?: boolean;
  initialTimeSetting: number;
  initialDaysBeforeDueDate: number;
  onUpdateTimerSettings: (
    hour: number,
    daysBeforeDueDate: number,
    isShowingToast?: boolean
  ) => void;
  onRequestReload?: () => void;
};

export const TaskNotificationPresentational = ({
  types,
  onChangeRouteType,
  email,
  setEmail,
  slackWebhookUrl,
  setSlackWebhookUrl,
  isModalOpen,
  onModalClose,
  isLoading = false,
  initialTimeSetting,
  initialDaysBeforeDueDate,
  onUpdateTimerSettings,
  onRequestReload,
}: Props) => {
  const [timeSettings, setTimeSettings] = useState<number>(initialTimeSetting);
  const [daysBeforeDueDate, setDaysBeforeDueDate] = useState<number>(initialDaysBeforeDueDate);
  const [daysInputValue, setDaysInputValue] = useState<string>(initialDaysBeforeDueDate.toString());
  const [lastSavedValue, setLastSavedValue] = useState<number>(initialDaysBeforeDueDate);
  const daysInputRef = useRef<HTMLInputElement>(null);
  const isHandlingEnterRef = useRef<boolean>(false);

  useEffect(() => {
    setTimeSettings(initialTimeSetting);
  }, [initialTimeSetting]);

  useEffect(() => {
    setDaysBeforeDueDate(initialDaysBeforeDueDate);
    setDaysInputValue(initialDaysBeforeDueDate.toString());
    setLastSavedValue(initialDaysBeforeDueDate);
  }, [initialDaysBeforeDueDate]);

  const handleTimeSettingsChange = (hour: number, isShowingToast?: boolean) => {
    setTimeSettings(hour);
    onUpdateTimerSettings(hour, daysBeforeDueDate, isShowingToast);
  };

  const handleDaysInputChange = (value: string) => {
    const halfWidthValue = value
      .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
      .replace(/[^0-9]/g, '');

    if (halfWidthValue === '' || /^[0-9]+$/.test(halfWidthValue)) {
      setDaysInputValue(halfWidthValue);

      if (halfWidthValue !== '') {
        const numericValue = Number.parseInt(halfWidthValue);
        if (!Number.isNaN(numericValue) && numericValue >= 0) {
          setDaysBeforeDueDate(numericValue);
        }
      }
    }
  };

  const handleDaysInputBlur = (value: string, isFromEnter = false) => {
    if (isFromEnter && isHandlingEnterRef.current) {
      return;
    }

    const halfWidthValue = value
      .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
      .replace(/[^0-9]/g, '');

    if (halfWidthValue === '') {
      setDaysInputValue('0');
      if (lastSavedValue !== 0) {
        setDaysBeforeDueDate(0);
        setLastSavedValue(0);
        onUpdateTimerSettings(timeSettings, 3, true);
      }
      return;
    }

    // Remove leading zeros and convert to number
    const cleanedValue = halfWidthValue.replace(/^0+/, '') || '0';
    const numericValue = Number.parseInt(cleanedValue);

    if (!Number.isNaN(numericValue) && numericValue >= 0) {
      // Always clean up the display value
      setDaysInputValue(numericValue.toString());

      // Only update and show toast if the value actually changed from last saved value
      if (numericValue !== lastSavedValue) {
        setDaysBeforeDueDate(numericValue);
        setLastSavedValue(numericValue);
        onUpdateTimerSettings(timeSettings, numericValue, true);
      }
    }
  };

  return (
    <Box
      className={styles.myInfoArea}
      onClick={(e) => {
        if (
          daysInputRef.current &&
          e.target !== daysInputRef.current &&
          !daysInputRef.current.contains(e.target as Node)
        ) {
          daysInputRef.current.blur();
        }
      }}
    >
      <AppOverlayModal
        title={'保存条件'}
        contentComponent={<SearchFilterPresetList />}
        isOpen={isModalOpen}
        onClose={() => {
          onModalClose();
        }}
      />
      {isLoading ? (
        <Flex justify='center' align='center' style={{ minHeight: '200px' }}>
          <LoadingSpinner size={60} />
        </Flex>
      ) : (
        <Flex direction={'column'} className={styles.notificationContentArea}>
          <DeliverySettings
            types={types}
            email={email}
            slackWebhookUrl={slackWebhookUrl}
            onChangeRouteType={onChangeRouteType}
            onEmailChange={setEmail}
            onSlackWebhookUrlChange={setSlackWebhookUrl}
            title='タスク通知の配信先'
            onRequestReload={onRequestReload}
          />
          {(types.includes(DeliveryRouteType.Email) || types.includes(DeliveryRouteType.Slack)) && (
            <Box>
              <Box>
                <Box className={styles.notificationFormTitleBox}>
                  <Text className={styles.InfoFormTitle}>タスク通知の配信時間</Text>
                  <AppTooltip
                    triggerChildren={
                      <span className={`material-icons ${styles.tooltipIcon}`}>help_outline</span>
                    }
                    content={
                      <Box className={styles.tooltip}>
                        <Text>
                          案件管理のタスクの期限が近づいた際に通知をメール、slackに配信することが可能です。
                        </Text>
                      </Box>
                    }
                  />
                </Box>
                <Flex className={styles.notificationTimeInputStyle}>
                  <Flex direction='row' justify='start' align='center'>
                    <select
                      value={timeSettings}
                      onChange={(e) => {
                        handleTimeSettingsChange(Number.parseInt(e.target.value), true);
                      }}
                      className={styles.notificationTimeInput}
                    >
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i === 23 ? 0 : i + 1;
                        return (
                          <option key={hour} value={hour}>
                            {formatTime(hour)}
                          </option>
                        );
                      })}
                    </select>
                  </Flex>
                </Flex>
              </Box>
              <Box>
                <Box className={styles.notificationFormTitleBox}>
                  <Text className={styles.InfoFormTitle}>通知トリガーの設定</Text>
                  <AppTooltip
                    triggerChildren={
                      <span className={`material-icons ${styles.tooltipIcon}`}>help_outline</span>
                    }
                    content={
                      <Box className={styles.tooltip}>
                        <Text>
                          タスクの期日の何日前に通知するかを設定できます。0日の場合は当日に通知されます。
                        </Text>
                      </Box>
                    }
                  />
                </Box>
                <Flex className={styles.notificationTimeInputStyle}>
                  <Flex className={styles.notificationDaysInputContainer}>
                    <Text size='2'>期日の</Text>
                    <input
                      ref={daysInputRef}
                      type='number'
                      min='0'
                      max='30'
                      value={daysInputValue}
                      onChange={(e) => {
                        handleDaysInputChange(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          isHandlingEnterRef.current = true;
                          handleDaysInputBlur(e.currentTarget.value);
                          e.currentTarget.blur();
                          setTimeout(() => {
                            isHandlingEnterRef.current = false;
                          }, 100);
                          return;
                        }
                        if (
                          e.key === 'Backspace' ||
                          e.key === 'Delete' ||
                          e.key === 'ArrowLeft' ||
                          e.key === 'ArrowRight' ||
                          e.key === 'Tab'
                        ) {
                          return;
                        }

                        if (!/^[0-9０-９]$/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onBlur={(e) => {
                        handleDaysInputBlur(e.target.value, true);
                      }}
                      className={styles.notificationDaysInput}
                    />
                    <Text size='2'>日前に通知</Text>
                  </Flex>
                </Flex>
              </Box>
            </Box>
          )}
        </Flex>
      )}
    </Box>
  );
};
