import { ParticipateQualificationParticipateQualificationType } from '@/api/generated/models';

export const ParticipateQualificationTypes = [
  {
    type: ParticipateQualificationParticipateQualificationType.官公庁,
    name: '全省庁統一資格',
  },
  {
    type: ParticipateQualificationParticipateQualificationType.都道府県,
    name: '都道府県',
  },
  {
    type: ParticipateQualificationParticipateQualificationType.外郭団体,
    name: '外郭団体',
  },
  {
    type: ParticipateQualificationParticipateQualificationType.その他,
    name: 'その他',
  },
];
