import { BidPipelineStatusStage } from '@/api/generated/models';

export const formatStatusStage = (type: BidPipelineStatusStage) => {
  if (type === BidPipelineStatusStage.doing) {
    return '実行中';
  }
  if (type === BidPipelineStatusStage.done) {
    return '終了';
  }
  return '';
};
