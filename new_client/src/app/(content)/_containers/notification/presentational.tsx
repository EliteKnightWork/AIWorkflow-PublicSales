'use client';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import type { SearchFilterPreset } from '@/api/generated/models';
import AppTooltip from '@/app/_components/tooltip/AppTooltip';
import AppOverlayModal from '@/components/appOverlayModal/AppOverlayModal';
import LoadingSpinner from '@/components/loadingSpinner/LoadingSpinner';
import { RoundButton } from '@/components/roundButton/RoundeButton';
import { formatTime } from '@/utils/timeUtils';
import { DeliverySettings } from '../../_components/deliverySettings/DeliverySettings';
import { SearchFilterPresetList } from '../../mypage/_components/searchFilterPresetList/searchFilterPresetList';
import { DeliveryRouteType } from '../setting-modal/types';
import { FilterPresetsTitleList } from './FilterPresetsTitleList';
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
  initialTimeSettings: number[];
  onUpdateTimerSettings: (hours: number[], isAddingTime?: boolean) => void;
  onRequestReload?: () => void;
};

export const NotificationPresentational = ({
  types,
  onChangeRouteType,
  email,
  setEmail,
  slackWebhookUrl,
  setSlackWebhookUrl,
  filterPresets,
  isModalOpen,
  onModalOpen,
  onModalClose,
  isLoading = false,
  initialTimeSettings,
  onUpdateTimerSettings,
  onRequestReload,
}: Props) => {
  const [timeSettings, setTimeSettings] = useState<number[]>(initialTimeSettings);

  useEffect(() => {
    setTimeSettings(initialTimeSettings);
  }, [initialTimeSettings]);

  const handleTimeSettingsChange = (hours: number[], isShowingToast?: boolean) => {
    setTimeSettings(hours);
    onUpdateTimerSettings(hours, isShowingToast);
  };

  return (
    <Box className={styles.myInfoArea}>
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
            onRequestReload={onRequestReload}
          />
          {(types.includes(DeliveryRouteType.Email) || types.includes(DeliveryRouteType.Slack)) && (
            <Box>
              <Box className={styles.notificationFormTitleBox}>
                <Text className={styles.InfoFormTitle}>配信時間</Text>
                <AppTooltip
                  triggerChildren={
                    <span className={`material-icons ${styles.tooltipIcon}`}>help_outline</span>
                  }
                  content={
                    <Box className={styles.tooltip}>
                      <Text>1日2回まで新規案件をメール、slackに配信することが可能です。</Text>
                      <Text>
                        午前、午後など2つの時間帯で配信設定することでよりタイムリーに案件情報をキャッチできます！
                      </Text>
                    </Box>
                  }
                />
              </Box>
              <Flex className={styles.notificationTimeInputStyle}>
                <Flex direction='row' justify='start' align='center'>
                  <select
                    value={timeSettings[0]}
                    onChange={(e) => {
                      const newTimeSettings = [...timeSettings];
                      newTimeSettings[0] = Number.parseInt(e.target.value);
                      handleTimeSettingsChange(newTimeSettings, true);
                    }}
                    className={styles.notificationTimeInput}
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i === 23 ? 0 : i + 1;
                      return (
                        <option
                          key={hour}
                          value={hour}
                          disabled={timeSettings.length > 1 && timeSettings[1] === hour}
                        >
                          {formatTime(hour)}
                        </option>
                      );
                    })}
                  </select>
                  {timeSettings.length >= 2 && (
                    <Button
                      variant='ghost'
                      onClick={() => {
                        handleTimeSettingsChange([timeSettings[1]], true);
                      }}
                    >
                      <span
                        className='material-icons'
                        style={{
                          fontSize: '25px',
                          color: 'var(--text-color-info)',
                          padding: '8px',
                        }}
                      >
                        delete
                      </span>
                    </Button>
                  )}
                </Flex>
                {timeSettings.length >= 2 && (
                  <Flex direction='row' justify='start' align='center'>
                    <select
                      value={timeSettings[1]}
                      onChange={(e) => {
                        const newTimeSettings = [...timeSettings];
                        newTimeSettings[1] = Number.parseInt(e.target.value);
                        handleTimeSettingsChange(newTimeSettings, true);
                      }}
                      className={styles.notificationTimeInput}
                    >
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i === 23 ? 0 : i + 1;
                        return (
                          <option
                            key={hour}
                            value={hour}
                            disabled={timeSettings.length > 1 && timeSettings[0] === hour}
                          >
                            {formatTime(hour)}
                          </option>
                        );
                      })}
                    </select>
                    <Button
                      variant='ghost'
                      onClick={() => {
                        handleTimeSettingsChange([timeSettings[0]], true);
                      }}
                    >
                      <span
                        className='material-icons'
                        style={{
                          fontSize: '25px',
                          color: 'var(--text-color-info)',
                          padding: '8px',
                        }}
                      >
                        delete
                      </span>
                    </Button>
                  </Flex>
                )}
              </Flex>
              {timeSettings.length <= 1 && (
                <Flex justify='center' className={styles.addTimerSettingButtonContainer}>
                  <Button
                    className={styles.addTimerSettingButton}
                    onClick={() => {
                      const nextTime = timeSettings[0] === 9 ? 10 : 9;
                      handleTimeSettingsChange([...timeSettings, nextTime], false);
                    }}
                  >
                    <Text>配信時間を追加する</Text>
                  </Button>
                </Flex>
              )}
            </Box>
          )}
          <Box>
            <Flex direction={'row'} justify='between' align='center'>
              <Box className={styles.notificationFormTitleBox}>
                <Text className={styles.InfoFormTitle}>配信する条件</Text>
              </Box>
              <RoundButton
                icon='autorenew'
                buttonClassName={styles.notificationFilterButton}
                text='条件を変更する'
                onClick={(e) => {
                  e.stopPropagation();
                  onModalOpen();
                }}
              />
            </Flex>
            <FilterPresetsTitleList presets={filterPresets.filter((p) => p.notificationRequired)} />
          </Box>
        </Flex>
      )}
    </Box>
  );
};
