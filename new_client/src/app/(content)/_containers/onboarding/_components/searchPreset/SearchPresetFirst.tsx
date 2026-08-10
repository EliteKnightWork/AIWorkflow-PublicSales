import type { SearchFilterPreset } from '@/api/generated/models';
import AppOverlayModal from '@/components/appOverlayModal/AppOverlayModal';
import { SearchPresetFormFirst } from '../searchPresetForm/SearchPresetFormFirst';

type Props = {
  preset: SearchFilterPreset;
  onNext: (preset: SearchFilterPreset, addSubscription?: boolean) => void;
  onClose: () => void;
};

export default function SearchPresetFirst({ preset, onNext, onClose }: Props) {
  return (
    <AppOverlayModal
      title={'検索条件 1/2'}
      contentComponent={<SearchPresetFormFirst preset={preset} onNext={onNext} />}
      isOpen={true}
      onClose={onClose}
    />
  );
}
