import type { ParticipateQualification } from '@/api/generated/models';
import { displayQualificationName } from '@/utils/participateQualificationUtils';
import { getPrefectureName } from '@/utils/regionUtils';
import { ParticipateQualificationTypes } from './constants';
import type { ParticipateQualificationSearchParams } from './types';

export function convertParamsToChips(
  params: ParticipateQualificationSearchParams,
  qualifications: ParticipateQualification[]
): string[] {
  const chips: string[] = [];

  // 参加資格なし
  if (params.noQualification) {
    chips.push('参加資格: なし');
  }

  // 参加資格種別: {typeName}
  const types = params.participateQualificationTypes || [];
  if (types.length > 0) {
    types.forEach((t) => {
      const typeName = ParticipateQualificationTypes.find((type) => type.type === t)?.name;
      if (typeName) {
        chips.push(`参加資格種別: ${typeName}`);
      }
    });
  }

  // 都道府県: {prefectureName}
  const prefectures = params.participateQualificationPrefectures || [];
  if (prefectures.length > 0) {
    prefectures.forEach((prefecture) => {
      const prefectureName = !Number.isNaN(Number(prefecture))
        ? getPrefectureName(Number(prefecture))
        : undefined;
      if (prefectureName) {
        chips.push(`都道府県: ${prefectureName}`);
      }
    });
  }

  // 参加資格: {qualificationName}
  const qualificationIds = params.participateQualificationIds || [];
  const gradeIds = params.participateQualificationGradeIds || [];

  // 等級が選択されていない資格のみ「参加資格: {資格名}」形式で表示
  if (qualificationIds.length > 0) {
    qualificationIds.forEach((id) => {
      const qualification = qualifications.find((q) => q.id === id);
      if (qualification) {
        // この資格の等級が選択されているかチェック
        const hasSelectedGrades = qualification.grades.some(
          (g) => g.gradeId && gradeIds.includes(g.gradeId)
        );
        if (!hasSelectedGrades) {
          chips.push(`参加資格: ${displayQualificationName(qualification)}`);
        }
      }
    });
  }

  // {qualificationName}: {gradeNames}
  if (gradeIds.length > 0) {
    const qualificationsWithSelectedGrades = qualifications
      .filter((q) => q.grades.some((g) => g.gradeId && gradeIds.includes(g.gradeId)))
      .map((qualification) => ({
        ...qualification,
        selectedGrades: qualification.grades.filter(
          (grade) => grade.gradeId && gradeIds.includes(grade.gradeId)
        ),
      }));

    qualificationsWithSelectedGrades.forEach((qualification) => {
      const gradeNames = qualification.selectedGrades
        .map((grade) => grade.name || '等級なし')
        .join(', ');
      chips.push(`${displayQualificationName(qualification)}: ${gradeNames}`);
    });
  }

  return chips;
}
