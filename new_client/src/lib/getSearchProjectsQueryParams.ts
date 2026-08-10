import type { SearchProjectsParams } from '@/api/generated/models';

export const getSearchProjectsQueryParams = (searchParams: SearchProjectsParams) => {
  const params = new URLSearchParams();
  if (searchParams.keywords) {
    params.set('keywords', searchParams.keywords.join(' '));
  }
  if (searchParams.orKeywords) {
    params.set('orKeywords', searchParams.orKeywords.join(' '));
  }
  if (searchParams.notKeywords) {
    params.set('notKeywords', searchParams.notKeywords.join(' '));
  }
  if (searchParams.organizationNameArray) {
    params.set('organizationNameArray', searchParams.organizationNameArray.join(','));
  }
  if (searchParams.bidCompanyName) {
    params.set('bidCompanyName', searchParams.bidCompanyName);
    params.set('tab', 'bid');
  }
  if (searchParams.tab && params.get('tab') === null) {
    params.set('tab', searchParams.tab);
  }
  if (searchParams.page) {
    params.set('page', searchParams.page.toString());
  }
  if (searchParams.prefectures) {
    params.set('prefectures', searchParams.prefectures.join(' '));
  }
  if (searchParams.procedureTypeGroups) {
    params.set('procedureTypeGroups', searchParams.procedureTypeGroups.join(' '));
  }
  if (searchParams.sortBy) {
    params.set('sortBy', searchParams.sortBy);
  }
  if (searchParams.plannedPriceFrom) {
    params.set('plannedPriceFrom', searchParams.plannedPriceFrom.toString());
  }
  if (searchParams.plannedPriceTo) {
    params.set('plannedPriceTo', searchParams.plannedPriceTo.toString());
  }
  if (searchParams.publicationDateFrom) {
    params.set('publicationDateFrom', searchParams.publicationDateFrom.toString());
  }
  if (searchParams.publicationDateTo) {
    params.set('publicationDateTo', searchParams.publicationDateTo.toString());
  }
  if (searchParams.projectSecurityQualifications) {
    params.set(
      'projectSecurityQualifications',
      searchParams.projectSecurityQualifications.join(' ')
    );
  }
  if (searchParams.isExperienceRequired !== undefined) {
    params.set('isExperienceRequired', searchParams.isExperienceRequired.toString());
  }
  if (searchParams.isOfficeRequired !== undefined) {
    params.set('isOfficeRequired', searchParams.isOfficeRequired.toString());
  }
  if (searchParams.deadlineDaysRemaining !== undefined) {
    params.set('deadlineDaysRemaining', searchParams.deadlineDaysRemaining.toString());
  }
  if ((searchParams as any).businessDescription) {
    params.set('businessDescription', (searchParams as any).businessDescription);
  }
  if (searchParams.onlySuccessfulBidders) {
    params.set('onlySuccessfulBidders', searchParams.onlySuccessfulBidders.toString());
  }
  if (searchParams.tenderOpeningDateFrom) {
    params.set('tenderOpeningDateFrom', searchParams.tenderOpeningDateFrom.toString());
  }
  if (searchParams.tenderOpeningDateTo) {
    params.set('tenderOpeningDateTo', searchParams.tenderOpeningDateTo.toString());
  }
  return params.toString();
};
