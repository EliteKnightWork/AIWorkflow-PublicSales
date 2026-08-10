export const SettingsTabType = {
  MYINFO: 'myInfo',
  RECOMMEND: 'recommend',
  CUSTOM_OBJECT: 'customObject',
  NOTIFICATION: 'notification',
  TASK_NOTIFICATION: 'taskNotification',
  MEMBER: 'member',
  TEMPLATE: 'template',
} as const;

export type SettingsTabType = (typeof SettingsTabType)[keyof typeof SettingsTabType];

export const DeliveryRouteType = {
  Email: 'email',
  Slack: 'slack',
  None: 'none',
} as const;

export type DeliveryRouteType = (typeof DeliveryRouteType)[keyof typeof DeliveryRouteType];
