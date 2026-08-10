import type { SearchFilterPreset } from '@/api/generated/models';
import AppOverlayModal from '@/components/appOverlayModal/AppOverlayModal';
import { SearchPresetFormSecond } from '../searchPresetForm/SearchPresetFormSecond';

type Props = {
  preset: SearchFilterPreset;
  onNext: (preset: SearchFilterPreset, addSubscription?: boolean) => void;
  onBack: () => void;
  onClose: () => void;
};

export default function SearchPresetSecond({ preset, onNext, onBack, onClose }: Props) {
  return (
    <AppOverlayModal
      title={'検索条件 2/2'}
      contentComponent={<SearchPresetFormSecond preset={preset} onNext={onNext} onBack={onBack} />}
      isOpen={true}
      onClose={onClose}
    />
  );
}
