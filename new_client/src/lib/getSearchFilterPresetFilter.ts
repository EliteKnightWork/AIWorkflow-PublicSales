import type { SearchFilterPresetFilter, SearchProjectsParams } from '@/api/generated/models';

export const getSearchFilterPresetFilter = (
  searchParams: SearchProjectsParams
): SearchFilterPresetFilter => {
  return {
    ...(searchParams.keywords && {
      keywords: Array.isArray(searchParams.keywords)
        ? searchParams.keywords
        : (searchParams.keywords as string).split(/\s+/),
    }),
    ...(searchParams.orKeywords && {
      orKeywords: Array.isArray(searchParams.orKeywords)
        ? searchParams.orKeywords
        : (searchParams.orKeywords as string).split(/\s+/),
    }),
    ...(searchParams.notKeywords && {
      notKeywords: Array.isArray(searchParams.notKeywords)
        ? searchParams.notKeywords
        : (searchParams.notKeywords as string).split(/\s+/),
    }),
    ...(searchParams.useSynonymSearch !== undefined && {
      useSynonymSearch: searchParams.useSynonymSearch,
    }),
    ...(searchParams.prefectures && {
      prefectures: searchParams.prefectures.map((prefecture) => Number(prefecture)),
    }),
    ...(searchParams.procedureTypeGroups && {
      procedureTypeGroups: searchParams.procedureTypeGroups,
    }),
    ...(searchParams.organizationNameArray && {
      organizations: searchParams.organizationNameArray,
    }),
    ...(searchParams.plannedPriceFrom && {
      plannedPriceFrom: searchParams.plannedPriceFrom,
    }),
    ...(searchParams.plannedPriceTo && {
      plannedPriceTo: searchParams.plannedPriceTo,
    }),
    ...(searchParams.publicationDateFrom && {
      publicationDateFrom: searchParams.publicationDateFrom,
    }),
    ...(searchParams.publicationDateTo && {
      publicationDateTo: searchParams.publicationDateTo,
    }),
    ...(searchParams.projectSecurityQualifications && {
      projectSecurityQualifications: searchParams.projectSecurityQualifications,
    }),
    ...(searchParams.isExperienceRequired !== undefined && {
      isExperienceRequired: searchParams.isExperienceRequired,
    }),
    ...(searchParams.isOfficeRequired !== undefined && {
      isOfficeRequired: searchParams.isOfficeRequired,
    }),
    ...(searchParams.deadlineDaysRemaining !== undefined && {
      deadlineDaysRemaining: searchParams.deadlineDaysRemaining,
    }),
    ...(searchParams.participateQualificationIds && {
      participateQualificationIds: searchParams.participateQualificationIds,
    }),
    ...(searchParams.participateQualificationGradeIds && {
      participateQualificationGradeIds: searchParams.participateQualificationGradeIds,
    }),
    ...(searchParams.participateQualificationTypes && {
      participateQualificationTypes: searchParams.participateQualificationTypes,
    }),
    ...(searchParams.participateQualificationPrefectures && {
      participateQualificationPrefectures: searchParams.participateQualificationPrefectures,
    }),
    ...(searchParams.noQualification !== undefined && {
      noQualification: searchParams.noQualification,
    }),
    ...(searchParams.tenderOpeningDateFrom && {
      tenderOpeningDateFrom: searchParams.tenderOpeningDateFrom,
    }),
    ...(searchParams.tenderOpeningDateTo && {
      tenderOpeningDateTo: searchParams.tenderOpeningDateTo,
    }),
  };
};
