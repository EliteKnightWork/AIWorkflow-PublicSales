import type {
  ParticipateQualification,
  SearchProjectsParams,
  SearchProjectsProjectSecurityQualificationsItem,
} from '@/api/generated/models';
import { ParticipateQualificationTypes } from '@/app/(content)/mypage/constants';
import { displayQualificationName } from '@/utils/participateQualificationUtils';
import { getPrefectureName } from '@/utils/regionUtils';

export type PrefectureType = {
  regionCode: string;
  prefectureId: string;
  name: string;
};

// こだわり条件項目
export type AdditionalFilterCondition = {
  keywords?: string;
  orKeywords?: string;
  notKeywords?: string;
  businessDescription?: string;
  procedureTypeGroups?: string[];
  prefectures?: string[];
  organizationName?: string;
  bidCompanyName?: string;
  plannedPriceFrom?: number;
  plannedPriceTo?: number;
  publicationDateFrom?: string;
  publicationDateTo?: string;
  deadlineDaysRemaining?: number;
  isExperienceRequired?: boolean;
  isOfficeRequired?: boolean;
  useSynonymSearch?: boolean;
  projectSecurityQualifications?: SearchProjectsProjectSecurityQualificationsItem[];
  participateQualificationTypes?: string[];
  participateQualificationPrefectures?: string[];
  participateQualificationIds?: number[];
  participateQualificationGradeIds?: number[];
  noQualification?: boolean;
  tenderOpeningDateFrom?: string;
  tenderOpeningDateTo?: string;
};

// 選択済みの検索条件のチップ
export type SearchInputChip = {
  type: keyof SearchProjectsParams;
  keyName: string;
  value: string;
  displayValue: string;
};

export const SearchInputChipPriority = [
  'keywords',
  'orKeywords',
  'notKeywords',
  'useSynonymSearch',
  'prefectures',
  'procedureTypeGroups',
  'organizationNameArray',
  'publicationDateFrom',
  'publicationDateTo',
  'plannedPriceFrom',
  'plannedPriceTo',
  'bidCompanyName',
  'isExperienceRequired',
  'isOfficeRequired',
  'projectSecurityQualifications',
  'participateQualificationTypes',
  'participateQualificationPrefectures',
  'participateQualificationIds',
  'participateQualificationGradeIds',
  'noQualification',
  'deadlineDaysRemaining',
  'tenderOpeningDateFrom',
  'tenderOpeningDateTo',
] as const;

// SearchProjectsParams to SearchInputChip[]
export function convertToSearchInputChip(
  params: SearchProjectsParams,
  qualifications: ParticipateQualification[]
): SearchInputChip[] {
  const convertKeywords = (keywords?: string[]): SearchInputChip[] => {
    if (!keywords) {
      return [];
    }
    return keywords
      .filter((k) => k.trim() !== '')
      .map((k) => ({
        type: 'keywords',
        keyName: 'ANDワード',
        value: k,
        displayValue: k,
      }));
  };

  const convertOrKeywords = (orKeywords?: string[]): SearchInputChip[] => {
    if (!orKeywords) {
      return [];
    }
    return orKeywords
      .filter((k) => k.trim() !== '')
      .map((k) => ({
        type: 'orKeywords',
        keyName: 'ORワード',
        value: k,
        displayValue: k,
      }));
  };

  const convertNotKeywords = (notKeywords?: string[]): SearchInputChip[] => {
    if (!notKeywords) {
      return [];
    }
    return notKeywords
      .filter((k) => k.trim() !== '')
      .map((k) => ({
        type: 'notKeywords',
        keyName: 'NOTワード',
        value: k,
        displayValue: k,
      }));
  };

  const convertUseSynonymSearch = (useSynonymSearch?: boolean): SearchInputChip[] => {
    if (!useSynonymSearch) {
      return [];
    }
    return [
      {
        type: 'useSynonymSearch',
        keyName: '類義語検索',
        value: useSynonymSearch.toString(),
        displayValue: 'あり',
      },
    ];
  };

  const convertPrefectures = (prefectures?: string[]): SearchInputChip[] => {
    if (!prefectures) {
      return [];
    }
    return prefectures.map((p) => ({
      type: 'prefectures',
      keyName: '都道府県',
      value: p,
      displayValue: getPrefectureName(Number(p)),
    }));
  };

  const convertProcedureTypeGroups = (procedureTypeGroups?: string[]): SearchInputChip[] => {
    if (!procedureTypeGroups) {
      return [];
    }
    return procedureTypeGroups.map((procedureTypeGroup) => ({
      type: 'procedureTypeGroups',
      keyName: '入札方式',
      value: procedureTypeGroup,
      displayValue: procedureTypeGroup,
    }));
  };

  const convertOrganizationName = (organizationNames?: string[]): SearchInputChip[] => {
    if (!organizationNames) {
      return [];
    }
    return organizationNames.map((o) => {
      return {
        type: 'organizationNameArray',
        keyName: '発注機関',
        value: o,
        displayValue: o,
      };
    });
  };

  const convertPlannedPriceFrom = (plannedPriceFrom?: number): SearchInputChip[] => {
    if (!plannedPriceFrom) {
      return [];
    }

    return [
      {
        type: 'plannedPriceFrom',
        keyName: '予定価格',
        value: plannedPriceFrom.toString(),
        displayValue: `${Number(plannedPriceFrom).toLocaleString('ja-JP')}円~`,
      },
    ];
  };

  const convertPlannedPriceTo = (plannedPriceTo?: number): SearchInputChip[] => {
    if (!plannedPriceTo) {
      return [];
    }
    return [
      {
        type: 'plannedPriceTo',
        keyName: '予定価格',
        value: plannedPriceTo.toString(),
        displayValue: `~${Number(plannedPriceTo).toLocaleString('ja-JP')}円`,
      },
    ];
  };

  const convertPublicationDateFrom = (
    publicationDateFrom?: string,
    publicationDateTo?: string
  ): SearchInputChip[] => {
    if (!publicationDateFrom) {
      return [];
    }

    // fromとtoが同じ日付の場合は、fromのチップのみを返す（結合表示）
    if (publicationDateFrom === publicationDateTo) {
      return [
        {
          type: 'publicationDateFrom',
          keyName: '公告日',
          value: publicationDateFrom.toString(),
          displayValue: publicationDateFrom,
        },
      ];
    }

    return [
      {
        type: 'publicationDateFrom',
        keyName: '公告日',
        value: publicationDateFrom.toString(),
        displayValue: `${publicationDateFrom}~`,
      },
    ];
  };

  const convertPublicationDateTo = (
    publicationDateTo?: string,
    publicationDateFrom?: string
  ): SearchInputChip[] => {
    if (!publicationDateTo) {
      return [];
    }

    // fromとtoが同じ日付の場合は、toのチップを返さない（fromで結合表示するため）
    if (publicationDateFrom === publicationDateTo) {
      return [];
    }

    return [
      {
        type: 'publicationDateTo',
        keyName: '公告日',
        value: publicationDateTo.toString(),
        displayValue: `~${publicationDateTo}`,
      },
    ];
  };

  const convertBidCompanyName = (bidCompanyName?: string): SearchInputChip[] => {
    if (!bidCompanyName) {
      return [];
    }
    return [
      {
        type: 'bidCompanyName',
        keyName: '参加企業',
        value: bidCompanyName,
        displayValue: bidCompanyName,
      },
    ];
  };

  const convertSecurityQualification = (securityQualification?: string[]): SearchInputChip[] => {
    if (!securityQualification || securityQualification.length === 0) {
      return [];
    }
    return securityQualification.map((s) => ({
      type: 'projectSecurityQualifications',
      keyName: '情報セキュリティ',
      value: s,
      displayValue: s,
    }));
  };

  const convertIsExperienceRequired = (isExperienceRequired?: boolean): SearchInputChip[] => {
    if (isExperienceRequired === undefined || isExperienceRequired === null) {
      return [];
    }
    const isExperienceRequiredBoolean =
      typeof isExperienceRequired === 'string'
        ? isExperienceRequired === 'true'
        : isExperienceRequired === true;
    return [
      {
        type: 'isExperienceRequired',
        keyName: '実績有無',
        value: isExperienceRequired.toString(),
        displayValue: isExperienceRequiredBoolean === true ? '有' : '無',
      },
    ];
  };

  const convertIsOfficeRequired = (isOfficeRequired?: boolean): SearchInputChip[] => {
    if (isOfficeRequired === undefined || isOfficeRequired === null) {
      return [];
    }
    const isOfficeRequiredBoolean =
      typeof isOfficeRequired === 'string'
        ? isOfficeRequired === 'true'
        : isOfficeRequired === true;
    return [
      {
        type: 'isOfficeRequired',
        keyName: '事業所要件',
        value: isOfficeRequired.toString(),
        displayValue: isOfficeRequiredBoolean ? '有' : '無',
      },
    ];
  };

  const convertDeadlineDaysRemaining = (days?: number): SearchInputChip[] => {
    if (days === undefined || days === null) {
      return [];
    }
    return [
      {
        type: 'deadlineDaysRemaining',
        keyName: '締切日',
        value: days.toString(),
        displayValue: `${days}日以上先`,
      },
    ];
  };

  const convertParticipateQualificationTypes = (types?: string[]): SearchInputChip[] => {
    if (!types || types.length === 0) {
      return [];
    }
    return types.map((type) => {
      const typeName = ParticipateQualificationTypes.find(
        (qualType) => qualType.type === type
      )?.name;
      return {
        type: 'participateQualificationTypes',
        keyName: '参加資格種別',
        value: type,
        displayValue: typeName || type,
      };
    });
  };

  const convertParticipateQualificationPrefectures = (
    prefectures?: string[]
  ): SearchInputChip[] => {
    if (!prefectures || prefectures.length === 0) {
      return [];
    }
    return prefectures.map((prefecture) => ({
      type: 'participateQualificationPrefectures',
      keyName: '参加資格都道府県',
      value: prefecture,
      displayValue: getPrefectureName(Number(prefecture)),
    }));
  };

  const convertParticipateQualificationIds = (ids?: number[]): SearchInputChip[] => {
    if (!ids || ids.length === 0) {
      return [];
    }

    return ids.map((id) => {
      const qualification = qualifications.find((q) => q.id === id);
      return {
        type: 'participateQualificationIds',
        keyName: '参加資格',
        value: id.toString(),
        displayValue: qualification?.name || id.toString(),
      };
    });
  };

  const convertNoQualification = (noQualification?: boolean): SearchInputChip[] => {
    if (!noQualification) {
      return [];
    }

    return [
      {
        type: 'noQualification',
        keyName: '参加資格',
        value: 'true',
        displayValue: 'なし',
      },
    ];
  };

  const convertParticipateQualificationGradeIds = (gradeIds?: number[]): SearchInputChip[] => {
    if (!gradeIds || gradeIds.length === 0) {
      return [];
    }

    if (qualifications.length > 0) {
      const qualificationsWithSelectedGrades = qualifications
        .filter((q) => q.grades.some((g) => g.gradeId && gradeIds.includes(g.gradeId)))
        .map((qualification) => ({
          ...qualification,
          selectedGrades: qualification.grades.filter(
            (grade) => grade.gradeId && gradeIds.includes(grade.gradeId)
          ),
        }));
      return qualificationsWithSelectedGrades.map((qualification) => {
        const gradeNames = qualification.selectedGrades
          .map((grade) => grade.name || '等級なし')
          .join(', ');
        return {
          type: 'participateQualificationGradeIds',
          keyName: displayQualificationName(qualification) || '参加資格等級',
          value: qualification.selectedGrades.map((grade) => grade.gradeId).join(', '),
          displayValue: gradeNames,
        };
      });
    }
    return [
      {
        type: 'participateQualificationGradeIds',
        keyName: '参加資格等級',
        value: '',
        displayValue: gradeIds.join(', '),
      },
    ];
  };

  const convertTenderOpeningDateFrom = (
    tenderOpeningDateFrom?: string,
    tenderOpeningDateTo?: string
  ): SearchInputChip[] => {
    if (!tenderOpeningDateFrom) {
      return [];
    }

    // fromとtoが同じ日付の場合は、fromのチップのみを返す（結合表示）
    if (tenderOpeningDateFrom === tenderOpeningDateTo) {
      return [
        {
          type: 'tenderOpeningDateFrom',
          keyName: '落札日',
          value: tenderOpeningDateFrom.toString(),
          displayValue: tenderOpeningDateFrom,
        },
      ];
    }

    return [
      {
        type: 'tenderOpeningDateFrom',
        keyName: '落札日',
        value: tenderOpeningDateFrom.toString(),
        displayValue: `${tenderOpeningDateFrom}~`,
      },
    ];
  };

  const convertTenderOpeningDateTo = (
    tenderOpeningDateTo?: string,
    tenderOpeningDateFrom?: string
  ): SearchInputChip[] => {
    if (!tenderOpeningDateTo) {
      return [];
    }

    // fromとtoが同じ日付の場合は、toのチップを返さない（fromで結合表示するため）
    if (tenderOpeningDateFrom === tenderOpeningDateTo) {
      return [];
    }

    return [
      {
        type: 'tenderOpeningDateTo',
        keyName: '落札日',
        value: tenderOpeningDateTo.toString(),
        displayValue: `~${tenderOpeningDateTo}`,
      },
    ];
  };

  const chips = SearchInputChipPriority.flatMap((type) => {
    switch (type) {
      case 'keywords':
        return convertKeywords(params.keywords);
      case 'orKeywords':
        return convertOrKeywords(params.orKeywords);
      case 'notKeywords':
        return convertNotKeywords(params.notKeywords);
      case 'useSynonymSearch':
        return convertUseSynonymSearch(params.useSynonymSearch);
      case 'prefectures':
        return convertPrefectures(params.prefectures);
      case 'procedureTypeGroups':
        return convertProcedureTypeGroups(params.procedureTypeGroups);
      case 'organizationNameArray':
        return convertOrganizationName(params.organizationNameArray);
      case 'plannedPriceFrom':
        return convertPlannedPriceFrom(params.plannedPriceFrom);
      case 'plannedPriceTo':
        return convertPlannedPriceTo(params.plannedPriceTo);
      case 'publicationDateFrom':
        return convertPublicationDateFrom(params.publicationDateFrom, params.publicationDateTo);
      case 'publicationDateTo':
        return convertPublicationDateTo(params.publicationDateTo, params.publicationDateFrom);
      case 'bidCompanyName':
        return convertBidCompanyName(params.bidCompanyName);
      case 'projectSecurityQualifications':
        return convertSecurityQualification(params.projectSecurityQualifications);
      case 'isExperienceRequired':
        return convertIsExperienceRequired(params.isExperienceRequired);
      case 'isOfficeRequired':
        return convertIsOfficeRequired(params.isOfficeRequired);
      case 'deadlineDaysRemaining':
        return convertDeadlineDaysRemaining(params.deadlineDaysRemaining);
      case 'participateQualificationTypes':
        return convertParticipateQualificationTypes(params.participateQualificationTypes);
      case 'participateQualificationPrefectures':
        return convertParticipateQualificationPrefectures(
          params.participateQualificationPrefectures
        );
      case 'participateQualificationIds':
        return convertParticipateQualificationIds(params.participateQualificationIds);
      case 'participateQualificationGradeIds':
        return convertParticipateQualificationGradeIds(params.participateQualificationGradeIds);
      case 'noQualification':
        return convertNoQualification(params.noQualification);
      case 'tenderOpeningDateFrom':
        return convertTenderOpeningDateFrom(
          params.tenderOpeningDateFrom,
          params.tenderOpeningDateTo
        );
      case 'tenderOpeningDateTo':
        return convertTenderOpeningDateTo(params.tenderOpeningDateTo, params.tenderOpeningDateFrom);
      default:
        return [];
    }
  });

  return chips;
}

// SearchInputChip[] to SearchProjectsParams
export function convertToSearchProjectsParams(chips: SearchInputChip[]): SearchProjectsParams {
  const params: SearchProjectsParams = {};

  // typeごとにグループ化
  const groupedChips = chips.reduce(
    (acc, chip) => {
      if (!acc[chip.type]) {
        acc[chip.type] = [];
      }
      acc[chip.type].push(chip.value);
      return acc;
    },
    {} as Record<keyof SearchProjectsParams, string[]>
  );

  // SearchProjectsParamsに変換
  for (const [type, values] of Object.entries(groupedChips)) {
    switch (type) {
      case 'keywords':
      case 'orKeywords':
      case 'notKeywords':
        params[type] = values;
        break;
      case 'useSynonymSearch':
        params[type] = values[0] === 'true';
        break;
      case 'prefectures':
      case 'procedureTypeGroups':
      case 'organizationNameArray':
        params[type] = values;
        break;
      case 'projectSecurityQualifications':
        params[type] = values as SearchProjectsProjectSecurityQualificationsItem[];
        break;
      case 'bidCompanyName':
      case 'publicationDateFrom':
      case 'publicationDateTo':
        params[type] = values[0];
        break;
      case 'plannedPriceFrom':
      case 'plannedPriceTo':
        params[type] = Number(values[0]);
        break;
      case 'isExperienceRequired':
      case 'isOfficeRequired':
        params[type] = values[0] === 'true';
        break;
      case 'deadlineDaysRemaining':
        params[type] = Number(values[0]);
        break;
      case 'participateQualificationTypes':
        params[type] = values;
        break;
      case 'participateQualificationPrefectures':
        params[type] = values;
        break;
      case 'participateQualificationIds':
        params[type] = values.map(Number);
        break;
      case 'participateQualificationGradeIds':
        params[type] = values.flatMap((ids) => ids.split(',').map(Number));
        break;
      case 'noQualification':
        params[type] = values[0] === 'true';
        break;
      case 'tenderOpeningDateFrom':
      case 'tenderOpeningDateTo':
        params[type] = values[0];
        break;
    }
  }

  return params;
}
