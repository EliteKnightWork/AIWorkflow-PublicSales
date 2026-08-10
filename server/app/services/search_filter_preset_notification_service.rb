class SearchFilterPresetNotificationService
  def initialize(user)
    @user = user
  end

  def remaining_notification_count
    limit = @user.company&.company_functional_limitation&.max_search_filter_preset_notification_count || 
            CompanyFunctionalLimitation::DEFAULT_MAX_SEARCH_FILTER_PRESET_NOTIFICATION_COUNT
    
    limit - @user.search_filter_preset_notifications.count
  end
end