export const OnboardingStatus = {
  OPENING: 'opening',
  SEARCH_PRESET_FIRST_HALF: 'search_preset_first_half',
  SEARCH_PRESET_SECOND_HALF: 'search_preset_second_half',
  BUSINESS_DESCRIPTION: 'business_description',
  COMPLETED: 'completed',
} as const;

export type OnboardingStatus = (typeof OnboardingStatus)[keyof typeof OnboardingStatus];

export const OnboardingStatusFlow = [
  OnboardingStatus.OPENING,
  OnboardingStatus.SEARCH_PRESET_FIRST_HALF,
  OnboardingStatus.SEARCH_PRESET_SECOND_HALF,
  OnboardingStatus.BUSINESS_DESCRIPTION,
  OnboardingStatus.COMPLETED,
] as const;
