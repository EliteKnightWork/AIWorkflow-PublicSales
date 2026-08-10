import type { ParticipateQualification } from '@/api/generated/models/participateQualification';

// 参加資格名を表示(郡名があれば郡名+資格名を表示)
export const displayQualificationName = (qualifitation: ParticipateQualification) => {
  return qualifitation.county ? qualifitation.county + qualifitation.name : qualifitation.name;
};
