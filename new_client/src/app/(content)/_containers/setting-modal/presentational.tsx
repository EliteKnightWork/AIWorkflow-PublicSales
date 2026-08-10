import { Box, Flex } from '@radix-ui/themes';
import CustomObjects from '../custom-objects';
import Members from '../members';
import MyInfo from '../myinfo';
import Notification from '../notification';
import ProposalTemplate from '../proposal-template';
import RecommendSetting from '../recommend-setting';
import TaskNotification from '../task-notification';
import SettingsSideMenu from './settingsSideMenu';
import { SettingsTabType } from './types';

type Props = {
  type: SettingsTabType;
  onChangeMenu: (type: SettingsTabType) => void;
};

export const SettingModalPresentational = ({ type, onChangeMenu }: Props) => {
  return (
    <Flex direction={'row'} width={'100%'} height={'80vh'} style={{ overflow: 'hidden' }}>
      <Box>
        <SettingsSideMenu type={type} onChangeMenu={onChangeMenu} />
      </Box>
      <Box height={'100%'} overflowY={'auto'} style={{ flex: 1 }}>
        {type === SettingsTabType.MYINFO && <MyInfo />}
        {type === SettingsTabType.RECOMMEND && <RecommendSetting />}
        {type === SettingsTabType.CUSTOM_OBJECT && <CustomObjects />}
        {type === SettingsTabType.NOTIFICATION && <Notification />}
        {type === SettingsTabType.TASK_NOTIFICATION && <TaskNotification />}
        {type === SettingsTabType.MEMBER && <Members />}
        {type === SettingsTabType.TEMPLATE && <ProposalTemplate />}
      </Box>
    </Flex>
  );
};
