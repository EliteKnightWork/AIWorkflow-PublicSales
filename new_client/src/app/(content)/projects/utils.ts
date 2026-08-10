import {
  ProcedureType,
  ProjectStatusTab,
  SearchProjectsMethod,
  type SearchProjectsParams,
  SearchProjectsPeriod,
  SearchProjectsProjectSecurityQualificationsItem,
  SortBy,
} from '@/api/generated/models';

// 検索パラメータをURLクエリ文字列に変換する関数
export const convertSearchParamsToQuery = (searchParams: SearchProjectsParams) => {
  const queryParams = new URLSearchParams();
  const params: SearchProjectsParams = searchParams;

  if (params.keywords) {
    queryParams.set('keywords', params.keywords.join(' '));
  }

  if (params.orKeywords) {
    queryParams.set('orKeywords', params.orKeywords.join(' '));
  }

  if (params.notKeywords) {
    queryParams.set('notKeywords', params.notKeywords.join(' '));
  }

  if (params.procedureTypes) {
    queryParams.set('procedureTypes', params.procedureTypes.join(' '));
  }

  if (params.prefectures) {
    queryParams.set('prefectures', params.prefectures.join(' '));
  }

  if (params.period) {
    queryParams.set('period', params.period);
  }

  if (params.page !== undefined) {
    queryParams.set('page', params.page.toString());
  }

  if (params.source) {
    queryParams.set('source', params.source);
  }

  if (params.publicationDateFrom) {
    queryParams.set('publicationDateFrom', params.publicationDateFrom);
  }

  if (params.publicationDateTo) {
    queryParams.set('publicationDateTo', params.publicationDateTo);
  }

  if (params.sortBy) {
    queryParams.set('sortBy', params.sortBy);
  }

  if (params.method) {
    queryParams.set('method', params.method);
  }

  if (params.tab) {
    queryParams.set('tab', params.tab);
  }

  if (params.procedureTypeGroups) {
    queryParams.set('procedureTypeGroups', params.procedureTypeGroups.join(' '));
  }

  if (params.organizationName) {
    queryParams.set('organizationName', params.organizationName);
  }

  if (params.organizationNameArray) {
    queryParams.set('organizationNameArray', params.organizationNameArray.join(','));
  }

  if (params.onlySuccessfulBidders !== undefined) {
    queryParams.set('onlySuccessfulBidders', params.onlySuccessfulBidders.toString());
  }

  if (params.bidCompanyName) {
    queryParams.set('bidCompanyName', params.bidCompanyName);
  }

  if (params.plannedPriceFrom !== undefined) {
    queryParams.set('plannedPriceFrom', params.plannedPriceFrom.toString());
  }

  if (params.plannedPriceTo !== undefined) {
    queryParams.set('plannedPriceTo', params.plannedPriceTo.toString());
  }

  if (params.isExperienceRequired !== undefined) {
    queryParams.set('isExperienceRequired', params.isExperienceRequired.toString());
  }

  if (params.isOfficeRequired !== undefined) {
    queryParams.set('isOfficeRequired', params.isOfficeRequired.toString());
  }

  if (params.useSynonymSearch) {
    queryParams.set('useSynonymSearch', params.useSynonymSearch.toString());
  }

  if (params.projectSecurityQualifications) {
    queryParams.set(
      'projectSecurityQualifications',
      params.projectSecurityQualifications.join(' ')
    );
  }

  if (params.deadlineDaysRemaining !== undefined) {
    queryParams.set('deadlineDaysRemaining', params.deadlineDaysRemaining.toString());
  }

  if (params.participateQualificationTypes) {
    const value_str = params.participateQualificationTypes.join(' ');
    if (value_str.length > 0) {
      queryParams.set('participateQualificationTypes', value_str);
    }
  }

  if (params.participateQualificationPrefectures) {
    const value_str = params.participateQualificationPrefectures.join(' ');
    if (value_str.length > 0) {
      queryParams.set('participateQualificationPrefectures', value_str);
    }
  }

  if (params.participateQualificationIds) {
    const value_str = params.participateQualificationIds.map((id) => id.toString()).join(' ');
    if (value_str.length > 0) {
      queryParams.set('participateQualificationIds', value_str);
    }
  }

  if (params.participateQualificationGradeIds) {
    const value_str = params.participateQualificationGradeIds.map((id) => id.toString()).join(' ');
    if (value_str.length > 0) {
      queryParams.set('participateQualificationGradeIds', value_str);
    }
  }

  if (params.noQualification) {
    queryParams.set('noQualification', params.noQualification.toString());
  }

  if (params.tenderOpeningDateFrom) {
    queryParams.set('tenderOpeningDateFrom', params.tenderOpeningDateFrom);
  }

  if (params.tenderOpeningDateTo) {
    queryParams.set('tenderOpeningDateTo', params.tenderOpeningDateTo);
  }

  return queryParams;
};

// URLクエリまたは検索パラメータオブジェクトを正規化した検索パラメータに変換する関数
export const convertQueryToSearchParams = (
  searchParams: URLSearchParams | SearchProjectsParams
): SearchProjectsParams => {
  let params: SearchProjectsParams = {};

  const isURLSearchParams = searchParams instanceof URLSearchParams;

  if (isURLSearchParams) {
    params = convertQueryToSearchParamsWithUrlParams(searchParams);
  } else {
    params = convertQueryToSearchParamsWithProjectParams(searchParams);
  }

  return params;
};

// URLSearchParamsから検索パラメータに変換する内部関数
function convertQueryToSearchParamsWithUrlParams(
  searchParams: URLSearchParams
): SearchProjectsParams {
  const params: SearchProjectsParams = {};

  const keywords = searchParams.getAll('keywords');
  if (keywords.length > 0) {
    params.keywords = keywords.flatMap((w) => w.split(' '));
  }

  const orKeywords = searchParams.getAll('orKeywords');
  if (orKeywords.length > 0) {
    params.orKeywords = orKeywords.flatMap((w) => w.split(' '));
  }

  const notKeywords = searchParams.getAll('notKeywords');
  if (notKeywords.length > 0) {
    params.notKeywords = notKeywords.flatMap((w) => w.split(' '));
  }

  const procedureTypes = searchParams.getAll('procedureTypes');
  if (procedureTypes.length > 0) {
    // ProcedureType に含まれる値のみをフィルタリング
    params.procedureTypes = procedureTypes
      .flatMap((p) => p.split(' '))
      .filter((p) => (Object.values(ProcedureType) as string[]).includes(p))
      .map((p) => p as ProcedureType);
  }

  const prefectures = searchParams.getAll('prefectures');
  if (prefectures.length > 0) {
    params.prefectures = prefectures.flatMap((p) => p.split(' '));
  }

  const period = searchParams.get('period');
  if (period) {
    // SearchProjectsPeriod に含まれる値の場合のみ
    if ((Object.values(SearchProjectsPeriod) as string[]).includes(period)) {
      params.period = period as SearchProjectsPeriod;
    }
  }

  const page = searchParams.get('page');
  if (page) {
    const parsedPage = Number.parseInt(page, 10);
    if (!Number.isNaN(parsedPage)) {
      params.page = parsedPage;
    }
  }

  const source = searchParams.get('source');
  if (source) {
    params.source = source;
  }

  const publicationDateFrom = searchParams.get('publicationDateFrom');
  if (publicationDateFrom) {
    params.publicationDateFrom = publicationDateFrom;
  }

  const publicationDateTo = searchParams.get('publicationDateTo');
  if (publicationDateTo) {
    params.publicationDateTo = publicationDateTo;
  }

  const sortBy = searchParams.get('sortBy');
  if (sortBy) {
    // SortBy に含まれる値の場合のみ
    if ((Object.values(SortBy) as string[]).includes(sortBy)) {
      params.sortBy = sortBy as SortBy;
    }
  }

  const method = searchParams.get('method');
  if (method) {
    // SearchProjectsMethod に含まれる値の場合のみ
    if ((Object.values(SearchProjectsMethod) as string[]).includes(method)) {
      params.method = method as SearchProjectsMethod;
    }
  }

  const tab = searchParams.get('tab');
  if (tab) {
    // ProjectStatusTab に含まれる値の場合のみ
    if ((Object.values(ProjectStatusTab) as string[]).includes(tab)) {
      params.tab = tab as ProjectStatusTab;
    }
  }

  const procedureTypeGroups = searchParams.getAll('procedureTypeGroups');
  if (procedureTypeGroups.length > 0) {
    params.procedureTypeGroups = procedureTypeGroups.flatMap((p) => p.split(' '));
  }

  const organizationName = searchParams.get('organizationName');
  if (organizationName) {
    params.organizationName = organizationName;
  }

  const organizationNameArray = searchParams.getAll('organizationNameArray');
  if (organizationNameArray.length > 0) {
    params.organizationNameArray = organizationNameArray.flatMap((o) => o.split(','));
  }

  const onlySuccessfulBidders = searchParams.get('onlySuccessfulBidders');
  if (onlySuccessfulBidders) {
    params.onlySuccessfulBidders = onlySuccessfulBidders === 'true';
  }

  const bidCompanyName = searchParams.get('bidCompanyName');
  if (bidCompanyName) {
    params.bidCompanyName = bidCompanyName;
  }

  const plannedPriceFrom = searchParams.get('plannedPriceFrom');
  if (plannedPriceFrom) {
    const parsedPlannedPriceFrom = Number.parseInt(plannedPriceFrom, 10);
    if (!Number.isNaN(parsedPlannedPriceFrom)) {
      params.plannedPriceFrom = parsedPlannedPriceFrom;
    }
  }

  const plannedPriceTo = searchParams.get('plannedPriceTo');
  if (plannedPriceTo) {
    const parsedPlannedPriceTo = Number.parseInt(plannedPriceTo, 10);
    if (!Number.isNaN(parsedPlannedPriceTo)) {
      params.plannedPriceTo = parsedPlannedPriceTo;
    }
  }

  const isExperienceRequired = searchParams.get('isExperienceRequired');
  if (isExperienceRequired) {
    params.isExperienceRequired = isExperienceRequired === 'true';
  }

  const isOfficeRequired = searchParams.get('isOfficeRequired');
  if (isOfficeRequired) {
    params.isOfficeRequired = isOfficeRequired === 'true';
  }

  const useSynonymSearch = searchParams.get('useSynonymSearch');
  if (useSynonymSearch) {
    params.useSynonymSearch = useSynonymSearch === 'true';
  }

  const projectSecurityQualifications = searchParams.getAll('projectSecurityQualifications');
  if (projectSecurityQualifications.length > 0) {
    // SearchProjectsProjectSecurityQualificationsItem に含まれる値のみをフィルタリング
    params.projectSecurityQualifications = projectSecurityQualifications
      .flatMap((p) => p.split(' '))
      .filter((p) =>
        (Object.values(SearchProjectsProjectSecurityQualificationsItem) as string[]).includes(p)
      )
      .map((p) => p as SearchProjectsProjectSecurityQualificationsItem);
  }

  const deadlineDaysRemaining = searchParams.get('deadlineDaysRemaining');
  if (deadlineDaysRemaining) {
    const parsedDeadlineDaysRemaining = Number.parseInt(deadlineDaysRemaining, 10);
    if (!Number.isNaN(parsedDeadlineDaysRemaining)) {
      params.deadlineDaysRemaining = parsedDeadlineDaysRemaining;
    }
  }

  const participateQualificationTypes = searchParams.getAll('participateQualificationTypes');
  if (participateQualificationTypes.length > 0) {
    params.participateQualificationTypes = participateQualificationTypes.flatMap((t) =>
      t.split(' ')
    );
  }

  const participateQualificationPrefectures = searchParams.getAll(
    'participateQualificationPrefectures'
  );
  if (participateQualificationPrefectures.length > 0) {
    params.participateQualificationPrefectures = participateQualificationPrefectures.flatMap((p) =>
      p.split(' ')
    );
  }

  const participateQualificationIds = searchParams.getAll('participateQualificationIds');
  if (participateQualificationIds.length > 0) {
    params.participateQualificationIds = participateQualificationIds
      .flatMap((id) => id.split(' '))
      .map((id) => Number.parseInt(id, 10))
      .filter((id) => !Number.isNaN(id));
  }

  const participateQualificationGradeIds = searchParams.getAll('participateQualificationGradeIds');
  if (participateQualificationGradeIds.length > 0) {
    params.participateQualificationGradeIds = participateQualificationGradeIds
      .flatMap((id) => id.split(' '))
      .map((id) => Number.parseInt(id, 10))
      .filter((id) => !Number.isNaN(id));
  }

  const noQualification = searchParams.get('noQualification');
  if (noQualification === 'true') {
    params.noQualification = true;
  }

  const tenderOpeningDateFrom = searchParams.get('tenderOpeningDateFrom');
  if (tenderOpeningDateFrom) {
    params.tenderOpeningDateFrom = tenderOpeningDateFrom;
  }

  const tenderOpeningDateTo = searchParams.get('tenderOpeningDateTo');
  if (tenderOpeningDateTo) {
    params.tenderOpeningDateTo = tenderOpeningDateTo;
  }

  return params;
}

// サーバー側でクエリパラメータから検索パラメータに変換する内部関数
const convertQueryToSearchParamsWithProjectParams = (
  searchParams: SearchProjectsParams
): SearchProjectsParams => {
  const params: SearchProjectsParams = {};

  const keywords = searchParams.keywords;
  if (keywords)
    if (Array.isArray(keywords) && keywords.length > 0) {
      params.keywords = keywords.flatMap((w) => w.split(' '));
    } else {
      params.keywords = keywords.toString().split(' ');
    }

  const orKeywords = searchParams.orKeywords;
  if (orKeywords) {
    if (Array.isArray(orKeywords) && orKeywords.length > 0) {
      params.orKeywords = orKeywords.flatMap((w) => w.split(' '));
    } else {
      params.orKeywords = orKeywords.toString().split(' ');
    }
  }

  const notKeywords = searchParams.notKeywords;
  if (notKeywords) {
    if (Array.isArray(notKeywords) && notKeywords.length > 0) {
      params.notKeywords = notKeywords.flatMap((w) => w.split(' '));
    } else {
      params.notKeywords = notKeywords.toString().split(' ');
    }
  }

  const procedureTypes = searchParams.procedureTypes;
  if (procedureTypes) {
    if (Array.isArray(procedureTypes) && procedureTypes.length > 0) {
      params.procedureTypes = procedureTypes
        .flatMap((p) => p?.split(' '))
        .filter((p) => p && (Object.values(ProcedureType) as string[]).includes(p))
        .map((p) => p as ProcedureType);
    } else {
      params.procedureTypes = procedureTypes
        .toString()
        .split(' ')
        .filter((p) => p && (Object.values(ProcedureType) as string[]).includes(p))
        .map((p) => p as ProcedureType);
    }
  }

  const prefectures = searchParams.prefectures;
  if (prefectures) {
    if (Array.isArray(prefectures) && prefectures.length > 0) {
      params.prefectures = prefectures.flatMap((p) => p.split(' '));
    } else {
      params.prefectures = prefectures.toString().split(' ');
    }
  }

  const period = searchParams.period;
  if (period) {
    // SearchProjectsPeriod に含まれる値の場合のみ
    if ((Object.values(SearchProjectsPeriod) as string[]).includes(period)) {
      params.period = period as SearchProjectsPeriod;
    }
  }

  const page = searchParams.page;
  if (page !== undefined) {
    const parsedPage = Number.parseInt(page.toString(), 10);
    if (!Number.isNaN(parsedPage)) {
      params.page = parsedPage;
    }
  }

  const source = searchParams.source;
  if (source) {
    params.source = source;
  }

  const publicationDateFrom = searchParams.publicationDateFrom;
  if (publicationDateFrom) {
    params.publicationDateFrom = publicationDateFrom;
  }

  const publicationDateTo = searchParams.publicationDateTo;
  if (publicationDateTo) {
    params.publicationDateTo = publicationDateTo;
  }

  const sortBy = searchParams.sortBy;
  if (sortBy) {
    // SortBy に含まれる値の場合のみ
    if ((Object.values(SortBy) as string[]).includes(sortBy)) {
      params.sortBy = sortBy as SortBy;
    }
  }

  const method = searchParams.method;
  if (method) {
    // SearchProjectsMethod に含まれる値の場合のみ
    if ((Object.values(SearchProjectsMethod) as string[]).includes(method)) {
      params.method = method as SearchProjectsMethod;
    }
  }

  const tab = searchParams.tab;
  if (tab) {
    // ProjectStatusTab に含まれる値の場合のみ
    if ((Object.values(ProjectStatusTab) as string[]).includes(tab)) {
      params.tab = tab as ProjectStatusTab;
    }
  }

  const procedureTypeGroups = searchParams.procedureTypeGroups;
  if (procedureTypeGroups) {
    if (Array.isArray(procedureTypeGroups) && procedureTypeGroups.length > 0) {
      params.procedureTypeGroups = procedureTypeGroups.flatMap((p) => p.split(' '));
    } else {
      params.procedureTypeGroups = procedureTypeGroups.toString().split(' ');
    }
  }

  const organizationName = searchParams.organizationName;
  if (organizationName) {
    params.organizationName = organizationName;
  }

  const organizationNameArray = searchParams.organizationNameArray;
  if (organizationNameArray) {
    if (Array.isArray(organizationNameArray) && organizationNameArray.length > 0) {
      params.organizationNameArray = organizationNameArray.flatMap((o) => o.split(','));
    } else {
      params.organizationNameArray = organizationNameArray.toString().split(',');
    }
  }

  const onlySuccessfulBidders = searchParams.onlySuccessfulBidders;
  if (onlySuccessfulBidders !== undefined) {
    params.onlySuccessfulBidders =
      onlySuccessfulBidders === true || onlySuccessfulBidders.toString() === 'true';
  }

  const bidCompanyName = searchParams.bidCompanyName;
  if (bidCompanyName) {
    params.bidCompanyName = bidCompanyName;
  }

  const plannedPriceFrom = searchParams.plannedPriceFrom;
  if (plannedPriceFrom !== undefined) {
    const parsedPlannedPriceFrom = Number.parseInt(plannedPriceFrom.toString(), 10);
    if (!Number.isNaN(parsedPlannedPriceFrom)) {
      params.plannedPriceFrom = parsedPlannedPriceFrom;
    }
  }

  const plannedPriceTo = searchParams.plannedPriceTo;
  if (plannedPriceTo !== undefined) {
    const parsedPlannedPriceTo = Number.parseInt(plannedPriceTo.toString(), 10);
    if (!Number.isNaN(parsedPlannedPriceTo)) {
      params.plannedPriceTo = parsedPlannedPriceTo;
    }
  }

  const isExperienceRequired = searchParams.isExperienceRequired;
  if (isExperienceRequired !== undefined) {
    params.isExperienceRequired =
      isExperienceRequired === true || isExperienceRequired.toString() === 'true';
  }

  const isOfficeRequired = searchParams.isOfficeRequired;
  if (isOfficeRequired !== undefined) {
    params.isOfficeRequired = isOfficeRequired === true || isOfficeRequired.toString() === 'true';
  }

  const useSynonymSearch = searchParams.useSynonymSearch;
  if (useSynonymSearch !== undefined) {
    params.useSynonymSearch = useSynonymSearch === true || useSynonymSearch.toString() === 'true';
  }

  const projectSecurityQualifications = searchParams.projectSecurityQualifications;
  if (projectSecurityQualifications) {
    if (Array.isArray(projectSecurityQualifications) && projectSecurityQualifications.length > 0) {
      params.projectSecurityQualifications = projectSecurityQualifications
        .flatMap((p) => p.split(' '))
        .filter(
          (p) =>
            p &&
            (Object.values(SearchProjectsProjectSecurityQualificationsItem) as string[]).includes(p)
        )
        .map((p) => p as SearchProjectsProjectSecurityQualificationsItem);
    } else {
      params.projectSecurityQualifications = projectSecurityQualifications
        .toString()
        .split(' ')
        .filter(
          (p) =>
            p &&
            (Object.values(SearchProjectsProjectSecurityQualificationsItem) as string[]).includes(p)
        )
        .map((p) => p as SearchProjectsProjectSecurityQualificationsItem);
    }
  }

  const deadlineDaysRemaining = searchParams.deadlineDaysRemaining;
  if (deadlineDaysRemaining !== undefined) {
    const parsedDeadlineDaysRemaining = Number.parseInt(deadlineDaysRemaining.toString(), 10);
    if (!Number.isNaN(parsedDeadlineDaysRemaining)) {
      params.deadlineDaysRemaining = parsedDeadlineDaysRemaining;
    }
  }

  const participateQualificationTypes = searchParams.participateQualificationTypes;
  if (participateQualificationTypes) {
    if (Array.isArray(participateQualificationTypes) && participateQualificationTypes.length > 0) {
      params.participateQualificationTypes = participateQualificationTypes.flatMap((t) =>
        t.split(' ')
      );
    } else {
      params.participateQualificationTypes = participateQualificationTypes.toString().split(' ');
    }
  }

  const participateQualificationPrefectures = searchParams.participateQualificationPrefectures;
  if (participateQualificationPrefectures) {
    if (
      Array.isArray(participateQualificationPrefectures) &&
      participateQualificationPrefectures.length > 0
    ) {
      params.participateQualificationPrefectures = participateQualificationPrefectures.flatMap(
        (p) => p.split(' ')
      );
    } else {
      params.participateQualificationPrefectures = participateQualificationPrefectures
        .toString()
        .split(' ');
    }
  }

  const participateQualificationIds = searchParams.participateQualificationIds;
  if (participateQualificationIds) {
    if (Array.isArray(participateQualificationIds) && participateQualificationIds.length > 0) {
      params.participateQualificationIds = participateQualificationIds
        .map((id) => Number.parseInt(id.toString(), 10))
        .filter((id) => !Number.isNaN(id));
    } else {
      const parsedId = Number.parseInt(participateQualificationIds.toString(), 10);
      if (!Number.isNaN(parsedId)) {
        params.participateQualificationIds = [parsedId];
      }
    }
  }

  const participateQualificationGradeIds = searchParams.participateQualificationGradeIds;
  if (participateQualificationGradeIds) {
    if (
      Array.isArray(participateQualificationGradeIds) &&
      participateQualificationGradeIds.length > 0
    ) {
      params.participateQualificationGradeIds = participateQualificationGradeIds
        .map((id) => Number.parseInt(id.toString(), 10))
        .filter((id) => !Number.isNaN(id));
    } else {
      const parsedId = Number.parseInt(participateQualificationGradeIds.toString(), 10);
      if (!Number.isNaN(parsedId)) {
        params.participateQualificationGradeIds = [parsedId];
      }
    }
  }

  const tenderOpeningDateFrom = searchParams.tenderOpeningDateFrom;
  if (tenderOpeningDateFrom) {
    params.tenderOpeningDateFrom = tenderOpeningDateFrom;
  }

  const tenderOpeningDateTo = searchParams.tenderOpeningDateTo;
  if (tenderOpeningDateTo) {
    params.tenderOpeningDateTo = tenderOpeningDateTo;
  }

  const noQualification = searchParams.noQualification;
  if (noQualification !== undefined) {
    params.noQualification = noQualification === true || noQualification.toString() === 'true';
  }

  return params;
};
