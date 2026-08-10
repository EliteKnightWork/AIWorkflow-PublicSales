import { useState } from 'react';
import { SettingModalPresentational } from './presentational';
import { SettingsTabType } from './types';

export default function SettingModalContainer() {
  const [type, setType] = useState<SettingsTabType>(SettingsTabType.MYINFO);

  return <SettingModalPresentational type={type} onChangeMenu={(newType) => setType(newType)} />;
}
