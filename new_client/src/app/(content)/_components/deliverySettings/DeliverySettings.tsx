'use client';
import * as Checkbox from '@radix-ui/react-checkbox';
import { CheckIcon } from '@radix-ui/react-icons';
import { Box, Flex, Text } from '@radix-ui/themes';
import { useEffect, useRef, useState } from 'react';
import AppInput from '@/components/appInput/AppInput';
import { validateEmail, validateWebhookUrl } from '@/utils/validationUtils';
import { DeliveryRouteType } from '../../_containers/setting-modal/types';
import { WebhookHelpButton } from '../webhookHelpButton/WebhookHelpButton';
import styles from './styles.module.css';

type Props = {
  types: DeliveryRouteType[];
  email: string;
  slackWebhookUrl: string;
  onChangeRouteType: (params: {
    types: DeliveryRouteType[];
    email?: string;
    slackWebhookUrl?: string;
  }) => void;
  onEmailChange: (email: string) => void;
  onSlackWebhookUrlChange: (url: string) => void;
  title?: string;
  onRequestReload?: () => void;
};

export const DeliverySettings = ({
  types,
  email,
  slackWebhookUrl,
  onChangeRouteType,
  onEmailChange,
  onSlackWebhookUrlChange,
  title = '配信先',
  onRequestReload,
}: Props) => {
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [webhookErrorMessage, setWebhookErrorMessage] = useState('');
  const lastEmailRef = useRef<string>('');
  const lastSlackWebhookUrlRef = useRef<string>('');

  useEffect(() => {
    lastEmailRef.current = email;
    lastSlackWebhookUrlRef.current = slackWebhookUrl;
  }, []);

  useEffect(() => {
    if (email) {
      if (validateEmail(email) === '') {
        setEmailErrorMessage('');
      }
    }
  }, [email]);

  useEffect(() => {
    if (slackWebhookUrl) {
      if (validateWebhookUrl(slackWebhookUrl) === '') {
        setWebhookErrorMessage('');
      }
    }
  }, [slackWebhookUrl]);

  useEffect(() => {
    if (onRequestReload) {
      onRequestReload();
    }
  }, []);

  return (
    <Box>
      <Box className={styles.deliveryFormTitleBox}>
        <Text className={styles.deliveryFormTitle}>{title}</Text>
      </Box>
      <Flex className={styles.deliveryInputStyle}>
        <Box className={styles.deliveryCheckboxContainer}>
          <Checkbox.Root
            className={styles.checkboxRoot}
            checked={types.includes(DeliveryRouteType.Email)}
            onCheckedChange={(checked) => {
              let newTypes = [...types];
              if (checked) {
                newTypes = Array.from(new Set([...newTypes, DeliveryRouteType.Email]));
                // Pass current email value when checking the checkbox
                onChangeRouteType({ types: newTypes, email });
              } else {
                newTypes = newTypes.filter((t) => t !== DeliveryRouteType.Email);
                // Reset lastEmailRef when unchecking
                lastEmailRef.current = '';
                onChangeRouteType({ types: newTypes });
                onEmailChange('');
              }
            }}
          >
            <Checkbox.Indicator className={styles.checkboxIndicator}>
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <Text as='label' size='2'>
            メールで受け取る
          </Text>
        </Box>
        {types.includes(DeliveryRouteType.Email) && (
          <Box>
            <AppInput
              placeholder='入力してください'
              value={email}
              hideIcon
              buttonType={'square'}
              onChange={(value) => onEmailChange(value)}
              onBlur={() => {
                const errorMessage = validateEmail(email);
                if (errorMessage === '') {
                  // Only call API if email has changed
                  if (email !== lastEmailRef.current) {
                    lastEmailRef.current = email;
                    onChangeRouteType({ types: types, email });
                  }
                } else {
                  setEmailErrorMessage(errorMessage);
                }
              }}
              inputClassName={styles.deliveryEmailInput}
              error={emailErrorMessage}
            />
          </Box>
        )}
        <Box className={styles.deliveryCheckboxContainer}>
          <Checkbox.Root
            className={styles.checkboxRoot}
            checked={types.includes(DeliveryRouteType.Slack)}
            onCheckedChange={(checked) => {
              let newTypes = [...types];
              if (checked) {
                newTypes = Array.from(new Set([...newTypes, DeliveryRouteType.Slack]));
                // Pass current slackWebhookUrl value when checking the checkbox
                onChangeRouteType({ types: newTypes, slackWebhookUrl });
              } else {
                newTypes = newTypes.filter((t) => t !== DeliveryRouteType.Slack);
                // Reset lastSlackWebhookUrlRef when unchecking
                lastSlackWebhookUrlRef.current = '';
                onChangeRouteType({ types: newTypes });
                onSlackWebhookUrlChange('');
              }
            }}
          >
            <Checkbox.Indicator className={styles.checkboxIndicator}>
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <Text as='label' size='2'>
            Slackで受け取る
          </Text>
          <WebhookHelpButton />
        </Box>
        {types.includes(DeliveryRouteType.Slack) && (
          <Box>
            <AppInput
              placeholder='入力してください'
              value={slackWebhookUrl}
              hideIcon
              buttonType={'square'}
              onChange={(value) => onSlackWebhookUrlChange(value)}
              onBlur={() => {
                const errorMessage = validateWebhookUrl(slackWebhookUrl);
                if (errorMessage === '') {
                  // Only call API if webhook URL has changed
                  if (slackWebhookUrl !== lastSlackWebhookUrlRef.current) {
                    lastSlackWebhookUrlRef.current = slackWebhookUrl;
                    onChangeRouteType({ types: types, slackWebhookUrl });
                  }
                } else {
                  setWebhookErrorMessage(errorMessage);
                }
              }}
              inputClassName={styles.deliveryEmailInput}
              error={webhookErrorMessage}
            />
          </Box>
        )}
      </Flex>
    </Box>
  );
};
